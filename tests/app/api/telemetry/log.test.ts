import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/telemetry/log/route';

vi.mock('@/infrastructure/repositories/prisma-telemetry.repository', () => {
  return {
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
});
