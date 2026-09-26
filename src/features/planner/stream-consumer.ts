import {
  OrchestratorStreamEvent,
  OrchestratorStreamEventSchema,
  MetaInitData,
  AffiliateInjectedData,
  StreamErrorData,
} from './streaming-events.schema';
import { EnrichedWaypoint, EnrichedRoute } from './affiliate/affiliate-enricher.schema';

export interface StreamHandlers {
  onMetaInit?: (data: MetaInitData) => void;
  onStopEmitted?: (stop: EnrichedWaypoint) => void;
  onAffiliateInjected?: (data: AffiliateInjectedData) => void;
  onStreamComplete?: (route: EnrichedRoute) => void;
  onError?: (err: StreamErrorData) => void;
}

/**
 * Consumidor determinista de eventos SSE para el endpoint de orquestación reactiva.
 * Parsea fragmentos en tiempo real y despacha eventos tipados a los manejadores registrados.
 */
export async function consumeOrchestratorStream(
  endpointUrl: string,
  prompt: string,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ prompt }),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error || `Error HTTP ${response.status} en flujo de streaming.`;
    handlers.onError?.({ message, code: `HTTP_${response.status}` });
    return;
  }

  if (!response.body) {
    handlers.onError?.({ message: 'El cuerpo de la respuesta de streaming no está disponible.', code: 'NO_BODY' });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) {
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed.startsWith('data:')) continue;

        const jsonStr = trimmed.replace(/^data:\s*/, '');
        if (!jsonStr) continue;

        try {
          const parsedJson = JSON.parse(jsonStr);
          const validatedEvent: OrchestratorStreamEvent =
            OrchestratorStreamEventSchema.parse(parsedJson);

          switch (validatedEvent.type) {
            case 'meta_init':
              handlers.onMetaInit?.(validatedEvent.data);
              break;
            case 'stop_emitted':
              handlers.onStopEmitted?.(validatedEvent.data);
              break;
            case 'affiliate_injected':
              handlers.onAffiliateInjected?.(validatedEvent.data);
              break;
            case 'stream_complete':
              handlers.onStreamComplete?.(validatedEvent.data);
              break;
            case 'stream_error':
              handlers.onError?.(validatedEvent.data);
              break;
          }
        } catch (parseError) {
          console.warn('[StreamConsumer] Evento ignorado por error de esquema o sintaxis:', parseError);
        }
      }
    }
  } catch (readError) {
    if (signal?.aborted) {
      // Abort intencional por parte del cliente
      return;
    }
    const message = readError instanceof Error ? readError.message : 'Error leyendo el flujo de datos.';
    handlers.onError?.({ message, code: 'READ_ABORT' });
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // safe cleanup
    }
  }
}
