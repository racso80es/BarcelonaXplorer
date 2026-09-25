import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/telemetry/log/route';

vi.mock('@/features/telemetry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/telemetry')>();
  return {
    ...actual,
    PrismaTelemetryRepository: class {
      log = vi.fn().mockResolvedValue(undefined);
    },
  };
});

describe('Route Handler: POST /api/telemetry/log', () => {
  it('debe responder 202 Accepted cuando el payload cumple con el Escudo Zod', async () => {
    const request = new NextRequest('http://localhost:3000/api/telemetry/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'ERROR',
        context: 'CLIENT_UI',
        message: 'Fallo al renderizar componente',
        payload: { stack: 'Error at Component...' },
        statusCode: 500,
        durationMs: 45,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(202);

    const body = await response.json();
    expect(body.status).toBe('accepted');
  });

  it('debe rechazar con 400 Bad Request si faltan campos obligatorios como message o context', async () => {
    const request = new NextRequest('http://localhost:3000/api/telemetry/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'INFO',
        // context ausente
        // message ausente
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toContain('Fallo de validación');
  });

  it('debe rechazar con 400 Bad Request si el cuerpo no es JSON válido', async () => {
    const request = new NextRequest('http://localhost:3000/api/telemetry/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'cuerpo-invalido-no-json',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toContain('Cuerpo JSON inválido');
  });

  it('debe rechazar con 400 Bad Request si el mensaje excede los 512 caracteres máximos', async () => {
    const excessiveMessage = 'A'.repeat(513);
    const request = new NextRequest('http://localhost:3000/api/telemetry/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'WARN',
        context: 'SERVER_API',
        message: excessiveMessage,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toContain('Fallo de validación');
    expect(JSON.stringify(body.details)).toContain('512');
  });

  it('debe rechazar con 400 Bad Request si el payload excede el límite máximo de 64KB (mitigación DoS)', async () => {
    const largePayload = {
      largeData: 'x'.repeat(70000),
    };

    const request = new NextRequest('http://localhost:3000/api/telemetry/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'INFO',
        context: 'SECURITY_PERIMETER',
        message: 'Intento de DoS con payload sobredimensionado',
        payload: largePayload,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toContain('Fallo de validación');
    expect(JSON.stringify(body.details)).toContain('64KB');
  });
});
