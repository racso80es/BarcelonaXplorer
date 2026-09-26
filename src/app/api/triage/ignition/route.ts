import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import {
  ContextualIgnitionUseCase,
  OpenMeteoWeatherAdapter,
} from '@/features/triage';
import { GroqConversationalSlmAdapter } from '@/features/ai-engine/groq/groq-conversational-slm.adapter';
import { LanceDbCognitiveMemoryAdapter } from '@/features/cognitive-memory';
import { PrismaTelemetryRepository } from '@/features/telemetry';

export const runtime = 'nodejs';

// Instancias compartidas resilientes
const weatherAdapter = new OpenMeteoWeatherAdapter({ timeoutMs: 200 });
const cognitiveMemory = new LanceDbCognitiveMemoryAdapter();

export async function GET(req: NextRequest) {
  try {
    const existingCookie = req.cookies.get('bx_session_id')?.value;
    const isNewSession = !existingCookie;
    const sessionId =
      existingCookie ||
      req.headers.get('x-session-id') ||
      randomUUID();

    const userAgent = req.headers.get('user-agent');
    const language = req.headers.get('accept-language') || 'es';

    const telemetryRepo = new PrismaTelemetryRepository();
    const conversationalSlm = new GroqConversationalSlmAdapter(
      undefined,
      telemetryRepo,
    );

    const useCase = new ContextualIgnitionUseCase(
      conversationalSlm,
      weatherAdapter,
      cognitiveMemory,
      telemetryRepo,
    );

    const envelope = await useCase.execute({
      sessionId,
      userAgent,
      language,
      clientTimestamp: Date.now(),
    });

    const response = NextResponse.json(envelope, {
      status: envelope.success ? 200 : 500,
    });

    // Fijar la cookie perimetral de identidad si es una sesión nueva
    if (isNewSession) {
      response.cookies.set('bx_session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 días
      });
    }

    return response;
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Error inesperado en ignición contextual';
    return NextResponse.json(
      {
        success: false,
        exitCode: 1,
        errors: [errMessage],
        feedback: 'Fallo al ejecutar la ignición contextual',
      },
      { status: 500 },
    );
  }
}
