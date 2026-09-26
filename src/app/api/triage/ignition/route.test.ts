import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

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

    // Debe haber fijado la cookie bx_session_id
    const setCookieHeader = res.headers.get('set-cookie');
    expect(setCookieHeader).toContain('bx_session_id=');
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
