import type {
  FastContextDto,
  FastInteractionAiPort,
} from '@/features/ai-engine';
import { FastInsight, FastInsightZodSchema } from '@/features/ai-engine';
import { IaGatewayClient } from './ia-gateway.client';
import type { TelemetryRepositoryPort } from '@/features/telemetry';
import { PrismaTelemetryRepository } from '@/features/telemetry/server';
import { TelemetryEntry } from '@/features/telemetry';

const FALLBACK_MESSAGE = JSON.stringify({
  category: 'transit',
  observation: 'Radar BX temporalmente fuera de alcance. Verifica las web oficiales.',
  severityLevel: 2,
});

const DEFAULT_SYSTEM_PROMPT =
  'Eres el Radar de BarcelonaXplorer. Analiza el contexto e intención. Genera entre 1 y 3 advertencias o insights rápidos ("chispas"). IMPERATIVO: Devuelve tu respuesta EXCLUSIVAMENTE en formato NDJSON (Newline Delimited JSON). Cada línea debe ser un objeto JSON válido con este exacto esquema: {"category": "environmental" | "security" | "transit", "observation": "Tu mensaje corto", "severityLevel": 1 | 2 | 3}. No incluyas markdown, bloques de código, ni texto adicional.';

export class GatewayFastRadarAdapter implements FastInteractionAiPort {
  private readonly gatewayClient: IaGatewayClient;
  private readonly telemetryRepo?: TelemetryRepositoryPort;

  constructor(
    gatewayClient?: IaGatewayClient,
    telemetryRepo?: TelemetryRepositoryPort
  ) {
    this.gatewayClient = gatewayClient ?? new IaGatewayClient();
    this.telemetryRepo = telemetryRepo ?? new PrismaTelemetryRepository();
  }

  async generateImmediateContextStream(
    context: FastContextDto
  ): Promise<ReadableStream> {
    const startTime = Date.now();
    const userMessage = this.buildUserMessage(context);

    // Si el gateway está caído o falta credencial, generateText lanza y no colapsa el error
    // permitiendo a la ruta HTTP responder con error en lugar de colgar el stream.
    let responseText: string;
    try {
      responseText = await this.gatewayClient.generateText(
        userMessage,
        'FAST_LLM',
        {
          systemInstruction: DEFAULT_SYSTEM_PROMPT,
          temperature: 0.6,
        }
      );
    } catch (err) {
      const durationMs = Date.now() - startTime;
      if (process.env['TELEMETRY_LLM_ENABLED'] !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo
          .log(
            new TelemetryEntry(
              'WARN',
              'LLM_ENGINE',
              `[Gateway Fast Radar] Fallo al generar inferencia rápida: ${err instanceof Error ? err.message : 'Error desconocido'}`,
              {
                durationMs,
                intentionSnippet: context.intention.slice(0, 150),
              },
              500,
              durationMs
            )
          )
          .catch((e) => console.warn('[Telemetry Fire-and-Forget Error]', e));
      }
      throw err;
    }

    const durationMs = Date.now() - startTime;
    if (process.env['TELEMETRY_LLM_ENABLED'] !== 'false' && this.telemetryRepo) {
      void this.telemetryRepo
        .log(
          new TelemetryEntry(
            'INFO',
            'LLM_ENGINE',
            '[Gateway Fast Radar] Inferencia rápida completada con éxito vía IA Gateway',
            {
              durationMs,
              intentionSnippet: context.intention.slice(0, 150),
            },
            200,
            durationMs
          )
        )
        .catch((e) => console.warn('[Telemetry Fire-and-Forget Error]', e));
    }

    return this.toReadableStream(responseText);
  }

  private buildUserMessage(context: FastContextDto): string {
    const contextParts: string[] = [];

    if (context.localTime) {
      contextParts.push(context.localTime);
    }
    if (context.currentLocation) {
      contextParts.push(context.currentLocation);
    }

    const contextStr =
      contextParts.length > 0 ? `Contexto: ${contextParts.join(' - ')}. ` : '';

    return `${contextStr}Intención: ${context.intention}`;
  }

  private toReadableStream(rawText: string): ReadableStream {
    const encoder = new TextEncoder();
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const validEntities: FastInsight[] = [];

    for (const line of lines) {
      try {
        const rawObj: unknown = JSON.parse(line);
        const validation = FastInsightZodSchema.safeParse(rawObj);
        if (validation.success) {
          validEntities.push(
            new FastInsight(
              validation.data.category,
              validation.data.observation,
              validation.data.severityLevel
            )
          );
        }
      } catch {
        // Ignorar líneas no JSON
      }
    }

    return new ReadableStream({
      start(controller) {
        if (validEntities.length === 0) {
          // Degradación elegante: si el modelo respondió texto no estructurable
          controller.enqueue(encoder.encode(FALLBACK_MESSAGE + '\n'));
        } else {
          for (const entity of validEntities) {
            controller.enqueue(encoder.encode(JSON.stringify(entity) + '\n'));
          }
        }
        controller.close();
      },
    });
  }
}
