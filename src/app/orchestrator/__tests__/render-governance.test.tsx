/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

let hybridCanvasRenderCount = 0;

vi.mock('@/components/tactical/hybrid-canvas', () => ({
  HybridCanvas: (props: {
    onTimeShift?: (nodeId: string, newStart: string, newEnd?: string) => void;
  }) => {
    hybridCanvasRenderCount += 1;
    return (
      <div>
        <div data-testid="hybrid-canvas-stub">lienzo</div>
        <button
          type="button"
          data-testid="trigger-time-shift"
          onClick={() => props.onTimeShift?.('wp1', '11:00', '12:30')}
        >
          shift
        </button>
      </div>
    );
  },
}));

import OrchestratorPage from '@/app/orchestrator/page';

describe('PBI-STEEL-015: gobernanza de render del orquestador', () => {
  beforeEach(() => {
    hybridCanvasRenderCount = 0;
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.HTMLElement.prototype.scrollTo = vi.fn();
    global.fetch = vi.fn(async (url) => {
      if (url === '/api/triage/ignition') {
        return { ok: true, status: 200, json: async () => ({}) } as Response;
      }
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
            durationMs: 1,
            _sys_lang: 'es',
            itinerary: {
              id: 'itin-mock',
              summary: 'Ruta mock',
              waypoints: [
                {
                  id: 'wp1',
                  title: 'Parada',
                  description: 'Desc',
                  category: 'CULTURE',
                  affiliateProvider: 'CIVITATIS',
                  affiliateUrl: 'https://civitatis.com/test',
                  timeSpan: { start: '10:00', end: '11:00' },
                  options: [
                    {
                      id: 'opt-1',
                      title: 'Entrada',
                      description: 'Acceso',
                      provider: 'CIVITATIS',
                      isSelected: true,
                    },
                  ],
                },
              ],
            },
          }),
        } as Response;
      }
      return {} as Response;
    });
  });

  it('no vuelve a renderizar HybridCanvas al teclear en el prompt', async () => {
    render(<OrchestratorPage />);
    const input = screen.getByTestId('orchestrator-prompt') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'Quiero ruta' } });
    fireEvent.submit(screen.getByRole('button', { name: /Enviar/i }));

    await waitFor(
      () => {
        expect(screen.getByTestId('hybrid-canvas-stub')).toBeDefined();
      },
      { timeout: 6000 },
    );

    const rendersAfterItinerary = hybridCanvasRenderCount;
    expect(rendersAfterItinerary).toBeGreaterThan(0);

    fireEvent.change(input, { target: { value: 'Quiero ruta con más detalle' } });
    fireEvent.change(input, { target: { value: 'Quiero ruta con aún más detalle' } });

    expect(hybridCanvasRenderCount).toBe(rendersAfterItinerary);
  });

  it('handleTimeShift emite una sola notificación de éxito', async () => {
    render(<OrchestratorPage />);
    const input = screen.getByTestId('orchestrator-prompt') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'Quiero ruta' } });
    fireEvent.submit(screen.getByRole('button', { name: /Enviar/i }));

    await waitFor(
      () => {
        expect(screen.getByTestId('trigger-time-shift')).toBeDefined();
      },
      { timeout: 6000 },
    );

    fireEvent.click(screen.getByTestId('trigger-time-shift'));

    const notices = await screen.findAllByText(
      /Horario actualizado\. Eventos posteriores recalculados automáticamente\./i,
    );
    expect(notices).toHaveLength(1);
  });
});
