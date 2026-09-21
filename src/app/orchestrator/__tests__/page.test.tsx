/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import OrchestratorPage from '@/app/orchestrator/page';

describe('OrchestratorPage Choreography', () => {
  beforeEach(() => {
    // Interceptar scrollIntoView y scrollTo que no están implementados en jsdom
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.HTMLElement.prototype.scrollTo = vi.fn();

    global.fetch = vi.fn(async (url) => {
      if (url === '/api/orchestrator/fast') {
        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(JSON.stringify({ category: 'environmental', observation: 'Lluvia detectada mock', severityLevel: 3 }) + '\n'));
            setTimeout(() => {
              controller.enqueue(encoder.encode(JSON.stringify({ category: 'security', observation: 'Aviso de seguridad mock', severityLevel: 2 }) + '\n'));
              controller.close();
            }, 100);
          }
        });
        return { body: stream } as any;
      }
      
      if (url === '/api/orchestrator/slow') {
        return {
          json: async () => ({ 
            response: {
              id: 'route-mock',
              summary: 'Ruta Táctica Consolidada mock',
              waypoints: [
                { id: 'wp1', title: 'Inicio Seguro', description: 'Comienza aquí', recommendations: [] }
              ]
            }
          })
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

  it('transitions from Fase 0 to Fase 3 using real timers', async () => {
    render(<OrchestratorPage />);
    const input = screen.getByPlaceholderText(/Qué experiencia táctica/i) as HTMLTextAreaElement;
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Quiero ir a la playa' } });
    fireEvent.submit(button);

    // Debe mostrar Asimilando (Fase 2)
    expect(await screen.findByText(/Asimilando entropía/i, {}, { timeout: 1000 })).toBeDefined();

    // Debe mostrar la primera chispa
    expect(await screen.findByText(/Lluvia detectada/i, {}, { timeout: 2000 })).toBeDefined();

    // Debe mostrar la resolución final (Fase 3)
    expect(await screen.findByText(/Ruta Táctica Consolidada/i, {}, { timeout: 4500 })).toBeDefined();
  }, 10000); // Dar suficiente timeout al test
});
