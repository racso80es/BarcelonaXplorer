/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HybridCanvas } from '@/components/tactical/hybrid-canvas';
import {
  formatSseMessage,
  OrchestratorStreamEvent,
  EnrichedRoute,
} from '@/features/planner';

describe('Orquestador — lienzo híbrido (post STEEL-005)', () => {
  it('formatSseMessage sigue validando eventos SSE del esquema legado', () => {
    const event: OrchestratorStreamEvent = {
      type: 'meta_init',
      data: {
        id: 'route-test-123',
        summary: 'Ruta Táctica',
        timestamp: '2026-09-26T12:00:00.000Z',
      },
    };
    const sseString = formatSseMessage(event);
    expect(sseString.startsWith('data: ')).toBe(true);
  });

  it('HybridCanvas renderiza itinerario completo sin modo streaming', () => {
    const route: EnrichedRoute = {
      id: 'inline-1',
      summary: 'Ruta en Proceso',
      waypoints: [
        {
          id: 'wp-1',
          title: 'Parque Güell',
          description: 'Acceso a la zona monumental',
          category: 'CULTURE',
          recommendations: [],
          affiliateProvider: 'NONE',
          options: [],
        },
      ],
    };

    render(
      <HybridCanvas
        itinerary={route}
        onSelectOption={() => {}}
        onTimeShift={() => {}}
      />,
    );

    expect(screen.getByText(/Parque Güell/i)).toBeDefined();
    expect(screen.queryByText(/Streaming/i)).toBeNull();
  });
});
