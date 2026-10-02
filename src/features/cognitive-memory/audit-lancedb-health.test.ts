import { describe, it, expect, vi, beforeEach } from 'vitest';

import fs from 'fs';
import path from 'path';
import os from 'os';
import { AuditLanceDbHealthUseCase } from './audit-lancedb-health.use-case';
import { IVectorStorePort } from '@/features/cognitive-memory';
import { LanceDbVectorAdapter } from './lancedb-vector.adapter';
import { resetLanceDbConnection } from './lancedb-client';
import { buildDeterministicFallbackVector } from '@/features/ai-engine/deterministic-embedding-fallback';
import { TelemetryRepositoryPort } from '@/features/telemetry';


describe('AuditLanceDbHealthUseCase', () => {
  let mockVectorStore: IVectorStorePort;
  let mockTelemetryRepo: TelemetryRepositoryPort;

  beforeEach(() => {
    mockVectorStore = {
      upsert: vi.fn(),
      search: vi.fn(),
      getByIds: vi.fn(),
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
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
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

  describe('PBI-MEM-004 CA-4: Sonda de Pureza de Vectores Fallback', () => {
    it('debe conmutar a warn y registrar en telemetría SYSTEM si fallbackVectorCount > 0', async () => {
      const mockScanner = vi.fn().mockResolvedValue({
        dryRun: true,
        uri: '/app/vector_storage',
        tables: [
          { tableName: 'cognitive_memories', scanned: 10, matches: 3, deleted: 0 },
          { tableName: 'semantic_prompt_cache', scanned: 5, matches: 0, deleted: 0 },
        ],
      });

      const useCase = new AuditLanceDbHealthUseCase(
        mockVectorStore,
        mockTelemetryRepo,
        { latencyWarnThresholdMs: 50 },
        mockScanner,
      );

      const result = await useCase.execute();

      expect(result.state).toBe('warn');
      expect(result.fallbackVectorCount).toBe(3);
      expect(result.msg).toContain('3 vectores fallback detectados');
      expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'WARN',
          context: 'SYSTEM',
          message: expect.stringContaining('3'),
          payload: expect.objectContaining({
            fallbackVectorCount: 3,
          }),
        }),
      );
    });

    it('CA-4: debe auditar con precisión sobre LanceDB real una tabla limpia (0 fallback) y conmutar a warn al contaminarse', async () => {
      const tempDir = path.join(os.tmpdir(), `lancedb_audit_health_${Date.now()}`);
      resetLanceDbConnection();
      const realVectorStore = new LanceDbVectorAdapter(tempDir);

      try {
        // 1. Tabla limpia: vector aleatorio que no coincide con fallback determinista
        const cleanDoc = {
          id: 'clean-sess:default',
          vector: new Array(768).fill(0.02),
          text: 'Paseo tranquilo por Ciutat Vella',
          metadata: { sessionId: 'clean-sess' },
        };
        await realVectorStore.upsert('cognitive_memories', [cleanDoc]);

        const realUseCase = new AuditLanceDbHealthUseCase(realVectorStore, mockTelemetryRepo);
        const cleanResult = await realUseCase.execute();

        expect(cleanResult.isHealthy).toBe(true);
        expect(cleanResult.state).toBe('ok');
        expect(cleanResult.fallbackVectorCount).toBe(0);

        // 2. Contaminar la tabla: vector generado con buildDeterministicFallbackVector
        const contaminatedText = 'Ruta de tapas por Gràcia';
        const fallbackVector = buildDeterministicFallbackVector(contaminatedText);
        const contaminatedDoc = {
          id: 'contam-sess:gastronomy',
          vector: fallbackVector,
          text: contaminatedText,
          metadata: { sessionId: 'contam-sess' },
        };
        await realVectorStore.upsert('cognitive_memories', [contaminatedDoc]);

        const contaminatedResult = await realUseCase.execute();

        expect(contaminatedResult.state).toBe('warn');
        expect(contaminatedResult.fallbackVectorCount).toBe(1);
        expect(contaminatedResult.msg).toContain('1 vectores fallback detectados');
        expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
          expect.objectContaining({
            level: 'WARN',
            context: 'SYSTEM',
            message: expect.stringContaining('1'),
          }),
        );
      } finally {
        resetLanceDbConnection();
        try {
          if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
          }
        } catch {
          // ignore tmp cleanup error
        }
      }
    });
  });
});


