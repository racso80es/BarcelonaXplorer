import { describe, it, expect, vi } from 'vitest';
import { PruneTelemetryUseCase } from './prune-telemetry.use-case';
import { TelemetryRepositoryPort } from './telemetry-repository.port';

describe('PruneTelemetryUseCase (Poda Ontológica de Telemetría - PBI-OPS-HOOK-001)', () => {
  it('debe aplicar las reglas por defecto de 7 días (DEBUG/INFO) y 30 días (WARN/ERROR)', async () => {
    const mockRepo: TelemetryRepositoryPort = {
      log: vi.fn(),
      getRecentLogs: vi.fn(),
      prune: vi.fn().mockResolvedValue({ deletedCount: 42 }),
    };

    const useCase = new PruneTelemetryUseCase(mockRepo);
    const beforeTime = Date.now();
    const result = await useCase.execute();
    const afterTime = Date.now();

    expect(mockRepo.prune).toHaveBeenCalledWith({
      debugInfoMaxAgeDays: 7,
      warnErrorMaxAgeDays: 30,
    });
    expect(result.deletedCount).toBe(42);
    expect(result.rulesApplied.debugInfoMaxAgeDays).toBe(7);
    expect(result.rulesApplied.warnErrorMaxAgeDays).toBe(30);
    expect(result.executedAt.getTime()).toBeGreaterThanOrEqual(beforeTime);
    expect(result.executedAt.getTime()).toBeLessThanOrEqual(afterTime);
  });

  it('debe admitir reglas personalizadas cuando se especifican', async () => {
    const mockRepo: TelemetryRepositoryPort = {
      log: vi.fn(),
      getRecentLogs: vi.fn(),
      prune: vi.fn().mockResolvedValue({ deletedCount: 10 }),
    };

    const useCase = new PruneTelemetryUseCase(mockRepo);
    const result = await useCase.execute({
      debugInfoMaxAgeDays: 3,
      warnErrorMaxAgeDays: 15,
    });

    expect(mockRepo.prune).toHaveBeenCalledWith({
      debugInfoMaxAgeDays: 3,
      warnErrorMaxAgeDays: 15,
    });
    expect(result.deletedCount).toBe(10);
    expect(result.rulesApplied.debugInfoMaxAgeDays).toBe(3);
    expect(result.rulesApplied.warnErrorMaxAgeDays).toBe(15);
  });

  it('debe gestionar correctamente ejecuciones donde no hay registros para purgar (0 eliminados)', async () => {
    const mockRepo: TelemetryRepositoryPort = {
      log: vi.fn(),
      getRecentLogs: vi.fn(),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    const useCase = new PruneTelemetryUseCase(mockRepo);
    const result = await useCase.execute();

    expect(mockRepo.prune).toHaveBeenCalledTimes(1);
    expect(result.deletedCount).toBe(0);
  });

  it('debe propagar el error si el repositorio de base de datos falla', async () => {
    const mockRepo: TelemetryRepositoryPort = {
      log: vi.fn(),
      getRecentLogs: vi.fn(),
      prune: vi.fn().mockRejectedValue(new Error('MySQL Deadlock / Connection timeout')),
    };

    const useCase = new PruneTelemetryUseCase(mockRepo);
    await expect(useCase.execute()).rejects.toThrow('MySQL Deadlock / Connection timeout');
  });
});
