/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import OrchestratorPage from '@/app/orchestrator/page';

describe('OrchestratorPage Choreography (Laudo 1: Endpoint Único /api/triage)', () => {
  beforeEach(() => {
    // Interceptar scrollIntoView y scrollTo que no están implementados en jsdom
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.HTMLElement.prototype.scrollTo = vi.fn();

    global.fetch = vi.fn(async (url) => {
      if (url === '/api/triage') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'DISPATCH_READY',
            score: 100,
            survivalThreshold: 60,
            isThresholdSatisfied: true,
            route: {
              id: 'route-mock',
              summary: 'Ruta Táctica Consolidada mock',
              waypoints: [
                { id: 'wp1', title: 'Inicio Seguro', description: 'Comienza aquí', recommendations: [] },
              ],
            },
          }),
        } as any;
      }

      return {} as any;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders initial state correctly (Fase 0)', () => {
    render(<OrchestratorPage />);
    expect(screen.getByPlaceholderText(/Qué experiencia táctica/i)).toBeDefined();
    expect(screen.getByText(/SISTEMA EN ESPERA/i)).toBeDefined();
  });

  it('transitions from Fase 0 to Fase 3 using unified /api/triage', async () => {
    render(<OrchestratorPage />);
    const input = screen.getByPlaceholderText(/Qué experiencia táctica/i) as HTMLTextAreaElement;
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Quiero ir a la playa' } });
    fireEvent.submit(button);

    // Debe mostrar Asimilando (Fase 2)
    expect(await screen.findByText(/Asimilando entropía/i, {}, { timeout: 1000 })).toBeDefined();

    // Debe mostrar la chispa táctica de diagnóstico de aduana
    expect(await screen.findByText(/Matriz saturada/i, {}, { timeout: 2000 })).toBeDefined();

    // Debe mostrar la resolución final (Fase 3)
    expect(await screen.findByText(/Ruta Táctica Consolidada/i, {}, { timeout: 4500 })).toBeDefined();
  }, 10000);
});
