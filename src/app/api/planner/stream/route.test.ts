import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

vi.mock('@/features/telemetry/server', () => ({
  PrismaTelemetryRepository: class {
    log = vi.fn().mockResolvedValue(undefined);
  },
}));

const mockGenerateStream = vi.fn();

vi.mock('@/features/ai-engine/server', () => {
  return {
    GenerateFastRadarUseCase: class {
      execute(...args: unknown[]) {
        return mockGenerateStream(...args);
      }
    },
    GatewayFastRadarAdapter: class {},
  };
});

describe('POST /api/planner/stream (CA-5, CA-6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve 400 si el payload JSON es inválido', async () => {
    const req = new Request('http://localhost:3000/api/planner/stream', {
      method: 'POST',
      body: 'invalid-json',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { ok: boolean; error: string };
    expect(data.ok).toBe(false);
  });

  it('devuelve 400 si intention está vacío', async () => {
    const req = new Request('http://localhost:3000/api/planner/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intention: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { ok: boolean; errors: Array<{ field: string; message: string }> };
    expect(data.ok).toBe(false);
    expect(data.errors[0]?.field).toBe('intention');
  });

  it('CA-6: devuelve 200 text/event-stream cuando el motor responde', async () => {
    const encoder = new TextEncoder();
    const fakeStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('{"category":"transit","observation":"ok","severityLevel":1}\n'));
        controller.close();
      },
    });

    mockGenerateStream.mockResolvedValueOnce(fakeStream);

    const req = new Request('http://localhost:3000/api/planner/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intention: 'Paseo por Gràcia',
        currentLocation: 'Plaça del Diamant',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');

    const bodyText = await res.text();
    expect(bodyText).toContain('data: {"category":"transit"');
    expect(bodyText).toContain('data: [DONE]');
  });

  it('CA-6: devuelve HTTP 503 si el gateway está caído o falta credencial sin colgar el stream', async () => {
    mockGenerateStream.mockRejectedValueOnce(new Error('Gateway unreachable or missing credential'));

    const req = new Request('http://localhost:3000/api/planner/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intention: 'Paseo por Gràcia',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const data = (await res.json()) as { ok: boolean; error: string };
    expect(data.ok).toBe(false);
    expect(data.error).toContain('Fallo al conectar con el motor de inferencia');
  });
});
