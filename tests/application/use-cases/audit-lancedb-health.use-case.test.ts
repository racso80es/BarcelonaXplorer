import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditLanceDbHealthUseCase } from '@/application/use-cases/audit-lancedb-health.use-case';
import { IVectorStorePort } from '@/application/ports/out/vector-store.port';
import { TelemetryRepositoryPort } from '@/application/ports/out/telemetry-repository.port';

describe('AuditLanceDbHealthUseCase', () => {
  let mockVectorStore: IVectorStorePort;
  let mockTelemetryRepo: TelemetryRepositoryPort;

  beforeEach(() => {
    mockVectorStore = {
      upsert: vi.fn(),
      search: vi.fn(),
      delete: vi.fn(),
      tableExists: vi.fn(),
      ping: vi.fn().mockResolvedValue({
        ok: true,
        latencyMs: 12,
        path: '/app/vector_storage',
        tableCount: 2,
      }),
    };

    mockTelemetryRepo = {
      log: vi.fn().mockResolvedValue(undefined),
      findRecent: vi.fn(),
      pruneOlderThan: vi.fn(),
    };
  });

  it('debe retornar estado ok y mensaje saludable cuando el probe responde rápido', async () => {
    const useCase = new AuditLanceDbHealthUseCase(mockVectorStore, mockTelemetryRepo);
    const result = await useCase.execute();

    expect(result.state).toBe('ok');
    expect(result.msg).toBe('Almacén Vectorial Saludable');
    expect(result.latencyMs).toBe(12);
    expect(result.tableCount).toBe(2);
    expect(result.isHealthy).toBe(true);
    expect(mockTelemetryRepo.log).not.toHaveBeenCalled();
  });

  it('debe conmutar a warn y registrar en telemetría si la latencia supera el umbral', async () => {
    vi.mocked(mockVectorStore.ping).mockResolvedValueOnce({
      ok: true,
      latencyMs: 75,
      path: '/app/vector_storage',
      tableCount: 2,
    });

    const useCase = new AuditLanceDbHealthUseCase(mockVectorStore, mockTelemetryRepo, {
      latencyWarnThresholdMs: 50,
    });
    const result = await useCase.execute();

    expect(result.state).toBe('warn');
    expect(result.msg).toContain('Latencia Alta (75ms)');
    expect(result.isHealthy).toBe(true);
    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);
    expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'WARN',
        context: 'SYSTEM',
      })
    );
  });

  it('debe conmutar a error y registrar en telemetría si el ping falla', async () => {
    vi.mocked(mockVectorStore.ping).mockResolvedValueOnce({
      ok: false,
      latencyMs: 5,
      path: '/app/vector_storage',
      tableCount: 0,
      error: 'EACCES: permission denied, open /app/vector_storage',
    });

    const useCase = new AuditLanceDbHealthUseCase(mockVectorStore, mockTelemetryRepo);
    const result = await useCase.execute();

    expect(result.state).toBe('error');
    expect(result.msg).toContain('EACCES: permission denied');
    expect(result.isHealthy).toBe(false);
    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);
    expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'ERROR',
        context: 'SYSTEM',
      })
    );
  });

  it('debe ser tolerante si el repositorio de telemetría lanza una excepción (Fail-Soft)', async () => {
    vi.mocked(mockVectorStore.ping).mockResolvedValueOnce({
      ok: false,
      latencyMs: 10,
      path: '/app/vector_storage',
      tableCount: 0,
      error: 'Disk full',
    });
    vi.mocked(mockTelemetryRepo.log).mockRejectedValueOnce(new Error('DB unreachable'));

    const useCase = new AuditLanceDbHealthUseCase(mockVectorStore, mockTelemetryRepo);
    await expect(useCase.execute()).resolves.toEqual(
      expect.objectContaining({
        state: 'error',
        isHealthy: false,
      })
    );
  });
});
