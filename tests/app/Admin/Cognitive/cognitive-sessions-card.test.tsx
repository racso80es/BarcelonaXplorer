// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  CognitiveSessionsCard,
  CognitiveSessionsCardSkeleton,
} from '@/app/Admin/Cognitive/CognitiveSessionsCard';
import {
  ICognitiveMemoryPort,
  CognitiveMemoryItem,
} from '@/application/ports/out/cognitive-memory.port';

describe('CognitiveSessionsCard (Bounded Query Ingestion LanceDB)', () => {
  const sampleSessions: CognitiveMemoryItem[] = [
    {
      id: 'session-alpha:default',
      sessionId: 'session-alpha',
      matrixId: 'default',
      denseText: '[Grupo: 2 | Vibe: romántico]',
      payload: { groupSize: 2, vibe: 'romántico' },
      score: 100,
      timestamp: 1774425600000,
    },
    {
      id: 'session-beta:default',
      sessionId: 'session-beta',
      matrixId: 'default',
      denseText: '[Grupo: 5 | Vibe: fiesta]',
      payload: { groupSize: 5, vibe: 'fiesta' },
      score: 50,
      timestamp: 1774425500000,
    },
  ];

  it('debe invocar getRecentMemories con límite estricto de 100 y renderizar badges', async () => {
    const mockMemoryPort: ICognitiveMemoryPort = {
      persistMemory: vi.fn(),
      getLatestSessionMemory: vi.fn(),
      searchSimilarMemories: vi.fn(),
      getRecentMemories: vi.fn().mockResolvedValue(sampleSessions),
      clearSessionMemory: vi.fn(),
    };

    const Component = await CognitiveSessionsCard({
      cognitiveMemoryPort: mockMemoryPort,
    });

    render(Component);

    // Verificar que invocó getRecentMemories({ limit: 100 })
    expect(mockMemoryPort.getRecentMemories).toHaveBeenCalledWith({ limit: 100 });

    // Verificar badges y encabezados
    expect(screen.getByText('Bitácora de Memoria Cognitiva (LanceDB)')).toBeDefined();
    expect(screen.getByText('Anti-OOM (Límite: 100)')).toBeDefined();
    expect(screen.getByText('Saturadas: 1')).toBeDefined();
    expect(screen.getByText('Total en Memoria: 2')).toBeDefined();
  });

  it('debe manejar tolerancias a fallos si LanceDB produce error de lectura', async () => {
    const failingMemoryPort: ICognitiveMemoryPort = {
      persistMemory: vi.fn(),
      getLatestSessionMemory: vi.fn(),
      searchSimilarMemories: vi.fn(),
      getRecentMemories: vi.fn().mockRejectedValue(new Error('LanceDB Locked')),
      clearSessionMemory: vi.fn(),
    };

    const Component = await CognitiveSessionsCard({
      cognitiveMemoryPort: failingMemoryPort,
    });

    render(Component);

    expect(screen.getByText('Total en Memoria: 0')).toBeDefined();
    expect(
      screen.getByText('No se han registrado memorias cognitivas recientes en LanceDB.'),
    ).toBeDefined();
  });

  it('debe renderizar el Skeleton de carga', () => {
    const { container } = render(<CognitiveSessionsCardSkeleton />);
    const pulses = container.querySelectorAll('.animate-pulse');
    expect(pulses.length).toBeGreaterThanOrEqual(2);
  });
});
