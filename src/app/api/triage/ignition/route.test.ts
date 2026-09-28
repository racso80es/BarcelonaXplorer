import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { resetPublicLlmRateLimitForTests } from '@/features/triage/public-llm-rate-limit';

vi.mock('@/features/ai-engine/groq/groq-conversational-slm.adapter', () => {
  return {
    GroqConversationalSlmAdapter: class {
      generateContextualGreeting() {
        return Promise.resolve('¡Buenos días! Bienvenido a Barcelona.');
      }
    },
  };
});

vi.mock('@/features/cognitive-memory', () => {
  return {
    LanceDbCognitiveMemoryAdapter: class {
      getLatestSessionMemory() {
        return Promise.resolve(null);
      }
    },
  };
});

vi.mock('@/features/telemetry', () => {
  return {
    PrismaTelemetryRepository: class {
      log() {
        return Promise.resolve();
      }
    },
    TelemetryEntry: class {},
  };
});

describe('GET /api/triage/ignition', () => {
  beforeEach(() => {
    resetPublicLlmRateLimitForTests();
    vi.clearAllMocks();
  });

  it('ejecuta la ignición y retorna el sobre tipado con código 200 y fija cookie si es sesión nueva', async () => {
    const req = new NextRequest('http://localhost:3000/api/triage/ignition', {
      headers: {
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        'accept-language': 'es-ES,es;q=0.9',
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.result).toBeDefined();
    expect(body.result.greeting).toContain('Barcelona');
    expect(body.result.device).toBe('MOBILE');
    expect(body.result.sparks).toBeInstanceOf(Array);

    // Debe haber fijado la cookie bx_session_id y la cookie de idioma
    const setCookieHeader = res.headers.get('set-cookie');
    expect(setCookieHeader).toContain('bx_session_id=');
    expect(setCookieHeader).toContain('bx_lang=es');
  });

  it('normaliza Accept-Language fuera de whitelist a castellano y emite bx_lang=es', async () => {
    const req = new NextRequest('http://localhost:3000/api/triage/ignition', {
      headers: {
        'accept-language': 'ru-RU,ru;q=0.9',
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result._sys_lang).toBe('es');
    expect(res.headers.get('set-cookie')).toContain('bx_lang=es');
  });

  it('respeta la cookie soberana bx_lang frente a Accept-Language', async () => {
    const req = new NextRequest('http://localhost:3000/api/triage/ignition', {
      headers: {
        'accept-language': 'de-DE,de;q=0.9',
        cookie: 'bx_lang=en; bx_session_id=12345678-1234-4234-8234-123456789012',
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result._sys_lang).toBe('en');
    expect(res.headers.get('set-cookie')).toContain('bx_lang=en');
  });

  it('respeta la cookie existente bx_session_id', async () => {
    const existingSessionId = '12345678-1234-4234-8234-123456789012';
    const req = new NextRequest('http://localhost:3000/api/triage/ignition', {
      headers: {
        cookie: `bx_session_id=${existingSessionId}`,
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
