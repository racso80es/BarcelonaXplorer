import { describe, it, expect, vi } from 'vitest';
import { PrismaCognitiveMetricsRepository } from './prisma-cognitive-metrics.repository';
import { PrismaClient } from '@prisma/client';

describe('PrismaCognitiveMetricsRepository (MySQL Aggregations Anti-OOM)', () => {
  it('debe calcular métricas cognitivas agregadas usando count relacional en MySQL', async () => {
    const mockPrisma = {
      userAnchor: {
        count: vi.fn().mockResolvedValue(15),
      },
      telemetryLog: {
        count: vi.fn().mockImplementation(async (args) => {
          if (args?.where?.statusCode === 200) {
            return 25; // 25 rutas despachadas
          }
          return 50; // 50 eventos totales de triaje
        }),
      },
    } as unknown as PrismaClient;

    const repo = new PrismaCognitiveMetricsRepository(mockPrisma);
    const metrics = await repo.getCognitiveMetrics();

    expect(metrics.zeigarnikScore).toBeGreaterThan(0);
    expect(metrics.zeigarnikScore).toBeLessThanOrEqual(100);
    expect(metrics.anchorRate).toBeGreaterThan(0);
    expect(metrics.averageTurnsToSaturation).toBe(2);
    expect(metrics.totalSessionsRecorded).toBe(25);
  });

  it('debe devolver valores por defecto seguros ante fallo de la base de datos (Fail-Soft)', async () => {
    const mockPrisma = {
      userAnchor: {
        count: vi.fn().mockRejectedValue(new Error('Connection lost')),
      },
      telemetryLog: {
        count: vi.fn().mockRejectedValue(new Error('Connection lost')),
      },
    } as unknown as PrismaClient;

    const repo = new PrismaCognitiveMetricsRepository(mockPrisma);
    const metrics = await repo.getCognitiveMetrics();

    expect(metrics.zeigarnikScore).toBe(100);
    expect(metrics.averageTurnsToSaturation).toBe(2.4);
    expect(metrics.anchorRate).toBe(0);
    expect(metrics.totalSessionsRecorded).toBe(0);
  });
});
