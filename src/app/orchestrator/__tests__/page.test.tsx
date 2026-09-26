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
            itinerary: {
              id: 'itin-mock',
              summary: 'Itinerario Híbrido Enriquecido',
              waypoints: [
                {
                  id: 'wp1',
                  title: 'Inicio Seguro',
                  description: 'Comienza aquí',
                  category: 'CULTURE',
                  affiliateProvider: 'CIVITATIS',
                  affiliateUrl: 'https://civitatis.com/test',
                  timeSpan: { start: '10:00', end: '11:30' },
                  options: [
                    { id: 'opt-1', title: 'Entrada General', description: 'Acceso estándar', provider: 'CIVITATIS', isSelected: true },
                    { id: 'opt-2', title: 'Tour Guiado', description: 'Con guía oficial', provider: 'CIVITATIS', isSelected: false },
                  ],
                },
              ],
            },
          }),
        } as unknown as Response;
      }

      return {} as unknown as Response;
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

  it('transitions from Fase 0 to Fase 3 and displays the Lateral HybridCanvas', async () => {
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

    // Debe desplegar el Lienzo Lateral Híbrido
    expect(await screen.findByText(/Lienzo de Orquestación Híbrida/i, {}, { timeout: 2000 })).toBeDefined();
    expect(screen.getByText(/Itinerario Híbrido Enriquecido/i)).toBeDefined();
    expect(screen.getByText(/Entrada General/i)).toBeDefined();
  }, 10000);

  it('handles CASUAL_DIALOGUE empathetically without breaking the interface', async () => {
    global.fetch = vi.fn(async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: 'CASUAL_DIALOGUE',
          dialogueMessage: '¡Hola! Qué bien tenerte por aquí. Tómate las cosas con calma en Barcelona.',
          score: 0,
          survivalThreshold: 60,
          isThresholdSatisfied: false,
        }),
      } as unknown as Response;
    });

    render(<OrchestratorPage />);
    const input = screen.getByPlaceholderText(/Qué experiencia táctica/i) as HTMLTextAreaElement;
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Hola qué tal' } });
    fireEvent.submit(button);

    expect(await screen.findByText(/Interacción casual interceptada/i, {}, { timeout: 2000 })).toBeDefined();
    expect(await screen.findByText(/Tómate las cosas con calma en Barcelona/i, {}, { timeout: 2000 })).toBeDefined();
  });

  it('activa la ignición contextual proactiva y muestra el saludo del conserje táctico', async () => {
    global.fetch = vi.fn(async (url) => {
      if (url === '/api/triage/ignition') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            exitCode: 0,
            result: {
              greeting: '¡Buenos días! Amanece con lluvia en Barcelona. ¿Buscamos actividades cubiertas?',
              isFallback: false,
              period: 'MORNING',
              device: 'DESKTOP',
              sparks: [
                {
                  id: 'spark-weather-test',
                  type: 'weather',
                  insight: 'Lluvia en Barcelona (17ºC). Considera actividades bajo cubierto.',
                  urgency: 'high',
                },
              ],
              contextSummary: 'Hora: 10:00 (MORNING) | Dispositivo: DESKTOP',
            },
          }),
        } as unknown as Response;
      }
      return {} as unknown as Response;
    });

    render(<OrchestratorPage />);

    // El saludo y la chispa del conserje deben aparecer de forma asíncrona
    expect(await screen.findByText(/Amanece con lluvia en Barcelona/i, {}, { timeout: 2000 })).toBeDefined();
    expect(screen.getByText(/Lluvia en Barcelona \(17ºC\)/i)).toBeDefined();
  });
});

