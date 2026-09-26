/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HybridCanvas } from '@/components/tactical/hybrid-canvas';
import {
  consumeOrchestratorStream,
  formatSseMessage,
  OrchestratorStreamEvent,
  EnrichedRoute,
} from '@/features/planner';

describe('PBI-FEAT-STREAM-001: Streaming Progresivo SSE en Lienzo Lateral HybridCanvas', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('formatSseMessage & Esquemas Zod', () => {
    it('codifica eventos deterministas según el estándar SSE "data: JSON\\n\\n"', () => {
      const event: OrchestratorStreamEvent = {
        type: 'meta_init',
        data: {
          id: 'route-test-123',
          summary: 'Ruta Táctica Streaming',
          timestamp: '2026-09-26T12:00:00.000Z',
        },
      };

      const sseString = formatSseMessage(event);
      expect(sseString.startsWith('data: ')).toBe(true);
      expect(sseString.endsWith('\n\n')).toBe(true);
      expect(JSON.parse(sseString.replace('data: ', '').trim())).toEqual(event);
    });

    it('falla si el evento no satisface el esquema determinista Zod', () => {
      // @ts-expect-error probando rechazo de tipo inválido en runtime
      expect(() => formatSseMessage({ type: 'invalido', data: {} })).toThrow();
    });
  });

  describe('consumeOrchestratorStream', () => {
    it('procesa chunks SSE de forma progresiva y llama a los handlers correspondientes', async () => {
      const metaEvent: OrchestratorStreamEvent = {
        type: 'meta_init',
        data: {
          id: 'itin-stream-1',
          summary: 'Ruta Gótica en directo',
          timestamp: new Date().toISOString(),
        },
      };

      const stop1Event: OrchestratorStreamEvent = {
        type: 'stop_emitted',
        data: {
          id: 'wp-1',
          title: 'Catedral de Barcelona',
          description: 'Visita matutina al claustro',
          category: 'CULTURE',
          recommendations: ['Llevar calzado cómodo'],
          affiliateProvider: 'NONE',
          options: [],
        },
      };

      const affiliateEvent: OrchestratorStreamEvent = {
        type: 'affiliate_injected',
        data: {
          waypointId: 'wp-1',
          affiliateProvider: 'CIVITATIS',
          affiliateUrl: 'https://civitatis.com/barcelona/catedral',
          options: [
            {
              id: 'opt-civ-1',
              title: 'Entrada Prioritaria',
              description: 'Sin colas',
              provider: 'CIVITATIS',
              isSelected: true,
            },
          ],
        },
      };

      const completeEvent: OrchestratorStreamEvent = {
        type: 'stream_complete',
        data: {
          id: 'itin-stream-1',
          summary: 'Ruta Gótica en directo',
          waypoints: [
            {
              id: 'wp-1',
              title: 'Catedral de Barcelona',
              description: 'Visita matutina al claustro',
              category: 'CULTURE',
              recommendations: ['Llevar calzado cómodo'],
              affiliateProvider: 'CIVITATIS',
              affiliateUrl: 'https://civitatis.com/barcelona/catedral',
              options: [
                {
                  id: 'opt-civ-1',
                  title: 'Entrada Prioritaria',
                  description: 'Sin colas',
                  provider: 'CIVITATIS',
                  isSelected: true,
                },
              ],
            },
          ],
        },
      };

      // Simulación de ReadableStream con chunks divididos
      const ssePayload = [
        formatSseMessage(metaEvent),
        formatSseMessage(stop1Event),
        formatSseMessage(affiliateEvent),
        formatSseMessage(completeEvent),
      ].join('');

      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(ssePayload));
          controller.close();
        },
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: stream,
      });

      const onMetaInit = vi.fn();
      const onStopEmitted = vi.fn();
      const onAffiliateInjected = vi.fn();
      const onStreamComplete = vi.fn();

      await consumeOrchestratorStream('/api/orchestrator/stream', 'Paseo por el Gótico', {
        onMetaInit,
        onStopEmitted,
        onAffiliateInjected,
        onStreamComplete,
      });

      expect(onMetaInit).toHaveBeenCalledWith(metaEvent.data);
      expect(onStopEmitted).toHaveBeenCalledWith(stop1Event.data);
      expect(onAffiliateInjected).toHaveBeenCalledWith(affiliateEvent.data);
      expect(onStreamComplete).toHaveBeenCalledWith(completeEvent.data);
    });

    it('interrumpe el consumo inmediatamente si AbortSignal se activa', async () => {
      const abortController = new AbortController();

      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(
            encoder.encode(
              formatSseMessage({
                type: 'meta_init',
                data: { id: 'test', summary: 'test', timestamp: '' },
              }),
            ),
          );
          // cancelamos inmediatamente
          abortController.abort();
          controller.close();
        },
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: stream,
      });

      const onMetaInit = vi.fn();
      const onStreamComplete = vi.fn();

      await consumeOrchestratorStream(
        '/api/orchestrator/stream',
        'Ruta cancelada',
        { onMetaInit, onStreamComplete },
        abortController.signal,
      );

      expect(onStreamComplete).not.toHaveBeenCalled();
    });
  });

  describe('HybridCanvas Renderizado Progresivo', () => {
    it('muestra el badge "Streaming" y placeholder cuando el stream está activo sin paradas iniciales', () => {
      const initialRoute: EnrichedRoute = {
        id: 'stream-init',
        summary: 'Sintetizando ruta en tiempo real...',
        waypoints: [],
      };

      render(
        <HybridCanvas
          itinerary={initialRoute}
          onSelectOption={vi.fn()}
          onTimeShift={vi.fn()}
          isStreaming={true}
        />,
      );

      expect(screen.getByText(/Streaming/i)).toBeDefined();
      expect(screen.getByText(/Sintetizando y enriqueciendo paradas en tiempo real/i)).toBeDefined();
      expect(screen.getByText(/Sintetizando ruta en tiempo real/i)).toBeDefined();
    });

    it('muestra paradas a medida que se inyectan en el estado mientras transmite', async () => {
      const partialRoute: EnrichedRoute = {
        id: 'stream-partial',
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

      const { rerender } = render(
        <HybridCanvas
          itinerary={partialRoute}
          onSelectOption={vi.fn()}
          onTimeShift={vi.fn()}
          isStreaming={true}
        />,
      );

      expect(screen.getByText(/Parque Güell/i)).toBeDefined();
      expect(screen.getByText(/Transmitiendo próximas paradas/i)).toBeDefined();

      // Inyección de segunda parada
      const updatedRoute: EnrichedRoute = {
        ...partialRoute,
        waypoints: [
          ...partialRoute.waypoints,
          {
            id: 'wp-2',
            title: 'Sagrada Familia',
            description: 'Fachada del Nacimiento',
            category: 'CULTURE',
            recommendations: [],
            affiliateProvider: 'NONE',
            options: [],
          },
        ],
      };

      rerender(
        <HybridCanvas
          itinerary={updatedRoute}
          onSelectOption={vi.fn()}
          onTimeShift={vi.fn()}
          isStreaming={false}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText(/Sagrada Familia/i)).toBeDefined();
        // Badge streaming no debe estar cuando isStreaming es false
        expect(screen.queryByText(/Transmitiendo próximas paradas/i)).toBeNull();
      });
    });
  });
});
