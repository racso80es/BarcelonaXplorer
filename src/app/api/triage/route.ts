import { NextRequest, NextResponse } from 'next/server';
import { TriageInputUseCase } from '@/features/triage/server';
import { GroqConversationalSlmAdapter } from '@/features/ai-engine/groq/groq-conversational-slm.adapter';
import {
  InMemoryDensityMatrixRepository,
  GenerateTacticalRouteUseCase,
  PrismaItineraryRepository,
  AffiliateEnricherService,
} from '@/features/planner/server';
import {
  IaGatewayClient,
  GeminiEmbeddingAdapter,
} from '@/features/ai-engine/server';
import { PrismaTelemetryRepository } from '@/features/telemetry/server';
import {
  LanceDbCognitiveMemoryAdapter,
  LanceDbSemanticCacheAdapter,
} from '@/features/cognitive-memory/server';
import { TelemetryEntry } from '@/features/telemetry';
import { BX_LANG_COOKIE } from '@/features/triage/language-detector';
import {
  enforcePublicLlmRateLimit,
} from '@/features/triage/public-llm-rate-limit';
import {
  resolveBxSessionFromRequest,
  applyBxSessionCookie,
} from '@/features/triage/session-perimeter';
import { SupportedLanguageVo } from '@/features/i18n';
import { TriageInputSchema } from '@/features/triage/triage.schema';
import { createErrorEnvelope } from '@/shared/operation-envelope';
import { ZodError } from 'zod';

export const runtime = 'nodejs';

// Instancia compartida del repositorio de persistencia de matriz de sesión (Laudo 2)
const densityMatrixRepo = new InMemoryDensityMatrixRepository();
const cognitiveMemory = new LanceDbCognitiveMemoryAdapter();
const semanticCache = new LanceDbSemanticCacheAdapter();

export async function POST(req: NextRequest) {
  try {
    const rawBody: unknown = await req.json().catch(() => ({}));
    const { sessionId, isNewSession } = resolveBxSessionFromRequest(req);

    const bodyRecord =
      typeof rawBody === 'object' && rawBody !== null
        ? (rawBody as Record<string, unknown>)
        : {};

    const parsedInput = TriageInputSchema.safeParse({
      ...bodyRecord,
      sessionId,
    });

    if (!parsedInput.success) {
      return NextResponse.json(
        createErrorEnvelope(
          parsedInput.error.issues.map(
            (issue) => `${issue.path.join('.')}: ${issue.message}`,
          ),
          1,
          'Cuerpo de triaje inválido',
        ),
        { status: 400 },
      );
    }

    const {
      prompt,
      matrixId,
      userLocation,
      clientLanguage: bodyClientLanguage,
    } = parsedInput.data;

    const rateLimitResult = enforcePublicLlmRateLimit();
    if (!rateLimitResult.allowed) {
      const telemetryRepo = new PrismaTelemetryRepository();
      await telemetryRepo.log(
        new TelemetryEntry(
          'WARN',
          'SECURITY_PERIMETER',
          '[Aduana /api/triage] Límite de tasa excedido por Token Bucket (cubo global)',
          {
            retryAfterSeconds: rateLimitResult.retryAfterSeconds,
          },
          429,
          0,
        ),
      );

      return NextResponse.json(
        {
          error: 'Demasiadas peticiones. Límite de tasa excedido.',
          retryAfterSeconds: rateLimitResult.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfterSeconds),
          },
        },
      );
    }

    const clientLanguage =
      req.cookies.get(BX_LANG_COOKIE)?.value ||
      bodyClientLanguage ||
      req.headers.get('accept-language') ||
      undefined;

    const telemetryRepo = new PrismaTelemetryRepository();
    const iaGatewayClient = new IaGatewayClient(undefined, telemetryRepo);
    const decisionEngine = iaGatewayClient;
    const conversationalSlm = new GroqConversationalSlmAdapter(
      undefined,
      telemetryRepo,
    );
    const embeddingPort = new GeminiEmbeddingAdapter(undefined, telemetryRepo);
    const routeUseCase = new GenerateTacticalRouteUseCase(
      iaGatewayClient,
      telemetryRepo,
    );
    const itineraryRepo = new PrismaItineraryRepository();
    const affiliateEnricher = new AffiliateEnricherService();

    // Laudo 1 & 2 + PBI-COG-MEM-005 + PBI-ARCH-ORCH-001: Orquestador unificado
    const useCase = new TriageInputUseCase(
      decisionEngine,
      conversationalSlm,
      densityMatrixRepo,
      routeUseCase,
      telemetryRepo,
      undefined,
      cognitiveMemory,
      embeddingPort,
      affiliateEnricher,
      itineraryRepo,
      semanticCache,
    );

    const outcome = await useCase.execute({
      sessionId,
      prompt,
      matrixId,
      userLocation,
      clientLanguage,
    });

    const dto = outcome.toDto();
    const httpStatus = dto.status === 'REBOUND_OUT_OF_SCOPE' ? 422 : 200;

    const response = NextResponse.json(dto, { status: httpStatus });

    // Si la sesión no existía en cookies, la inyectamos como cookie de sesión efímera
    if (isNewSession) {
      applyBxSessionCookie(response, sessionId);
    }

    response.cookies.set(
      BX_LANG_COOKIE,
      SupportedLanguageVo.from(dto._sys_lang).value,
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      },
    );

    return response;
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        createErrorEnvelope(
          error.issues.map(
            (issue) => `${issue.path.join('.')}: ${issue.message}`,
          ),
          1,
          'Validación de triaje fallida',
        ),
        { status: 400 },
      );
    }
    console.error('[API /api/triage Error]:', error);
    try {
      const telemetryRepo = new PrismaTelemetryRepository();
      await telemetryRepo.log(
        new TelemetryEntry(
          'ERROR',
          'SECURITY_PERIMETER',
          '[Aduana /api/triage] Fallo interno no expuesto al cliente',
          {
            message: error instanceof Error ? error.message : String(error),
          },
          500,
          0,
        ),
      );
    } catch {
      // fail-soft telemetría
    }
    return NextResponse.json(
      { error: 'Fallo interno en la Aduana Universal de Triaje.' },
      { status: 500 },
    );
  }
}
