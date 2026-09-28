import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { resetPublicLlmRateLimitForTests } from '@/features/triage/public-llm-rate-limit';
import { TriageOutcome } from '@/features/triage/triage-outcome.vo';

vi.mock('@/features/triage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/triage')>();
  return {
    ...actual,
    TriageInputUseCase: class {
      execute() {
        return Promise.resolve(
          TriageOutcome.createCasualDialogue({
            sessionId: 'ignored-in-mock',
            matrixId: 'default',
            dialogueMessage: 'ok',
            durationMs: 1,
          }),
        );
      }
    },
  };
});

vi.mock('@/features/ai-engine/jev/jevClient', () => ({
  JevClient: class {},
}));
vi.mock('@/features/ai-engine/groq/groq-conversational-slm.adapter', () => ({
  GroqConversationalSlmAdapter: class {},
}));
vi.mock('@/features/planner/server', () => ({
  InMemoryDensityMatrixRepository: class {},
  GenerateTacticalRouteUseCase: class {},
  PrismaItineraryRepository: class {},
  AffiliateEnricherService: class {},
}));
vi.mock('@/features/ai-engine', () => ({
  GeminiClient: class {},
  GeminiEmbeddingAdapter: class {},
}));
vi.mock('@/features/cognitive-memory', () => ({
  LanceDbCognitiveMemoryAdapter: class {},
  LanceDbSemanticCacheAdapter: class {},
}));
vi.mock('@/features/telemetry', () => ({
  PrismaTelemetryRepository: class {
    log() {
      return Promise.resolve();
    }
  },
  TelemetryEntry: class {},
}));

function triageRequest(init?: {
  cookie?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}): NextRequest {
  const headers = new Headers(init?.headers ?? {});
  if (init?.cookie) {
    headers.set('cookie', init.cookie);
  }
  return new NextRequest('http://localhost:3000/api/triage', {
    method: 'POST',
    headers,
    body: JSON.stringify(init?.body ?? { prompt: 'hola' }),
  });
}

describe('POST /api/triage (PBI-STEEL-004)', () => {
  beforeEach(() => {
    resetPublicLlmRateLimitForTests();
    vi.clearAllMocks();
  });

  it('ignora x-session-id y body.sessionId para la identidad', async () => {
    const res = await POST(
      triageRequest({
        headers: {
          'x-session-id': 'header-session',
        },
        body: { prompt: 'hola', sessionId: 'body-session' },
      }),
    );
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('bx_session_id=');
    expect(setCookie).not.toContain('header-session');
    expect(setCookie).not.toContain('body-session');
  });

  it('reutiliza bx_session_id de cookie sin emitir nueva sesión', async () => {
    const res = await POST(
      triageRequest({
        cookie: 'bx_session_id=fixed-session-uuid',
      }),
    );
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).not.toContain('bx_session_id=fixed-session-uuid');
  });

  it('devuelve 400 con OperationEnvelope si el cuerpo no valida (PBI-STEEL-006)', async () => {
    const res = await POST(triageRequest({ body: { prompt: '' } }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(Array.isArray(body.errors)).toBe(true);
  });

  it('devuelve 429 con Retry-After al agotar el cubo global aunque cambien IP y cookie', async () => {
    for (let i = 0; i < 10; i++) {
      const ok = await POST(
        triageRequest({
          cookie: `bx_session_id=sess-${i}`,
          headers: {
            'x-forwarded-for': `10.0.0.${i}`,
            'cf-connecting-ip': `203.0.113.${i}`,
          },
        }),
      );
      expect(ok.status).toBe(200);
    }

    const blocked = await POST(
      triageRequest({
        cookie: 'bx_session_id=another',
        headers: {
          'x-forwarded-for': '8.8.8.8',
          'cf-connecting-ip': '1.1.1.1',
        },
      }),
    );
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
  });

});
