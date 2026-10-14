import type { IConversationalSLMPort } from '@/features/ai-engine';
import type { EmpatheticDialogueResult } from '@/features/ai-engine/conversational-slm.port';
import { IaGatewayClient } from './ia-gateway.client';
import type { TelemetryRepositoryPort } from '@/features/telemetry';
import { PrismaTelemetryRepository } from '@/features/telemetry/server';
import { TelemetryEntry } from '@/features/telemetry';
import {
  GEOGRAPHIC_REBOUND_SYSTEM_PROMPT,
  buildGeographicReboundUserPrompt,
} from '../groq/prompts/geographic-rebound.prompt';
import {
  CONVERSATIONAL_REPROMPT_SYSTEM_PROMPT,
  buildConversationalRepromptUserPrompt,
} from '../groq/prompts/conversational-reprompt.prompt';
import {
  EMPATHETIC_DIALOGUE_SYSTEM_PROMPT,
  buildEmpatheticDialogueUserPrompt,
} from '../groq/prompts/empathetic-dialogue.prompt';
import {
  CONTEXTUAL_GREETING_SYSTEM_PROMPT,
  buildContextualGreetingUserPrompt,
} from '../groq/prompts/contextual-greeting.prompt';
import type { IgnitionSensoryContextDto } from '@/features/triage/ignition.schema';
import { z } from 'zod';
import {
  SupportedLanguage,
  SupportedLanguageVo,
  SUPPORTED_LANGUAGES,
  getUiDictionary,
} from '@/features/i18n';

/**
 * Adaptador de infraestructura para el SLM Conversacional rápido a través de IA Gateway.
 *
 * Implementa IConversationalSLMPort delegando la inferencia rápida a IA Gateway ('FAST_LLM').
 * Aplica degradación fail-soft determinista ante indisponibilidad del gateway o credenciales ausentes,
 * garantizando que el usuario final reciba siempre una respuesta natural y nunca errores crudos.
 */
export class GatewayConversationalSlmAdapter implements IConversationalSLMPort {
  private readonly client: IaGatewayClient;
  private readonly telemetryRepo?: TelemetryRepositoryPort;
  private readonly modelId: string;

  constructor(
    client?: IaGatewayClient,
    telemetryRepo?: TelemetryRepositoryPort,
    modelId: string = 'llama-3.3-70b-versatile'
  ) {
    this.client = client ?? new IaGatewayClient(undefined, telemetryRepo);
    this.telemetryRepo = telemetryRepo ?? new PrismaTelemetryRepository();
    this.modelId = modelId;
  }

  getActiveModelId(): string {
    return this.modelId;
  }

  async generateBounceMessage(
    rejectedEntity: string,
    prompt: string
  ): Promise<string> {
    const fallbackMessage =
      'Mi radar táctico está calibrado exclusivamente para el asfalto de Barcelona. Si tienes planeado pasarte por la capital catalana, avísame y forjamos una ruta a medida.';

    const startTime = Date.now();

    try {
      const userPrompt = buildGeographicReboundUserPrompt(rejectedEntity, prompt);
      const message = await this.client.generateText(userPrompt, 'FAST_LLM', {
        systemInstruction: GEOGRAPHIC_REBOUND_SYSTEM_PROMPT,
        temperature: 0.3,
      });

      const trimmed = message?.trim();
      const finalMessage = trimmed && trimmed.length > 0 ? trimmed : fallbackMessage;
      const durationMs = Date.now() - startTime;

      if (process.env['TELEMETRY_LLM_ENABLED'] !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo
          .log(
            new TelemetryEntry(
              'INFO',
              'LLM_ENGINE',
              `[Gateway SLM Bounce] Generado mensaje de rebote para '${rejectedEntity}'`,
              {
                model: this.modelId,
                rejectedEntity,
                prompt,
                bounceMessage: finalMessage,
                durationMs,
              },
              200,
              durationMs
            )
          )
          .catch((e) => console.warn('[Telemetry Fire-and-Forget Error]', e));
      }

      return finalMessage;
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;

      if (process.env['TELEMETRY_LLM_ENABLED'] !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo
          .log(
            new TelemetryEntry(
              'WARN',
              'LLM_ENGINE',
              `[Gateway SLM Bounce] Fallo al generar rebote: ${err instanceof Error ? err.message : 'Error desconocido'}`,
              {
                model: this.modelId,
                rejectedEntity,
                prompt,
                error: err instanceof Error ? err.message : String(err),
                durationMs,
              },
              500,
              durationMs
            )
          )
          .catch((e) => console.warn('[Telemetry Fire-and-Forget Error]', e));
      }

      return fallbackMessage;
    }
  }

  async generateRepromptMessage(
    missingVariable: string,
    prompt: string,
    currentContext?: string
  ): Promise<string> {
    const dayMatch = prompt.match(
      /\b(domingo|s[aá]bado|lunes|martes|mi[eé]rcoles|jueves|viernes|diumenge|dissabte|dilluns|dimarts|dimecres|dijous|divendres|sunday|saturday|monday|tuesday|wednesday|thursday|friday|\d{4}-\d{2}-\d{2}|\d{1,2}\s+de\s+[a-z]+)\b/i,
    );
    const dayStr = dayMatch ? dayMatch[0] : 'el día indicado';

    const fallbackReprompts: Record<string, string> = {
      time_window:
        '¡Suena genial! Para calibrar el ritmo exacto de la ruta, ¿cuántas horas o qué parte del día tienes disponible?',
      concrete_date:
        `¡Entendido para ${dayStr}! Para calibrar la ruta y disponibilidad con precisión, ¿qué fecha concreta tienes en mente?`,
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

    const startTime = Date.now();

    try {
      const userPrompt = buildConversationalRepromptUserPrompt(
        missingVariable,
        prompt,
        currentContext
      );
      const message = await this.client.generateText(userPrompt, 'FAST_LLM', {
        systemInstruction: CONVERSATIONAL_REPROMPT_SYSTEM_PROMPT,
        temperature: 0.4,
      });

      const trimmed = message?.trim();
      const finalMessage = trimmed && trimmed.length > 0 ? trimmed : fallbackMessage;
      const durationMs = Date.now() - startTime;

      if (process.env['TELEMETRY_LLM_ENABLED'] !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo
          .log(
            new TelemetryEntry(
              'INFO',
              'LLM_ENGINE',
              `[Gateway SLM Reprompt] Generada repregunta para '${missingVariable}'`,
              {
                model: this.modelId,
                missingVariable,
                prompt,
                repromptMessage: finalMessage,
                durationMs,
              },
              200,
              durationMs
            )
          )
          .catch((e) => console.warn('[Telemetry Fire-and-Forget Error]', e));
      }

      return finalMessage;
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;

      if (process.env['TELEMETRY_LLM_ENABLED'] !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo
          .log(
            new TelemetryEntry(
              'WARN',
              'LLM_ENGINE',
              `[Gateway SLM Reprompt] Fallo al generar repregunta: ${err instanceof Error ? err.message : 'Error desconocido'}`,
              {
                model: this.modelId,
                missingVariable,
                prompt,
                error: err instanceof Error ? err.message : String(err),
                durationMs,
              },
              500,
              durationMs
            )
          )
          .catch((e) => console.warn('[Telemetry Fire-and-Forget Error]', e));
      }

      return fallbackMessage;
    }
  }

  async generateEmpatheticDialogue(
    prompt: string,
    currentContext?: string
  ): Promise<EmpatheticDialogueResult> {
    const fallbackMessage =
      'Te entiendo perfectamente. A veces el mejor plan en Barcelona es simplemente relajarse en una terracita y ver la vida pasar con calma. Avísame cuando te apetezca explorar.';

    const startTime = Date.now();

    try {
      const userPrompt = buildEmpatheticDialogueUserPrompt(prompt, currentContext);
      const message = await this.client.generateText(userPrompt, 'FAST_LLM', {
        systemInstruction: EMPATHETIC_DIALOGUE_SYSTEM_PROMPT,
        temperature: 0.5,
      });

      const trimmed = message?.trim();
      const finalMessage = trimmed && trimmed.length > 0 ? trimmed : fallbackMessage;
      const durationMs = Date.now() - startTime;

      if (process.env['TELEMETRY_LLM_ENABLED'] !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo
          .log(
            new TelemetryEntry(
              'INFO',
              'LLM_ENGINE',
              '[Gateway SLM Dialogue] Respuesta empática generada',
              {
                model: this.modelId,
                prompt,
                dialogueMessage: finalMessage,
                durationMs,
              },
              200,
              durationMs
            )
          )
          .catch((e) => console.warn('[Telemetry Fire-and-Forget Error]', e));
      }

      return {
        message: finalMessage,
      };
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;

      if (process.env['TELEMETRY_LLM_ENABLED'] !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo
          .log(
            new TelemetryEntry(
              'WARN',
              'LLM_ENGINE',
              `[Gateway SLM Dialogue] Fallo al generar diálogo empático: ${err instanceof Error ? err.message : 'Error desconocido'}`,
              {
                model: this.modelId,
                prompt,
                error: err instanceof Error ? err.message : String(err),
                durationMs,
              },
              500,
              durationMs
            )
          )
          .catch((e) => console.warn('[Telemetry Fire-and-Forget Error]', e));
      }

      return { message: fallbackMessage };
    }
  }

  async generateContextualGreeting(
    sensoryContext: IgnitionSensoryContextDto
  ): Promise<string> {
    const fallbackMessage =
      sensoryContext.period === 'DAWN'
        ? '¡Buenas noches! Si estás planificando a deshoras, dime qué tienes en mente y dejamos lista tu ruta por Barcelona.'
        : sensoryContext.period === 'MORNING'
          ? '¡Buenos días! Barcelona amanece lista para ser explorada. ¿Qué plan te apetece trazar hoy?'
          : sensoryContext.period === 'AFTERNOON'
            ? '¡Buenas tardes! ¿Hacemos una pausa o exploramos nuevos rincones de la ciudad?'
            : '¡Buenas noches! Barcelona ofrece infinitas opciones tras la caída del sol. ¿Qué te gustaría descubrir?';

    const startTime = Date.now();

    try {
      const userPrompt = buildContextualGreetingUserPrompt(sensoryContext);
      const message = await this.client.generateText(userPrompt, 'FAST_LLM', {
        systemInstruction: CONTEXTUAL_GREETING_SYSTEM_PROMPT,
        temperature: 0.4,
      });

      const trimmed = message?.trim();
      const finalMessage = trimmed && trimmed.length > 0 ? trimmed : fallbackMessage;
      const durationMs = Date.now() - startTime;

      if (process.env['TELEMETRY_LLM_ENABLED'] !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo
          .log(
            new TelemetryEntry(
              'INFO',
              'LLM_ENGINE',
              '[Gateway SLM Greeting] Saludo contextual generado exitosamente',
              {
                model: this.modelId,
                period: sensoryContext.period,
                device: sensoryContext.device,
                hasPriorMemory: Boolean(sensoryContext.priorMemoryExcerpt),
                greeting: finalMessage,
                durationMs,
              },
              200,
              durationMs
            )
          )
          .catch((e) => console.warn('[Telemetry Fire-and-Forget Error]', e));
      }

      return finalMessage;
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;

      if (process.env['TELEMETRY_LLM_ENABLED'] !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo
          .log(
            new TelemetryEntry(
              'WARN',
              'LLM_ENGINE',
              `[Gateway SLM Greeting] Fallo al generar saludo contextual: ${err instanceof Error ? err.message : 'Error desconocido'}`,
              {
                model: this.modelId,
                error: err instanceof Error ? err.message : String(err),
                durationMs,
              },
              500,
              durationMs
            )
          )
          .catch((e) => console.warn('[Telemetry Fire-and-Forget Error]', e));
      }

      return fallbackMessage;
    }
  }

  async detectLanguageIntent(
    prompt: string,
    currentLanguage: SupportedLanguage
  ): Promise<SupportedLanguage> {
    const startTime = Date.now();
    const whitelist = SUPPORTED_LANGUAGES.join(', ');

    try {
      const completion = await this.client.generateText(
        `Idioma actual: ${currentLanguage}\nMensaje: ${prompt}`,
        'FAST_LLM',
        {
          systemInstruction: `Eres un clasificador lingüístico determinista. Responde ÚNICAMENTE con JSON {"language":"<code>"} donde <code> es exactamente uno de: ${whitelist}. Si el usuario pide un cambio de idioma, usa ese código. Si no hay cambio claro, usa el idioma actual.`,
          temperature: 0,
        }
      );

      const raw = completion?.trim();
      let candidate: string | undefined;
      if (raw) {
        try {
          const parsed: unknown = JSON.parse(raw);
          const boxed = z.object({ language: z.string() }).safeParse(parsed);
          candidate = boxed.success ? boxed.data.language : raw;
        } catch {
          candidate = raw;
        }
      }

      const resolved = SupportedLanguageVo.from(candidate ?? currentLanguage).value;

      if (process.env['TELEMETRY_LLM_ENABLED'] !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo
          .log(
            new TelemetryEntry(
              'INFO',
              'LLM_ENGINE',
              '[Gateway SLM Language] Intención lingüística acorralada',
              {
                model: this.modelId,
                currentLanguage,
                resolved,
                durationMs: Date.now() - startTime,
              },
              200,
              Date.now() - startTime
            )
          )
          .catch((e) => console.warn('[Telemetry Fire-and-Forget Error]', e));
      }

      return resolved;
    } catch {
      return currentLanguage;
    }
  }

  async generateClaudicationMessage(
    prompt: string,
    language: SupportedLanguage = 'es',
  ): Promise<string> {
    const fallbackMessage = getUiDictionary(language).orchestrator.defaultClaudicationMessage;
    const startTime = Date.now();

    try {
      const systemInstruction = `Eres el redactor de asistencia de BarcelonaXplorer. Informa con amabilidad y brevedad (máximo 2 oraciones) en el idioma ${language} de que el horario detallado de la ruta no se ha podido cerrar y que el usuario puede reenviar o ajustar ligeramente su petición. Prohibido terminantemente pedir de nuevo la ventana horaria o mencionar "time_window". Prohibido mencionar términos técnicos como "Zod", "aduana" o "contrato de datos".`;
      const userPrompt = `Consulta del usuario: ${prompt}\nRedacta el mensaje de aviso en idioma ${language}.`;

      const message = await this.client.generateText(userPrompt, 'FAST_LLM', {
        systemInstruction,
        temperature: 0.3,
      });

      const trimmed = message?.trim();
      const finalMessage = trimmed && trimmed.length > 0 ? trimmed : fallbackMessage;
      const durationMs = Date.now() - startTime;

      if (process.env['TELEMETRY_LLM_ENABLED'] !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo
          .log(
            new TelemetryEntry(
              'INFO',
              'LLM_ENGINE',
              '[Gateway SLM Claudication] Mensaje de claudicación horaria generado',
              {
                model: this.modelId,
                prompt,
                language,
                claudicationMessage: finalMessage,
                durationMs,
              },
              200,
              durationMs,
            ),
          )
          .catch((e) => console.warn('[Telemetry Fire-and-Forget Error]', e));
      }

      return finalMessage;
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;

      if (process.env['TELEMETRY_LLM_ENABLED'] !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo
          .log(
            new TelemetryEntry(
              'WARN',
              'LLM_ENGINE',
              `[Gateway SLM Claudication] Fallo al generar mensaje de claudicación: ${err instanceof Error ? err.message : 'Error desconocido'}`,
              {
                model: this.modelId,
                prompt,
                language,
                error: err instanceof Error ? err.message : String(err),
                durationMs,
              },
              500,
              durationMs,
            ),
          )
          .catch((e) => console.warn('[Telemetry Fire-and-Forget Error]', e));
      }

      return fallbackMessage;
    }
  }
}
