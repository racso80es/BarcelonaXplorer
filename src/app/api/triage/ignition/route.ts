import { NextRequest, NextResponse } from 'next/server';
import {
  ContextualIgnitionUseCase,
  OpenMeteoWeatherAdapter,
} from '@/features/triage/server';
import { GroqConversationalSlmAdapter } from '@/features/ai-engine/groq/groq-conversational-slm.adapter';
import { LanceDbCognitiveMemoryAdapter } from '@/features/cognitive-memory/server';
import { PrismaTelemetryRepository } from '@/features/telemetry/server';
import { BX_LANG_COOKIE } from '@/features/triage/language-detector';
import { SupportedLanguageVo } from '@/features/i18n';
import { enforcePublicLlmRateLimit } from '@/features/triage/public-llm-rate-limit';
import {
  resolveBxSessionFromRequest,
  applyBxSessionCookie,
} from '@/features/triage/session-perimeter';
import { TelemetryEntry } from '@/features/telemetry';

export const runtime = 'nodejs';

// Instancias compartidas resilientes
const weatherAdapter = new OpenMeteoWeatherAdapter({ timeoutMs: 200 });
const cognitiveMemory = new LanceDbCognitiveMemoryAdapter();

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = enforcePublicLlmRateLimit();
    if (!rateLimitResult.allowed) {
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

    const { sessionId, isNewSession } = resolveBxSessionFromRequest(req);

    const userAgent = req.headers.get('user-agent');
    const language =
      req.cookies.get(BX_LANG_COOKIE)?.value ||
      req.headers.get('accept-language') ||
      'es';

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
      applyBxSessionCookie(response, sessionId);
    }

    const resolvedLang = SupportedLanguageVo.from(
      envelope.result?._sys_lang ?? language,
    ).value;
    response.cookies.set(BX_LANG_COOKIE, resolvedLang, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Error inesperado en ignición contextual';
    try {
      const telemetryRepo = new PrismaTelemetryRepository();
      await telemetryRepo.log(
        new TelemetryEntry(
          'ERROR',
          'SECURITY_PERIMETER',
          '[Aduana /api/triage/ignition] Fallo interno no expuesto al cliente',
          { message: errMessage },
          500,
          0,
        ),
      );
    } catch {
      // fail-soft
    }
    return NextResponse.json(
      {
        success: false,
        exitCode: 1,
        feedback: 'Fallo al ejecutar la ignición contextual',
      },
      { status: 500 },
    );
  }
}
