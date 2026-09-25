import Groq from 'groq-sdk';
import { GeographicBounceGeneratorPort } from '@/application/ports/out/geographic-bounce-generator.port';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { TelemetryEntry } from '@/features/telemetry';
import {
  GEOGRAPHIC_REBOUND_SYSTEM_PROMPT,
  buildGeographicReboundUserPrompt,
} from '@/features/ai-engine/groq/prompts/geographic-rebound.prompt';

/**
 * Adaptador de Infraestructura para la generación de Rebotes Tácticos con Groq (SLM Ligero).
 *
 * Cuenta con degradación determinista elegante si la API de Groq no responde,
 * registrando telemetría bajo el contexto LLM_ENGINE con nivel INFO en caso de éxito.
 */
export class GroqGeographicBounceGenerator implements GeographicBounceGeneratorPort {
  private readonly client?: Groq;
  private readonly model: string;

  constructor(
    client?: Groq,
    private readonly telemetryRepo?: TelemetryRepositoryPort,
  ) {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      this.client = client ?? new Groq({ apiKey });
    }
    this.model = process.env.GROQ_FAST_MODEL ?? 'qwen/qwen3.8-27b';
  }

  async generateBounceMessage(rejectedEntity: string, prompt: string): Promise<string> {
    const fallbackMessage = `Mi radar táctico está calibrado exclusivamente para el asfalto de Barcelona. Si tienes planeado pasarte por la capital catalana, avísame y forjamos una ruta a medida.`;

    if (!this.client) {
      return fallbackMessage;
    }

    const startTime = Date.now();

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: GEOGRAPHIC_REBOUND_SYSTEM_PROMPT },
          { role: 'user', content: buildGeographicReboundUserPrompt(rejectedEntity, prompt) },
        ],
        temperature: 0.3,
        max_tokens: 60,
      });

      const durationMs = Date.now() - startTime;
      const message = completion.choices[0]?.message?.content?.trim();
      const finalMessage = message && message.length > 0 ? message : fallbackMessage;

      if (process.env.TELEMETRY_LLM_ENABLED !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo.log(
          new TelemetryEntry(
            'INFO',
            'LLM_ENGINE',
            `[Groq LLM Bounce] Generado mensaje de rebote para entidad '${rejectedEntity}'`,
            {
              model: this.model,
              rejectedEntity,
              prompt,
              bounceMessage: finalMessage,
              durationMs,
            },
            200,
            durationMs,
          ),
        ).catch((e) => console.warn('[Telemetry Groq Bounce Fire-and-Forget Error]', e));
      }

      return finalMessage;
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;

      if (process.env.TELEMETRY_LLM_ENABLED !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo.log(
          new TelemetryEntry(
            'WARN',
            'LLM_ENGINE',
            `[Groq LLM Bounce] Fallo al generar mensaje: ${err instanceof Error ? err.message : 'Error desconocido'}`,
            {
              model: this.model,
              rejectedEntity,
              prompt,
              error: err instanceof Error ? err.message : String(err),
              durationMs,
            },
            500,
            durationMs,
          ),
        ).catch((e) => console.warn('[Telemetry Groq Bounce Fire-and-Forget Error]', e));
      }

      return fallbackMessage;
    }
  }
}

