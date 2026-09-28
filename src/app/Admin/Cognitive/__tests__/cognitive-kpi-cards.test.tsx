// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  CognitiveKpiCards,
  CognitiveKpiCardsSkeleton,
} from '@/app/Admin/Cognitive/CognitiveKpiCards';
import { ICognitiveMetricsPort } from '@/features/cognitive-memory';
import { IVectorStorePort } from '@/features/cognitive-memory';

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
    search: vi.fn().mockResolvedValue([]),
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
    expect(screen.getByText('Tasa de Saturación (Zeigarnik)').textContent).toBe('Tasa de Saturación (Zeigarnik)');
    expect(screen.getByText('85%').textContent).toBe('85%');
    expect(screen.getByText('S+ Grade').textContent).toBe('S+ Grade');

    // 2. Entropía de Ingestión
    expect(screen.getByText('Entropía de Ingestión').textContent).toBe('Entropía de Ingestión');
    expect(screen.getByText('2.1 t').textContent).toBe('2.1 t');
    expect(screen.getByText('Eficiencia SLM').textContent).toBe('Eficiencia SLM');

    // 3. Tasa de Anclaje
    expect(screen.getByText('Tasa de Anclaje Táctico').textContent).toBe('Tasa de Anclaje Táctico');
    expect(screen.getByText('40%').textContent).toBe('40%');
    expect(screen.getByText('Refugio').textContent).toBe('Refugio');

    // 4. Salud LanceDB
    expect(screen.getByText('Salud LanceDB (Vector)').textContent).toBe('Salud LanceDB (Vector)');
    expect(screen.getByText('OPERATIVO').textContent).toBe('OPERATIVO');
    expect(screen.getByText('Apache Arrow').textContent).toBe('Apache Arrow');
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
    expect(screen.getByText('DEGRADADO').textContent).toBe('DEGRADADO');
  });

  it('debe renderizar el Skeleton pulsante correctamente', () => {
    const { container } = render(<CognitiveKpiCardsSkeleton />);
    const pulses = container.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBe(5);
  });
});
