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
    expect(pickpocketBadge.textContent).toContain('Carteristas: Alto');

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
    expect(screen.getByText(/Acceso prioritario:/i)).toBeDefined();
    expect(screen.getByText('Asegurar Entrada')).toBeDefined();
  });

  it('muta badges, CTAs y controles al francés al recibir lang="fr"', () => {
    render(
      <HybridCanvas
        itinerary={baseRoute}
        onSelectOption={vi.fn()}
        onTimeShift={vi.fn()}
        thermalState="operational"
        lang="fr"
      />
    );

    const canvas = screen.getByLabelText('Itinéraire Tactique');
    expect(canvas.getAttribute('data-lang')).toBe('fr');
    expect(screen.getByTestId('pickpocket-badge-wp-1').textContent).toContain(
      'Pickpockets: Élevé',
    );
    expect(screen.getByText('Modifier')).toBeDefined();
    expect(screen.getByText('Culturel')).toBeDefined();
    expect(screen.getByText('Voir tour sur Civitatis')).toBeDefined();
  });

  it('CA-3 (PBI-STEEL-019): render con lang="en" no contiene frases en castellano', () => {
    const saturatedRoute: EnrichedRoute = {
      ...baseRoute,
      thermalState: 'saturated',
      waypoints: [
        {
          ...baseRoute.waypoints[0],
          tacticalMetadata: {
            antiTrapShield: {
              warnings: ['Warning sample'],
              recommendedAlternatives: ["Bodega L'Estevet"],
            },
            microLogistics: {
              pickpocketAlertLevel: 'HIGH',
              transitTips: 'Keep bags close.',
              realWalkingTimeMinutes: 12,
            },
          },
          options: [
            {
              ...baseRoute.waypoints[0].options[0],
              isPriorityAccess: true,
            },
          ],
        },
      ],
    };

    const { container } = render(
      <HybridCanvas
        itinerary={saturatedRoute}
        onSelectOption={vi.fn()}
        onTimeShift={vi.fn()}
        thermalState="saturated"
        lang="en"
      />
    );

    const spanishPhrases = [
      'Ruta Operativa Segura',
      'Completa tu perfil para desbloquear alternativas gastronómicas hiperlocales y pases de acceso prioritario.',
      'Modo S+ Grade: Escudo de Supervivencia & Curaduría Hiperlocal Activos',
      'Tip de tránsito',
      'Carteristas: Alto',
      'Alternativas Locales Recomendadas (Sin Trampas):',
      'Opciones Disponibles:',
      'Verificado vía',
      'Asegurar Entrada',
      'Acceso prioritario:',
    ];

    for (const phrase of spanishPhrases) {
      expect(container.textContent).not.toContain(phrase);
    }

    // Y contiene las correspondientes en inglés
    expect(container.textContent).toContain('S+ Grade Mode: Survival Shield & Hyperlocal Curation Active');
    expect(container.textContent).toContain('Transit tip');
    expect(container.textContent).toContain('Pickpockets: High');
    expect(container.textContent).toContain('Recommended Local Alternatives (Trap-Free):');
    expect(container.textContent).toContain('Available Options:');
    expect(container.textContent).toContain('Verified via');
    expect(container.textContent).toContain('Secure Ticket');
    expect(container.textContent).toContain('Critical high-congestion spot. Priority access:');
  });
});

