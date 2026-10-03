/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import OrchestratorPage from '@/app/orchestrator/page';

const triageOutcomeBase = {
  sessionId: 'sess-mock',
  matrixId: 'default',
  durationMs: 1,
  _sys_lang: 'es' as const,
};

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
            sessionId: 'sess-mock',
            matrixId: 'default',
            score: 100,
            survivalThreshold: 60,
            isThresholdSatisfied: true,
            durationMs: 42,
            _sys_lang: 'es',
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
    expect(screen.getByPlaceholderText(/Indica tus preferencias/i).tagName).toBe('TEXTAREA');
    expect(screen.getByText(/SISTEMA EN ESPERA/i).textContent).toContain('SISTEMA EN ESPERA');
  });

  it('transitions from Fase 0 to Fase 3 and displays the Lateral HybridCanvas', async () => {
    render(<OrchestratorPage />);
    const input = screen.getByPlaceholderText(/Indica tus preferencias/i) as HTMLTextAreaElement;
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Quiero ir a la playa' } });
    fireEvent.submit(button);

    // Debe mostrar Asimilando (Fase 2)
    expect((await screen.findByText(/Asimilando entropía/i, {}, { timeout: 1000 })).textContent).toContain('Asimilando entropía');

    // Debe mostrar la chispa táctica de diagnóstico de aduana
    expect((await screen.findByText(/Matriz saturada/i, {}, { timeout: 2000 })).textContent).toContain('Matriz saturada');

    // Debe mostrar la resolución final (Fase 3)
    // Debe desplegar el Lienzo Lateral Híbrido (itinerario inline desde /api/triage)
    expect((await screen.findByText(/Itinerario Táctico/i, {}, { timeout: 4500 })).textContent).toContain('Itinerario Táctico');
    expect((await screen.findByText(/Inicio Seguro/i, {}, { timeout: 2000 })).textContent).toContain('Inicio Seguro');
    expect(screen.getByText(/Entrada General/i).textContent).toContain('Entrada General');
  }, 10000);

  it('handles CASUAL_DIALOGUE empathetically without breaking the interface', async () => {
    global.fetch = vi.fn(async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ...triageOutcomeBase,
          status: 'CASUAL_DIALOGUE',
          dialogueMessage: '¡Hola! Qué bien tenerte por aquí. Tómate las cosas con calma en Barcelona.',
          score: 0,
          survivalThreshold: 60,
          isThresholdSatisfied: false,
        }),
      } as unknown as Response;
    });

    render(<OrchestratorPage />);
    const input = screen.getByPlaceholderText(/Indica tus preferencias/i) as HTMLTextAreaElement;
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Hola qué tal' } });
    fireEvent.submit(button);

    expect((await screen.findByText(/Interacción casual interceptada/i, {}, { timeout: 2000 })).textContent).toContain('Interacción casual interceptada');
    expect((await screen.findByText(/Tómate las cosas con calma en Barcelona/i, {}, { timeout: 2000 })).textContent).toContain('Tómate las cosas con calma en Barcelona');
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
    expect((await screen.findByText(/Amanece con lluvia en Barcelona/i, {}, { timeout: 2000 })).textContent).toContain('Amanece con lluvia en Barcelona');
    expect(screen.getByText(/Lluvia en Barcelona \(17ºC\)/i).textContent).toContain('Lluvia en Barcelona (17ºC)');
  });

  it('sincroniza el ThermalMeter reactivamente tras la evaluación de la Aduana Universal', async () => {
    global.fetch = vi.fn(async (url) => {
      if (url === '/api/triage') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ...triageOutcomeBase,
            status: 'INCOMPLETE_REPROMPT',
            score: 75,
            survivalThreshold: 70,
            isThresholdSatisfied: true,
            missingVariable: 'budget',
            repromptMessage: '¿Qué presupuesto aproximado tenéis?',
          }),
        } as unknown as Response;
      }
      return {} as unknown as Response;
    });

    render(<OrchestratorPage />);

    // Inicialmente el medidor está en 0%
    const meter = screen.getByTestId('thermal-meter');
    expect(meter.getAttribute('data-testid')).toBe('thermal-meter');
    expect(meter.getAttribute('data-thermal-state')).toBe('inert');

    // Enviamos un prompt
    const input = screen.getByPlaceholderText(/Indica tus preferencias/i) as HTMLTextAreaElement;
    const button = screen.getByRole('button', { name: /Enviar/i });

    fireEvent.change(input, { target: { value: 'Vamos 2 personas durante 4 horas' } });
    fireEvent.submit(button);

    // Debe recibir 75%, superar el umbral de 70% y transicionar a "operational"
    expect((await screen.findByText(/Operativo · Itinerario Listo \(70%\)/i, {}, { timeout: 2500 })).textContent).toContain('Operativo · Itinerario Listo (70%)');
    expect(meter.getAttribute('data-thermal-state')).toBe('operational');
    expect(screen.getByRole('button', { name: /Forjar Ruta Inmediata/i }).textContent).toContain('Forjar Ruta Inmediata');
  });

  it('muta placeholder y ThermalMeter al francés al recibir _sys_lang desde /api/triage', async () => {
    global.fetch = vi.fn(async (url) => {
      if (url === '/api/triage') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ...triageOutcomeBase,
            status: 'INCOMPLETE_REPROMPT',
            score: 30,
            survivalThreshold: 60,
            isThresholdSatisfied: false,
            _sys_lang: 'fr',
            missingVariable: 'time_window',
            repromptMessage: 'Combien de temps avez-vous ?',
          }),
        } as unknown as Response;
      }
      return {} as unknown as Response;
    });

    render(<OrchestratorPage />);
    const input = screen.getByPlaceholderText(/Indica tus preferencias/i);
    fireEvent.change(input, { target: { value: 'Parlez-moi en français' } });
    fireEvent.submit(screen.getByRole('button', { name: /Enviar/i }));

    expect(
      (await screen.findByPlaceholderText(/Indiquez vos préférences/i, {}, { timeout: 2500 })).tagName,
    ).toBe('TEXTAREA');
    expect(screen.getByTestId('thermal-meter').getAttribute('data-lang')).toBe('fr');
    expect(document.querySelector('[data-sys-lang="fr"]')).not.toBeNull();
  });

  it('CA-3 (PBI-STEEL-019): no contiene frases en castellano al mutar a lang="en"', async () => {
    global.fetch = vi.fn(async (url) => {
      if (url === '/api/triage/ignition') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            result: {
              _sys_lang: 'en',
              greeting: 'Welcome to Barcelona!',
              sparks: [],
            },
          }),
        } as unknown as Response;
      }
      return {} as unknown as Response;
    });

    const { container } = render(<OrchestratorPage />);

    expect(
      (await screen.findByPlaceholderText(/Enter your preferences/i, {}, { timeout: 2500 })).tagName,
    ).toBe('TEXTAREA');

    const spanishPhrases = [
      '[ SISTEMA EN ESPERA DE INPUT TÁCTICO ]',
      'Asimilando entropía y trazando ruta...',
      'Ruta táctica forjada con éxito.',
      'Respuesta de triaje inválida.',
      'Error de comunicación táctica.',
    ];

    for (const phrase of spanishPhrases) {
      expect(container.textContent).not.toContain(phrase);
    }
  });

  describe('PBI-ARCH-ORCH-008: Escritura de Vuelta de Selección y Horario del Lienzo', () => {
    it('CA-1 & CA-4: persistencia fail-soft al seleccionar una alternativa en el lienzo', async () => {
      let selectOptionFetchCalled = false;
      let selectOptionPayload: unknown = null;

      global.fetch = vi.fn(async (url, init) => {
        if (url === '/api/triage') {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              status: 'DISPATCH_READY',
              sessionId: 'sess-mock',
              matrixId: 'default',
              score: 100,
              survivalThreshold: 60,
              isThresholdSatisfied: true,
              durationMs: 42,
              _sys_lang: 'es',
              route: {
                id: 'route-mock',
                summary: 'Ruta Táctica',
                waypoints: [{ id: 'wp1', title: 'Inicio Seguro', description: 'Desc', recommendations: [] }],
              },
              itinerary: {
                id: 'itin-mock',
                summary: 'Itinerario Híbrido',
                waypoints: [
                  {
                    id: 'cuid-wp-1',
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

        if (url === '/api/planner/itinerary/select-option') {
          selectOptionFetchCalled = true;
          selectOptionPayload = JSON.parse((init?.body as string) || '{}');
          // Simular fallo de base de datos / red para verificar CA-4 (fail-soft)
          return {
            ok: false,
            status: 500,
            json: async () => ({
              success: false,
              exitCode: 500,
              errors: ['Database connection failed'],
            }),
          } as unknown as Response;
        }

        return {} as unknown as Response;
      });

      render(<OrchestratorPage />);
      const input = screen.getByPlaceholderText(/Indica tus preferencias/i);
      fireEvent.change(input, { target: { value: 'Quiero una ruta' } });
      fireEvent.submit(screen.getByRole('button', { name: /Enviar/i }));

      // Esperar que cargue el lienzo
      expect((await screen.findByText(/Entrada General/i, {}, { timeout: 4000 })).textContent).toContain('Entrada General');

      // Clic en la segunda opción (Tour Guiado)
      const tourOption = screen.getByText(/Tour Guiado/i);
      fireEvent.click(tourOption);

      // Debe haber invocado el endpoint de persistencia con el CUID del nodo y el id de la opción
      expect(selectOptionFetchCalled).toBe(true);
      expect(selectOptionPayload).toEqual({
        nodeId: 'cuid-wp-1',
        optionId: 'opt-2',
      });

      // CA-4: A pesar del fallo 500 simulado, la opción permanece seleccionada en la UI sin error visible
      expect(screen.getByText(/Tour Guiado/i).textContent).toContain('Tour Guiado');
      expect(screen.queryByText(/Error de comunicación táctica/i)).toBeNull();
    });

    it('CA-2 & CA-4: persistencia fail-soft al desplazar el horario de un nodo', async () => {
      let shiftTimesFetchCalled = false;
      let shiftTimesPayload: unknown = null;

      global.fetch = vi.fn(async (url, init) => {
        if (url === '/api/triage') {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              status: 'DISPATCH_READY',
              sessionId: 'sess-mock',
              matrixId: 'default',
              score: 100,
              survivalThreshold: 60,
              isThresholdSatisfied: true,
              durationMs: 42,
              _sys_lang: 'es',
              route: {
                id: 'route-mock',
                summary: 'Ruta Táctica',
                waypoints: [{ id: 'wp1', title: 'Nodo 1', description: 'Desc', recommendations: [] }],
              },
              itinerary: {
                id: 'itin-mock',
                summary: 'Itinerario Híbrido',
                waypoints: [
                  {
                    id: 'cuid-wp-1',
                    title: 'Nodo 1',
                    description: 'Comienza aquí',
                    category: 'CULTURE',
                    affiliateProvider: 'CIVITATIS',
                    affiliateUrl: 'https://civitatis.com/test',
                    timeSpan: { start: '10:00', end: '11:00' },
                    options: [],
                  },
                ],
              },
            }),
          } as unknown as Response;
        }

        if (url === '/api/planner/itinerary/shift-times') {
          shiftTimesFetchCalled = true;
          shiftTimesPayload = JSON.parse((init?.body as string) || '{}');
          // Simular fallo de base de datos para comprobar CA-4
          return {
            ok: false,
            status: 500,
            json: async () => ({ success: false, exitCode: 500 }),
          } as unknown as Response;
        }

        return {} as unknown as Response;
      });

      render(<OrchestratorPage />);
      const input = screen.getByPlaceholderText(/Indica tus preferencias/i);
      fireEvent.change(input, { target: { value: 'Generar ruta' } });
      fireEvent.submit(screen.getByRole('button', { name: /Enviar/i }));

      // Esperar que cargue el lienzo
      expect((await screen.findByText(/Nodo 1/i, {}, { timeout: 4000 })).textContent).toContain('Nodo 1');

      // Clic en "Modificar hora"
      const modifyTimeBtn = screen.getByRole('button', { name: /Modificar: Nodo 1/i });
      fireEvent.click(modifyTimeBtn);

      // Cambiar horas y guardar
      const timeInputs = screen.getAllByPlaceholderText('HH:MM');
      fireEvent.change(timeInputs[0], { target: { value: '11:30' } });
      fireEvent.change(timeInputs[1], { target: { value: '12:30' } });

      const saveBtn = screen.getByRole('button', { name: /Guardar/i });
      fireEvent.click(saveBtn);

      // Debe haber invocado el endpoint con el horario desplazado
      expect(shiftTimesFetchCalled).toBe(true);
      expect(shiftTimesPayload).toEqual({
        updates: [
          {
            nodeId: 'cuid-wp-1',
            startTime: '11:30',
            endTime: '12:30',
          },
        ],
      });

      // CA-4: En pantalla el nuevo horario se mantiene y no se revierte
      expect(screen.getByText(/11:30 - 12:30/i).textContent).toContain('11:30 - 12:30');
    });
  });
});


