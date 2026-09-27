/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HybridCanvas } from './hybrid-canvas';
import { EnrichedRoute } from '@/features/planner';

describe('HybridCanvas Component (PBI-FEAT-CANVAS-SURVIVAL-002 / HU-10)', () => {
  const baseRoute: EnrichedRoute = {
    id: 'test-route-1',
    summary: 'Ruta Táctica Modernista',
    thermalState: 'operational',
    waypoints: [
      {
        id: 'wp-1',
        title: 'Basílica de la Sagrada Família',
        description: 'Monumento emblemático de Antoni Gaudí',
        category: 'CULTURE',
        timeSpan: { start: '10:00', end: '12:00' },
        recommendations: [],
        affiliateProvider: 'CIVITATIS',
        affiliateUrl: 'https://civitatis.com/sagrada-familia',
        options: [
          {
            id: 'opt-1',
            title: 'Acceso Prioritario Sin Colas (Sagrada Família)',
            description: 'Aforo crítico de alta congestión. Asegura tu acceso prioritario.',
            provider: 'CIVITATIS',
            affiliateUrl: 'https://civitatis.com/sagrada-familia',
            isSelected: true,
            isPriorityAccess: false,
          },
        ],
        tacticalMetadata: {
          antiTrapShield: {
            warnings: ['⚠️ Escudo Anti-Trampas: Evita comer en la Avenida Gaudí adyacente; precios inflados.'],
            recommendedAlternatives: ["Bodega L'Estevet (C/ Mallorca)"],
          },
          microLogistics: {
            pickpocketAlertLevel: 'HIGH',
            transitTips: 'Mantén pertenencias al frente en la salida de Metro L2/L5.',
            realWalkingTimeMinutes: 12,
          },
        },
      },
    ],
  };

  it('Escenario 1: Renderiza el banner didáctico de Ruta Operativa Segura en modo operational (Base)', () => {
    render(
      <HybridCanvas
        itinerary={baseRoute}
        onSelectOption={vi.fn()}
        onTimeShift={vi.fn()}
        thermalState="operational"
      />
    );

    // Banner didáctico presente
    const banner = screen.getByTestId('canvas-safety-banner');
    expect(banner).toBeDefined();
    expect(banner.textContent).toContain('Ruta Operativa Segura');
    expect(banner.textContent).toContain('Completa tu perfil para desbloquear alternativas gastronómicas hiperlocales y pases de acceso prioritario.');

    // Advertencias vitales presentes (Táctica del Refugio)
    const warnings = screen.getByTestId('anti-trap-warnings-wp-1');
    expect(warnings.textContent).toContain('Avenida Gaudí');
    expect(warnings.textContent).toContain('Tip de tránsito');

    // Badge de carteristas presente
    const pickpocketBadge = screen.getByTestId('pickpocket-badge-wp-1');
    expect(pickpocketBadge.textContent).toContain('Carteristas: HIGH');

    // Alternativas gastronómicas LATENTES (no renderizadas en Base)
    expect(screen.queryByTestId('recommended-alternatives-wp-1')).toBeNull();
  });

  it('Escenario 2: Renderiza el banner S+ Grade, alternativas gastronómicas y pase prioritario en modo saturated', () => {
    const saturatedRoute: EnrichedRoute = {
      ...baseRoute,
      thermalState: 'saturated',
      waypoints: [
        {
          ...baseRoute.waypoints[0],
          options: [
            {
              ...baseRoute.waypoints[0].options[0],
              isPriorityAccess: true,
              ctaLabel: 'Asegurar Entrada',
            },
          ],
        },
      ],
    };

    render(
      <HybridCanvas
        itinerary={saturatedRoute}
        onSelectOption={vi.fn()}
        onTimeShift={vi.fn()}
        thermalState="saturated"
      />
    );

    // Banner S+ Grade activo
    const banner = screen.getByTestId('canvas-s-grade-banner');
    expect(banner.textContent).toContain('Modo S+ Grade: Escudo de Supervivencia & Curaduría Hiperlocal Activos');

    // Alternativas gastronómicas de barrio DESBLOQUEADAS
    const alternatives = screen.getByTestId('recommended-alternatives-wp-1');
    expect(alternatives.textContent).toContain("Bodega L'Estevet");

    // Pase prioritario preventivo visible
    expect(screen.getByText('Acceso Prioritario Preventivo')).toBeDefined();
    expect(screen.getByText('Asegurar Entrada')).toBeDefined();
  });
});
