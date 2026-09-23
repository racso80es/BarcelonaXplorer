import Groq from 'groq-sdk';
import type {
  FastContextDto,
  FastInteractionAiPort,
} from '@/application/ports/out/fast-interaction-ai.port';
import { FastInsight } from '@/domain/entities/fast-insight.entity';
import { FastInsightZodSchema } from '@/infrastructure/ai/schemas/fast-insight.schema';
import { TelemetryRepositoryPort } from '@/application/ports/out/telemetry-repository.port';
import { PrismaTelemetryRepository } from '@/infrastructure/repositories/prisma-telemetry.repository';
import { TelemetryEntry } from '@/domain/entities/telemetry-entry.entity';

/**
 * Mensaje genérico devuelto cuando la API de Groq falla.
 * Degradación elegante: el usuario recibe un consejo útil, nunca un error crudo.
 */
const FALLBACK_MESSAGE = JSON.stringify({
  category: 'transit',
  observation: 'Radar BX temporalmente fuera de alcance. Verifica las web oficiales.',
  severityLevel: 2
});

/**
 * Fallback del System Prompt si la variable de entorno no está configurada.
 */
const DEFAULT_SYSTEM_PROMPT =
  'Eres el Radar de BarcelonaXplorer. Analiza el contexto e intención. Genera entre 1 y 3 advertencias o insights rápidos ("chispas"). IMPERATIVO: Devuelve tu respuesta EXCLUSIVAMENTE en formato NDJSON (Newline Delimited JSON). Cada línea debe ser un objeto JSON válido con este exacto esquema: {"category": "environmental" | "security" | "transit", "observation": "Tu mensaje corto", "severityLevel": 1 | 2 | 3}. No incluyas markdown, bloques de código, ni texto adicional.';

/**
 * Fallback de max_tokens si la variable de entorno no está configurada.
 */
const DEFAULT_MAX_TOKENS = 500;

/**
 * Adaptador de infraestructura para inferencia rápida via Groq.
 *
 * Implementa el puerto FastInteractionAiPort convirtiendo la respuesta
 * streaming de Groq en un ReadableStream (Web Streams API) compatible
 * con el consumo SSE en Next.js App Router. Aplica el Zod Shield para proteger
 * a las capas superiores.
 */
export class GroqFastAiAdapter implements FastInteractionAiPort {
  private readonly client: Groq;
  private readonly model: string;
  private readonly telemetryRepo?: TelemetryRepositoryPort;

  constructor(client?: Groq, telemetryRepo?: TelemetryRepositoryPort) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GROQ_API_KEY no está configurada en las variables de entorno.',
      );
    }
    this.model = process.env.GROQ_FAST_MODEL ?? 'qwen/qwen3.8-27b';
    this.client = client ?? new Groq({ apiKey });
    this.telemetryRepo = telemetryRepo ?? new PrismaTelemetryRepository();
  }

  async generateImmediateContextStream(
    context: FastContextDto,
  ): Promise<ReadableStream> {
    const startTime = Date.now();
    try {
      const baseSystemPrompt =
        process.env.GROQ_RADAR_SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT;

      // La instrucción NDJSON es un detalle técnico inmutable de la infraestructura.
      const technicalInstruction = ' IMPERATIVO: Devuelve tu respuesta EXCLUSIVAMENTE en formato NDJSON (Newline Delimited JSON). Cada línea debe ser un objeto JSON válido con este exacto esquema: {"category": "environmental" | "security" | "transit", "observation": "Tu mensaje corto", "severityLevel": 1 | 2 | 3}. No incluyas markdown ni texto adicional.';
      
      const systemPrompt = baseSystemPrompt.includes('NDJSON') ? baseSystemPrompt : `${baseSystemPrompt}${technicalInstruction}`;

      const maxTokens = parseInt(
        process.env.GROQ_RADAR_MAX_TOKENS || String(DEFAULT_MAX_TOKENS),
        10,
      );

      const userMessage = this.buildUserMessage(context);

      const stream = await this.client.chat.completions.create({
        model: this.model,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.6,
        max_tokens: maxTokens,
      });

      const durationMs = Date.now() - startTime;
      if (process.env.TELEMETRY_LLM_ENABLED !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo.log(
          new TelemetryEntry(
            'INFO',
            'LLM_ENGINE',
            `Stream Groq iniciado con éxito (${this.model})`,
            {
              model: this.model,
              durationMs,
              intentionSnippet: context.intention.slice(0, 150),
            },
            200,
            durationMs
          )
        ).catch((e) => console.warn('[Telemetry Groq Fire-and-Forget Error]', e));
      }

      return this.toReadableStream(stream);
    } catch (err) {
      const durationMs = Date.now() - startTime;
      if (process.env.TELEMETRY_LLM_ENABLED !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo.log(
          new TelemetryEntry(
            'WARN',
            'LLM_ENGINE',
            `Fallo al iniciar stream Groq (${this.model}): ${err instanceof Error ? err.message : 'Error desconocido'}`,
            {
              model: this.model,
              durationMs,
              intentionSnippet: context.intention.slice(0, 150),
            },
            500,
            durationMs
          )
        ).catch((e) => console.warn('[Telemetry Groq Fire-and-Forget Error]', e));
      }
      return this.createFallbackStream();
    }
  }

  /**
   * Construye el mensaje de usuario en formato compacto.
   * Estructura: "Contexto: {hora} - {ubicación}. Intención: {intención}"
   */
  private buildUserMessage(context: FastContextDto): string {
    const contextParts: string[] = [];

    if (context.localTime) {
      contextParts.push(context.localTime);
    }
    if (context.currentLocation) {
      contextParts.push(context.currentLocation);
    }

    const contextStr = contextParts.length > 0
      ? `Contexto: ${contextParts.join(' - ')}. `
      : '';

    return `${contextStr}Intención: ${context.intention}`;
  }

  /**
   * Convierte el AsyncIterable de Groq en un ReadableStream (Web Streams API).
   * Implementa el Escudo Zod: intercepta el buffer, intenta parsear cada línea
   * con FastInsightZodSchema, instancia la entidad pura FastInsight y lo serializa
   * hacia el Stream codificado en NDJSON.
   */
  private toReadableStream(
    groqStream: AsyncIterable<Groq.Chat.Completions.ChatCompletionChunk>,
  ): ReadableStream {
    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        try {
          console.log('[GroqFastAiAdapter] Stream start');
          let buffer = '';
          for await (const chunk of groqStream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              buffer += content;
              
              // Intentar extraer líneas completas del buffer
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Dejar el resto en el buffer
              
              for (const line of lines) {
                if (!line.trim()) continue;
                try {
                  const rawObj = JSON.parse(line);
                  // Escudo Zod
                  const validation = FastInsightZodSchema.safeParse(rawObj);
                  if (validation.success) {
                    // Instanciación de Entidad de Dominio pura
                    const domainEntity = new FastInsight(
                      validation.data.category,
                      validation.data.observation,
                      validation.data.severityLevel
                    );
                    controller.enqueue(encoder.encode(JSON.stringify(domainEntity) + '\n'));
                  } else {
                    console.warn('[Zod Shield] Descartando alucinación de Fast AI (line):', validation.error);
                  }
                } catch (e) {
                   console.error('[GroqFastAiAdapter] Parse error (line):', e);
                }
              }
            }
          }
          
          // Procesar el resto del buffer si es posible
          if (buffer.trim()) {
            try {
              const rawObj = JSON.parse(buffer);
              const validation = FastInsightZodSchema.safeParse(rawObj);
              if (validation.success) {
                const domainEntity = new FastInsight(
                  validation.data.category,
                  validation.data.observation,
                  validation.data.severityLevel
                );
                controller.enqueue(encoder.encode(JSON.stringify(domainEntity) + '\n'));
              } else {
                console.warn('[Zod Shield] Descartando alucinación de Fast AI (buffer):', validation.error, buffer);
              }
            } catch (e) {
              console.error('[GroqFastAiAdapter] Parse error (buffer):', e, buffer);
            }
          }
          
          console.log('[GroqFastAiAdapter] Stream end');
          controller.close();
        } catch (e) {
          console.error('[GroqFastAiAdapter] Stream catch error:', e);
          controller.close();
        }
      },
    });
  }

  /**
   * Crea un ReadableStream con el mensaje de degradación elegante.
   * Valida con el propio Zod para asegurar contrato.
   */
  private createFallbackStream(): ReadableStream {
    const encoder = new TextEncoder();

    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(FALLBACK_MESSAGE + '\n'));
        controller.close();
      },
    });
  }
}
