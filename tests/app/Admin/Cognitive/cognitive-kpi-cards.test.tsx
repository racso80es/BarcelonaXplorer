// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  CognitiveKpiCards,
  CognitiveKpiCardsSkeleton,
} from '@/app/Admin/Cognitive/CognitiveKpiCards';
import { ICognitiveMetricsPort } from '@/application/ports/out/cognitive-metrics.port';
import { IVectorStorePort } from '@/application/ports/out/vector-store.port';

describe('CognitiveKpiCards (Tarjetas de Telemetría Cognitiva)', () => {
  const mockMetricsPort: ICognitiveMetricsPort = {
    getCognitiveMetrics: vi.fn().mockResolvedValue({
      zeigarnikScore: 85,
      averageTurnsToSaturation: 2.1,
      anchorRate: 40,
      totalSessionsRecorded: 120,
    }),
  };

  const mockVectorStorePort: IVectorStorePort = {
    upsert: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    tableExists: vi.fn().mockResolvedValue(true),
    ping: vi.fn().mockResolvedValue({
      ok: true,
      latencyMs: 12,
      path: '/app/vector_storage',
      tableCount: 2,
    }),
  };

  it('debe renderizar las 4 tarjetas tácticas con sus métricas calculadas', async () => {
    const Component = await CognitiveKpiCards({
      metricsPort: mockMetricsPort,
      vectorStorePort: mockVectorStorePort,
    });

    render(Component);

    // 1. Zeigarnik Score
    expect(screen.getByText('Tasa de Saturación (Zeigarnik)')).toBeDefined();
    expect(screen.getByText('85%')).toBeDefined();
    expect(screen.getByText('S+ Grade')).toBeDefined();

    // 2. Entropía de Ingestión
    expect(screen.getByText('Entropía de Ingestión')).toBeDefined();
    expect(screen.getByText('2.1 t')).toBeDefined();
    expect(screen.getByText('Eficiencia SLM')).toBeDefined();

    // 3. Tasa de Anclaje
    expect(screen.getByText('Tasa de Anclaje Táctico')).toBeDefined();
    expect(screen.getByText('40%')).toBeDefined();
    expect(screen.getByText('Refugio')).toBeDefined();

    // 4. Salud LanceDB
    expect(screen.getByText('Salud LanceDB (Vector)')).toBeDefined();
    expect(screen.getByText('OPERATIVO')).toBeDefined();
    expect(screen.getByText('Apache Arrow')).toBeDefined();
  });

  it('debe responder con tolerancia a fallos si los puertos fallan', async () => {
    const failingMetrics: ICognitiveMetricsPort = {
      getCognitiveMetrics: vi.fn().mockRejectedValue(new Error('MySQL Down')),
    };
    const failingVector: IVectorStorePort = {
      ...mockVectorStorePort,
      ping: vi.fn().mockRejectedValue(new Error('Disk EACCES')),
    };

    const Component = await CognitiveKpiCards({
      metricsPort: failingMetrics,
      vectorStorePort: failingVector,
    });

    render(Component);

    // Debe renderizar valores por defecto sin lanzar excepción
    expect(screen.getAllByText('0%').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('DEGRADADO')).toBeDefined();
  });

  it('debe renderizar el Skeleton pulsante correctamente', () => {
    const { container } = render(<CognitiveKpiCardsSkeleton />);
    const pulses = container.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBe(4);
  });
});
