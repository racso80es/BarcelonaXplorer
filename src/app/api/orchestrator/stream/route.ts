import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import {
  GenerateTacticalRouteUseCase,
  AffiliateEnricherService,
  EnrichedWaypoint,
  EnrichedRoute,
  formatSseMessage,
  OrchestratorStreamEvent,
} from '@/features/planner';
import { GeminiClient } from '@/features/ai-engine';
import { PrismaTelemetryRepository } from '@/features/telemetry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'El prompt es obligatorio y no puede estar vacío.' },
        { status: 400 },
      );
    }

    return createStreamResponse(req, prompt.trim());
  } catch (err) {
    return NextResponse.json(
      { error: 'Error procesando la solicitud de streaming.', details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const prompt = req.nextUrl.searchParams.get('prompt');
  if (!prompt || prompt.trim().length === 0) {
    return NextResponse.json(
      { error: 'El parámetro query "prompt" es obligatorio.' },
      { status: 400 },
    );
  }

  return createStreamResponse(req, prompt.trim());
}

function createStreamResponse(req: NextRequest, prompt: string): Response {
  const encoder = new TextEncoder();
  const routeId = `route-${randomUUID()}`;

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const safeClose = () => {
        if (!isClosed) {
          isClosed = true;
          try {
            controller.close();
          } catch {
            // Stream ya finalizado o cerrado por el cliente
          }
        }
      };

      const sendEvent = (event: OrchestratorStreamEvent) => {
        if (isClosed || req.signal.aborted) return;
        try {
          const sseString = formatSseMessage(event);
          controller.enqueue(encoder.encode(sseString));
        } catch {
          safeClose();
        }
      };

      // Manejo proactivo de desconexión temprana del cliente (AbortSignal)
      req.signal.addEventListener('abort', () => {
        safeClose();
      });

      try {
        // 1. Meta Init: Emisión inmediata de cabecera contextual (≤ 400 ms)
        sendEvent({
          type: 'meta_init',
          data: {
            id: routeId,
            summary: `Orquestando ruta táctica en Barcelona...`,
            timestamp: new Date().toISOString(),
          },
        });

        if (req.signal.aborted) {
          safeClose();
          return;
        }

        // 2. Generación Táctica de Ruta
        const telemetryRepo = new PrismaTelemetryRepository();
        const geminiClient = new GeminiClient(telemetryRepo);
        const routeUseCase = new GenerateTacticalRouteUseCase(geminiClient, telemetryRepo);
        const affiliateEnricher = new AffiliateEnricherService();

        const generated = await routeUseCase.execute({
          prompt,
          environment: {
            localTime: new Date().toISOString(),
          },
        });

        if (req.signal.aborted) {
          safeClose();
          return;
        }

        if (typeof generated === 'string' || !generated.waypoints || generated.waypoints.length === 0) {
          sendEvent({
            type: 'stream_error',
            data: {
              message: typeof generated === 'string' ? generated : 'No se pudo forjar la ruta táctica.',
              code: 'CLAUDICATION',
            },
          });
          safeClose();
          return;
        }

        // 3. Emisión progresiva de paradas (stop_emitted)
        const partialWaypoints: EnrichedWaypoint[] = [];

        for (const wp of generated.waypoints) {
          if (req.signal.aborted) {
            safeClose();
            return;
          }

          const baseWaypoint: EnrichedWaypoint = {
            id: wp.id,
            title: wp.title,
            description: wp.description,
            category: 'GENERAL',
            recommendations: wp.recommendations ?? [],
            affiliateProvider: 'NONE',
            options: [],
            coordinates: wp.coordinates,
            timeSpan: wp.timeSpan,
          };

          partialWaypoints.push(baseWaypoint);

          sendEvent({
            type: 'stop_emitted',
            data: baseWaypoint,
          });
        }

        // 4. Enriquecimiento con Proveedores de Afiliación (affiliate_injected)
        const enrichedRoute: EnrichedRoute = await affiliateEnricher.enrichRoute(generated);

        for (const enrichedWp of enrichedRoute.waypoints) {
          if (req.signal.aborted) {
            safeClose();
            return;
          }

          if (enrichedWp.options.length > 0 || enrichedWp.affiliateProvider !== 'NONE') {
            sendEvent({
              type: 'affiliate_injected',
              data: {
                waypointId: enrichedWp.id,
                affiliateProvider: enrichedWp.affiliateProvider,
                affiliateUrl: enrichedWp.affiliateUrl,
                options: enrichedWp.options,
              },
            });
          }
        }

        // 5. Finalización del Stream (stream_complete)
        sendEvent({
          type: 'stream_complete',
          data: enrichedRoute,
        });

        safeClose();
      } catch (err: unknown) {
        if (!req.signal.aborted && !isClosed) {
          sendEvent({
            type: 'stream_error',
            data: {
              message: err instanceof Error ? err.message : 'Error desconocido durante el streaming.',
              code: 'STREAM_FAILURE',
            },
          });
        }
        safeClose();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
