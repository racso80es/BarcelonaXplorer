import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, setMaintainUseCaseForTesting } from './route';
import { MaintainContextUseCase } from '@/features/context-sources/maintain-context.use-case';
import { createSuccessEnvelope } from '@/shared/operation-envelope';

describe('Route Handler: POST /api/context/maintain (Argos Cron)', () => {
  const ORIGINAL_ENV = process.env;
  let mockUseCase: MaintainContextUseCase;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, CRON_SECRET: 'test-cron-secret' };

    mockUseCase = {
      execute: vi.fn().mockResolvedValue(
        createSuccessEnvelope({
          degradedChecked: 1,
          proposalsCreated: 1,
          groundingUnavailable: false,
          proposals: [
            {
              sourceTag: 'test-argos',
              displayName: 'Test Fuente',
              endpoint: 'https://test.bcn/endpoint',
              supersedesSourceTag: 'old-tag',
              type: 'JSON_LD',
              category: 'EVENT',
            },
          ],
          durationMs: 85,
        })
      ),
    } as unknown as MaintainContextUseCase;

    setMaintainUseCaseForTesting(mockUseCase);
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    setMaintainUseCaseForTesting(null);
    vi.unstubAllEnvs();
  });

  it('CA-7: rechaza con 401 si falta el secreto o es incorrecto', async () => {
    const req = new NextRequest('http://localhost:3000/api/context/maintain', {
      method: 'POST',
      headers: {
        authorization: 'Bearer wrong-secret',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toContain('Token de mantenimiento inválido o ausente');
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });

  it('CA-7: responde 200 OK y ejecuta el caso de uso con Authorization Bearer válido', async () => {
    const req = new NextRequest('http://localhost:3000/api/context/maintain', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-cron-secret',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.result.proposalsCreated).toBe(1);
    expect(mockUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('CA-7: rechaza bajo política Fail-Closed si NODE_ENV es production y CRON_SECRET no está configurada', async () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'production' };
    delete process.env.CRON_SECRET;

    const req = new NextRequest('http://localhost:3000/api/context/maintain', {
      method: 'POST',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toContain('Seguridad Fail-Closed: CRON_SECRET no está configurada en producción');
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });
});
