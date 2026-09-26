import Groq from 'groq-sdk';
import { IConversationalSLMPort } from '@/features/ai-engine';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { TelemetryEntry } from '@/features/telemetry';
import {
  GEOGRAPHIC_REBOUND_SYSTEM_PROMPT,
  buildGeographicReboundUserPrompt,
} from './prompts/geographic-rebound.prompt';
import {
  CONVERSATIONAL_REPROMPT_SYSTEM_PROMPT,
  buildConversationalRepromptUserPrompt,
} from './prompts/conversational-reprompt.prompt';
import {
  EMPATHETIC_DIALOGUE_SYSTEM_PROMPT,
  buildEmpatheticDialogueUserPrompt,
} from './prompts/empathetic-dialogue.prompt';

/**
 * Adaptador de Infraestructura para el SLM Rápido Conversacional usando Groq (System Two Ligero).
 *
 * Implementa IConversationalSLMPort:
 * - Genera rebotes empáticos en < 200 ms ante consultas fuera de perímetro.
 * - Genera repreguntas atómicas contextuales para recopilar variables faltantes de la matriz.
 * - Incluye degradación determinista Fail-Soft ante indisponibilidad de Groq.
 * - Registra trazas de telemetría bajo LLM_ENGINE con nivel INFO.
 */
export class GroqConversationalSlmAdapter implements IConversationalSLMPort {
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

  async generateBounceMessage(
    rejectedEntity: string,
    prompt: string,
  ): Promise<string> {
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
          {
            role: 'user',
            content: buildGeographicReboundUserPrompt(rejectedEntity, prompt),
          },
        ],
        temperature: 0.3,
        max_tokens: 60,
      });

      const durationMs = Date.now() - startTime;
      const message = completion.choices[0]?.message?.content?.trim();
      const finalMessage =
        message && message.length > 0 ? message : fallbackMessage;

      if (process.env.TELEMETRY_LLM_ENABLED !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo.log(
          new TelemetryEntry(
            'INFO',
            'LLM_ENGINE',
            `[Groq Conversational SLM Bounce] Generado mensaje de rebote para '${rejectedEntity}'`,
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
        ).catch((e) =>
          console.warn('[Telemetry Groq SLM Bounce Fire-and-Forget Error]', e),
        );
      }

      return finalMessage;
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;

      if (process.env.TELEMETRY_LLM_ENABLED !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo.log(
          new TelemetryEntry(
            'WARN',
            'LLM_ENGINE',
            `[Groq Conversational SLM Bounce] Fallo al generar rebote: ${err instanceof Error ? err.message : 'Error desconocido'}`,
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
        ).catch((e) =>
          console.warn('[Telemetry Groq SLM Bounce Fire-and-Forget Error]', e),
        );
      }

      return fallbackMessage;
    }
  }

  async generateRepromptMessage(
    missingVariable: string,
    prompt: string,
    currentContext?: string,
  ): Promise<string> {
    const fallbackReprompts: Record<string, string> = {
      time_window:
        '¡Suena genial! Para calibrar el ritmo exacto de la ruta, ¿cuántas horas o qué parte del día tienes disponible?',
      group_size:
        'Excelente plan. Para seleccionar los rincones y locales adecuados, ¿cuántas personas seréis?',
      vibe:
        'Apuntado. ¿Qué tipo de ambiente o ritmo buscáis para este itinerario?',
      constraints:
        'Perfecto. ¿Tenéis algún presupuesto estimado o restricción que deba tener en cuenta?',
    };

    const fallbackMessage =
      fallbackReprompts[missingVariable] ??
      '¡Me gusta la idea! Para afinar la ruta a tu medida, ¿podrías darme un poco más de detalle sobre tus horarios o preferencias?';

    if (!this.client) {
      return fallbackMessage;
    }

    const startTime = Date.now();

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: CONVERSATIONAL_REPROMPT_SYSTEM_PROMPT },
          {
            role: 'user',
            content: buildConversationalRepromptUserPrompt(
              missingVariable,
              prompt,
              currentContext,
            ),
          },
        ],
        temperature: 0.4,
        max_tokens: 75,
      });

      const durationMs = Date.now() - startTime;
      const message = completion.choices[0]?.message?.content?.trim();
      const finalMessage =
        message && message.length > 0 ? message : fallbackMessage;

      if (process.env.TELEMETRY_LLM_ENABLED !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo.log(
          new TelemetryEntry(
            'INFO',
            'LLM_ENGINE',
            `[Groq Conversational SLM Reprompt] Generada repregunta para '${missingVariable}'`,
            {
              model: this.model,
              missingVariable,
              prompt,
              repromptMessage: finalMessage,
              durationMs,
            },
            200,
            durationMs,
          ),
        ).catch((e) =>
          console.warn('[Telemetry Groq SLM Reprompt Fire-and-Forget Error]', e),
        );
      }

      return finalMessage;
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;

      if (process.env.TELEMETRY_LLM_ENABLED !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo.log(
          new TelemetryEntry(
            'WARN',
            'LLM_ENGINE',
            `[Groq Conversational SLM Reprompt] Fallo al generar repregunta: ${err instanceof Error ? err.message : 'Error desconocido'}`,
            {
              model: this.model,
              missingVariable,
              prompt,
              error: err instanceof Error ? err.message : String(err),
              durationMs,
            },
            500,
            durationMs,
          ),
        ).catch((e) =>
          console.warn('[Telemetry Groq SLM Reprompt Fire-and-Forget Error]', e),
        );
      }

      return fallbackMessage;
    }
  }

  async generateEmpatheticDialogue(
    prompt: string,
    currentContext?: string,
  ): Promise<string> {
    const fallbackMessage =
      'Te entiendo perfectamente. A veces el mejor plan en Barcelona es simplemente relajarse en una terracita y ver la vida pasar con calma. Avísame cuando te apetezca explorar.';

    if (!this.client) {
      return fallbackMessage;
    }

    const startTime = Date.now();

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: EMPATHETIC_DIALOGUE_SYSTEM_PROMPT },
          {
            role: 'user',
            content: buildEmpatheticDialogueUserPrompt(prompt, currentContext),
          },
        ],
        temperature: 0.5,
        max_tokens: 80,
      });

      const durationMs = Date.now() - startTime;
      const message = completion.choices[0]?.message?.content?.trim();
      const finalMessage =
        message && message.length > 0 ? message : fallbackMessage;

      if (process.env.TELEMETRY_LLM_ENABLED !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo.log(
          new TelemetryEntry(
            'INFO',
            'LLM_ENGINE',
            `[Groq Conversational SLM Dialogue] Respuesta empática generada`,
            {
              model: this.model,
              prompt,
              dialogueMessage: finalMessage,
              durationMs,
            },
            200,
            durationMs,
          ),
        ).catch((e) =>
          console.warn('[Telemetry Groq SLM Dialogue Fire-and-Forget Error]', e),
        );
      }

      return finalMessage;
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;

      if (process.env.TELEMETRY_LLM_ENABLED !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo.log(
          new TelemetryEntry(
            'WARN',
            'LLM_ENGINE',
            `[Groq Conversational SLM Dialogue] Fallo al generar diálogo empático: ${err instanceof Error ? err.message : 'Error desconocido'}`,
            {
              model: this.model,
              prompt,
              error: err instanceof Error ? err.message : String(err),
              durationMs,
            },
            500,
            durationMs,
          ),
        ).catch((e) =>
          console.warn('[Telemetry Groq SLM Dialogue Fire-and-Forget Error]', e),
        );
      }

      return fallbackMessage;
    }
  }
}
