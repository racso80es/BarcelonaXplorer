import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { TriageInputUseCase } from '@/application/use-cases/triage-input.use-case';
import { JevClient } from '@/infrastructure/ai/jev/jevClient';
import { GroqConversationalSlmAdapter } from '@/infrastructure/ai/groq/groq-conversational-slm.adapter';
import { InMemoryDensityMatrixRepository } from '@/infrastructure/repositories/in-memory-density-matrix.repository';
import { GenerateTacticalRouteUseCase } from '@/application/use-cases/generate-tactical-route.use-case';
import { GeminiClient } from '@/infrastructure/ai/gemini-client';
import { PrismaTelemetryRepository } from '@/features/telemetry';
import { GeminiEmbeddingAdapter } from '@/infrastructure/ai/gemini-embedding.adapter';
import { LanceDbCognitiveMemoryAdapter } from '@/infrastructure/vector/lancedb-cognitive-memory.adapter';

export const runtime = 'nodejs';

// Instancia compartida del repositorio de persistencia de matriz de sesión (Laudo 2)
const densityMatrixRepo = new InMemoryDensityMatrixRepository();
const cognitiveMemory = new LanceDbCognitiveMemoryAdapter();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'El prompt es obligatorio y no puede estar vacío.' },
        { status: 400 },
      );
    }

    // Extracción de la Identidad Sombra (Cookie perimetral, Header o UUID nuevo)
    const existingCookie = req.cookies.get('bx_session_id')?.value;
    const isNewSession = !existingCookie;
    const sessionId =
      existingCookie ||
      req.headers.get('x-session-id') ||
      body?.sessionId ||
      randomUUID();

    const matrixId = body?.matrixId || 'default';
    const userLocation = body?.userLocation;

    const telemetryRepo = new PrismaTelemetryRepository();
    const decisionEngine = new JevClient(undefined, telemetryRepo);
    const conversationalSlm = new GroqConversationalSlmAdapter(
      undefined,
      telemetryRepo,
    );
    const geminiClient = new GeminiClient(telemetryRepo);
    const embeddingPort = new GeminiEmbeddingAdapter(undefined, telemetryRepo);
    const routeUseCase = new GenerateTacticalRouteUseCase(
      geminiClient,
      telemetryRepo,
    );

    // Laudo 1 & 2 + PBI-COG-MEM-005: Orquestador unificado con despacho interno y RAG cognitivo
    const useCase = new TriageInputUseCase(
      decisionEngine,
      conversationalSlm,
      densityMatrixRepo,
      routeUseCase,
      telemetryRepo,
      undefined,
      cognitiveMemory,
      embeddingPort,
    );

    const outcome = await useCase.execute({
      sessionId,
      prompt,
      matrixId,
      userLocation,
    });

    const dto = outcome.toDto();
    const httpStatus = dto.status === 'REBOUND_OUT_OF_SCOPE' ? 422 : 200;

    const response = NextResponse.json(dto, { status: httpStatus });

    // Si la sesión no existía en cookies, la inyectamos como cookie de sesión efímera
    if (isNewSession) {
      response.cookies.set('bx_session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }

    return response;
  } catch (error: unknown) {
    console.error('[API /api/triage Error]:', error);
    return NextResponse.json(
      {
        error: 'Fallo interno en la Aduana Universal de Triaje.',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    );
  }
}
