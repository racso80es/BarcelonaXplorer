import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, setIngestUseCaseForTesting } from './route';
import { IngestContextUseCase } from '@/features/context-sources/ingest-context.use-case';
import { createSuccessEnvelope } from '@/shared/operation-envelope';

describe('Route Handler: POST /api/context/ingest', () => {
  const ORIGINAL_ENV = process.env;
  let mockUseCase: IngestContextUseCase;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, CRON_SECRET: 'test-cron-secret' };

    mockUseCase = {
      execute: vi.fn().mockResolvedValue(
        createSuccessEnvelope({
          sourcesProcessed: 2,
          sourcesDegraded: 0,
          fetched: 5,
          deduplicated: 1,
          persisted: 4,
          discardedFallback: 0,
          durationMs: 120,
        })
      ),
    } as unknown as IngestContextUseCase;

    setIngestUseCaseForTesting(mockUseCase);
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    setIngestUseCaseForTesting(null);
    vi.unstubAllEnvs();
  });

  it('CA-9 / Escenario 8: rechaza con 401 si falta el secreto o es incorrecto y no consulta fuentes', async () => {
    const req = new NextRequest('http://localhost:3000/api/context/ingest', {
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

  it('CA-9: responde 200 OK y ejecuta el use case cuando se provee Authorization Bearer válido', async () => {
    const req = new NextRequest('http://localhost:3000/api/context/ingest', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-cron-secret',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.result.persisted).toBe(4);
    expect(mockUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('CA-9: admite autenticación alternativa mediante cabecera x-cron-secret', async () => {
    const req = new NextRequest('http://localhost:3000/api/context/ingest', {
      method: 'POST',
      headers: {
        'x-cron-secret': 'test-cron-secret',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('CA-9: rechaza bajo política Fail-Closed si NODE_ENV es production y CRON_SECRET no está configurada', async () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'production' };
    delete process.env.CRON_SECRET;

    const req = new NextRequest('http://localhost:3000/api/context/ingest', {
      method: 'POST',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.error).toContain('Seguridad Fail-Closed: CRON_SECRET no está configurada en producción');
    expect(mockUseCase.execute).not.toHaveBeenCalled();
  });
});
