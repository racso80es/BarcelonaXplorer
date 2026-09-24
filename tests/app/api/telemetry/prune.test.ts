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
    vi.unstubAllEnvs();
  });

  it('debe rechazar con 401 Unauthorized si falta el token o no coincide con CRON_SECRET en tiempo constante', async () => {
    const request = new NextRequest('http://localhost:3000/api/telemetry/prune', {
      method: 'POST',
      headers: {
        authorization: 'Bearer token_incorrecto',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toContain('Token de mantenimiento inválido o ausente');
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

  it('debe rechazar bajo política Fail-Closed si NODE_ENV es production y CRON_SECRET no está configurada', async () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'production' };
    delete process.env.CRON_SECRET;

    const request = new NextRequest('http://localhost:3000/api/telemetry/prune', {
      method: 'POST',
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toContain('Seguridad Fail-Closed: CRON_SECRET no está configurada en producción');
  });
});
