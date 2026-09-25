import { z } from 'zod';
import { GroqFastAiAdapter } from '@/infrastructure/ai/groq/groq-fast-ai.adapter';
import { GenerateFastRadarUseCase } from '@/application/use-cases/generate-fast-radar.use-case';
import { PrismaTelemetryRepository } from '@/features/telemetry';
import type { FastContextDto } from '@/application/ports/out/fast-interaction-ai.port';

export const dynamic = 'force-dynamic';

/**
 * Schema de validación Zod para el payload entrante.
 * Actúa como "aduana" en la capa de presentación: valida primitivos
 * antes de transformarlos en el DTO tipado FastContextDto.
 */
const requestSchema = z.object({
  intention: z
    .string()
    .min(1, 'El campo "intention" es obligatorio y no puede estar vacío.'),
  currentLocation: z.string().optional(),
  localTime: z.string().optional(),
});

/**
 * Composition Root local: ensambla el adaptador de infraestructura
 * y lo inyecta en el caso de uso de aplicación.
 *
 * El Route Handler solo conoce el Use Case (capa de aplicación).
 * La dependencia con GroqFastAiAdapter (infraestructura) se resuelve
 * aquí, en el borde más externo del sistema.
 */
function composeUseCase(): GenerateFastRadarUseCase {
  const telemetryRepo = new PrismaTelemetryRepository();
  const aiPort = new GroqFastAiAdapter(undefined, telemetryRepo);
  return new GenerateFastRadarUseCase(aiPort);
}

/**
 * Transforma un ReadableStream de texto puro al formato estricto
 * del protocolo Server-Sent Events (data: {chunk}\n\n).
 *
 * Esta responsabilidad es exclusiva de la capa HTTP — el adaptador
 * de IA no debe conocer el protocolo de transporte.
 */
function toSseStream(rawStream: ReadableStream): ReadableStream {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  return rawStream.pipeThrough(
    new TransformStream({
      transform(chunk: Uint8Array, controller) {
        const text = decoder.decode(chunk, { stream: true });
        controller.enqueue(encoder.encode(`data: ${text}\n\n`));
      },
      flush(controller) {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      },
    }),
  );
}

/**
 * POST /api/planner/stream
 *
 * Endpoint SSE (Server-Sent Events) que expone el motor de inferencia
 * rápida "Radar BX" a través de streaming.
 *
 * El payload se valida con Zod. Si la validación falla, devuelve 400
 * con los errores formateados. En caso de éxito, devuelve un stream
 * con Content-Type: text/event-stream en formato SSE estándar.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: 'Payload JSON inválido.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const validation = requestSchema.safeParse(body);

  if (!validation.success) {
    const errors = validation.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    return new Response(
      JSON.stringify({ ok: false, errors }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const context: FastContextDto = {
    intention: validation.data.intention,
    currentLocation: validation.data.currentLocation,
    localTime: validation.data.localTime,
  };

  const useCase = composeUseCase();
  const rawStream = await useCase.execute(context);
  const sseStream = toSseStream(rawStream);

  return new Response(sseStream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

