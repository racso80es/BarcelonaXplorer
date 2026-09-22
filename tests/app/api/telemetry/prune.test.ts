import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/telemetry/prune/route';

vi.mock('@/infrastructure/repositories/prisma-telemetry.repository', () => {
  return {
    PrismaTelemetryRepository: class {
      prune = vi.fn().mockResolvedValue({ deletedCount: 17 });
    },
  };
});

describe('Route Handler: POST /api/telemetry/prune', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, CRON_SECRET: 'super-secret-token' };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('debe rechazar con 401 Unauthorized si falta el token o no coincide con CRON_SECRET', async () => {
    const request = new NextRequest('http://localhost:3000/api/telemetry/prune', {
      method: 'POST',
      headers: {
        authorization: 'Bearer token_incorrecto',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('debe responder 200 OK y ejecutar la poda ontológica si el Bearer token es válido', async () => {
    const request = new NextRequest('http://localhost:3000/api/telemetry/prune', {
      method: 'POST',
      headers: {
        authorization: 'Bearer super-secret-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        debugInfoMaxAgeDays: 5,
        warnErrorMaxAgeDays: 20,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.deletedCount).toBe(17);
    expect(body.rulesApplied.debugInfoMaxAgeDays).toBe(5);
  });

  it('debe admitir autenticación mediante cabecera x-cron-secret', async () => {
    const request = new NextRequest('http://localhost:3000/api/telemetry/prune', {
      method: 'POST',
      headers: {
        'x-cron-secret': 'super-secret-token',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});
