import { describe, it, expect, vi } from 'vitest';
import { PruneTelemetryUseCase } from './prune-telemetry.use-case';
import { TelemetryRepositoryPort } from './telemetry-repository.port';

describe('PruneTelemetryUseCase (Poda Ontológica)', () => {
  it('debe aplicar las reglas por defecto de 7 días (DEBUG/INFO) y 30 días (WARN/ERROR)', async () => {
    const mockRepo: TelemetryRepositoryPort = {
      log: vi.fn(),
      getRecentLogs: vi.fn(),
      prune: vi.fn().mockResolvedValue({ deletedCount: 42 }),
    };

    const useCase = new PruneTelemetryUseCase(mockRepo);
    const result = await useCase.execute();

    expect(mockRepo.prune).toHaveBeenCalledWith({
      debugInfoMaxAgeDays: 7,
      warnErrorMaxAgeDays: 30,
    });
    expect(result.deletedCount).toBe(42);
    expect(result.rulesApplied.debugInfoMaxAgeDays).toBe(7);
    expect(result.rulesApplied.warnErrorMaxAgeDays).toBe(30);
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
  });
});
