import { AiGeneratorPort } from '@/application/ports/out/ai-generator.port';
import { TelemetryRepositoryPort } from '@/application/ports/out/telemetry-repository.port';
import { TacticalRoute } from '@/domain/entities/tactical-route.entity';
import { TelemetryEntry } from '@/domain/entities/telemetry-entry.entity';
import {
  LlmEnvironmentContext,
  LlmTelemetryEvent,
  LlmReturnedRouteData,
} from '@/domain/entities/llm-telemetry.types';

export interface GenerateTacticalRouteInput {
  prompt: string;
  environment?: LlmEnvironmentContext;
}

/**
 * Caso de Uso: Aduana Cognitiva y Orquestación Táctica (Vía Lenta).
 *
 * Actúa como intermediario entre la capa HTTP y el adaptador de IA (Gemini/Groq),
 * auditando termodinámicamente el ciclo de inferencia bajo el contexto LLM_ENGINE
 * sin que los adaptadores se auditen a sí mismos.
 */
export class GenerateTacticalRouteUseCase {
  constructor(
    private readonly aiPort: AiGeneratorPort,
    private readonly telemetryRepo?: TelemetryRepositoryPort,
  ) {}

  async execute(input: GenerateTacticalRouteInput): Promise<TacticalRoute | string> {
    const startTime = Date.now();
    const prompt = input.prompt;
    const environment: LlmEnvironmentContext = input.environment ?? {
      localTime: new Date().toISOString(),
    };

    try {
      const route = await this.aiPort.generateTacticalRoute(prompt);
      const durationMs = Date.now() - startTime;

      // Detección de Fricción Cognitiva en la respuesta del modelo
      const isClaudication =
        (typeof route.summary === 'string' &&
          route.summary.includes('No se pudo forjar la ruta.')) ||
        (Array.isArray(route.waypoints) && route.waypoints.length === 0);

      if (isClaudication) {
        const rawOutput = typeof route.summary === 'string' ? route.summary : undefined;
        this.emitTelemetry({
          level: 'WARN',
          context: 'LLM_ENGINE',
          message: `[LLM WARN] Fricción cognitiva: No se pudo forjar la ruta. | Prompt: ${prompt.slice(0, 160)}`,
          statusCode: 422,
          durationMs,
          payload: {
            model: this.resolveModelName(),
            prompt,
            promptLength: prompt.length,
            reason: 'NO_ROUTE_FORGED',
            environmentVariables: environment, // Obligatorio por Type Narrowing
            rawResponse: rawOutput,
            request: {
              prompt,
              promptLength: prompt.length,
              environmentVariables: environment,
            },
            response: {
              status: 'CLAUDICATION',
              message: 'No se pudo forjar la ruta.',
              rawOutput,
            },
          },
        });

        return 'No se pudo forjar la ruta.';
      }

      // Estructuración de los datos devueltos para el registro de telemetría persistido
      const returnedRouteData: LlmReturnedRouteData = {
        id: route.id,
        summary: route.summary,
        waypointsCount: route.waypoints?.length ?? 0,
        waypoints: (route.waypoints ?? []).map((wp) => ({
          id: wp.id,
          title: wp.title,
          description: wp.description,
          coordinates: wp.coordinates
            ? { lat: wp.coordinates.lat, lng: wp.coordinates.lng }
            : undefined,
          timeSpan: wp.timeSpan
            ? { start: wp.timeSpan.start, end: wp.timeSpan.end }
            : undefined,
          recommendations: wp.recommendations ?? [],
        })),
      };

      // Éxito Termodinámico (INFO): Se persisten la solicitud y los datos devueltos completos
      this.emitTelemetry({
        level: 'INFO',
        context: 'LLM_ENGINE',
        message: `[LLM SUCCESS] Ruta forjada id: ${route.id} | Prompt: ${prompt.slice(0, 160)}`,
        statusCode: 200,
        durationMs,
        payload: {
          model: this.resolveModelName(),
          prompt,
          promptLength: prompt.length,
          routeId: route.id,
          waypointsCount: route.waypoints?.length ?? 0,
          environmentVariables: environment,
          request: {
            prompt,
            promptLength: prompt.length,
            environmentVariables: environment,
          },
          response: returnedRouteData,
        },
      });

      return route;
    } catch (error: unknown) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      // Comprobar si la excepción misma expresa claudicación ("No se pudo forjar la ruta.")
      if (errorMessage.includes('No se pudo forjar la ruta.')) {
        this.emitTelemetry({
          level: 'WARN',
          context: 'LLM_ENGINE',
          message: `[LLM WARN] Fricción cognitiva: No se pudo forjar la ruta. | Prompt: ${prompt.slice(0, 160)}`,
          statusCode: 422,
          durationMs,
          payload: {
            model: this.resolveModelName(),
            prompt,
            promptLength: prompt.length,
            reason: 'NO_ROUTE_FORGED',
            environmentVariables: environment, // Obligatorio por Type Narrowing
            rawResponse: errorMessage,
            request: {
              prompt,
              promptLength: prompt.length,
              environmentVariables: environment,
            },
            response: {
              status: 'CLAUDICATION',
              message: 'No se pudo forjar la ruta.',
              rawOutput: errorMessage,
            },
          },
        });

        return 'No se pudo forjar la ruta.';
      }

      // Fallo periférico de infraestructura, cuota o red (ERROR)
      const statusCode = this.extractStatusCode(error);
      const stackTraceSnippet = error instanceof Error ? error.stack?.slice(0, 300) : undefined;
      this.emitTelemetry({
        level: 'ERROR',
        context: 'LLM_ENGINE',
        message: `[LLM ERROR] Excepción de infraestructura: ${errorMessage}`,
        statusCode,
        durationMs,
        payload: {
          model: this.resolveModelName(),
          prompt,
          promptLength: prompt.length,
          errorMessage,
          statusCode,
          environmentVariables: environment,
          stackTraceSnippet,
          request: {
            prompt,
            promptLength: prompt.length,
            environmentVariables: environment,
          },
          response: {
            statusCode,
            error: errorMessage,
            stackTraceSnippet,
          },
        },
      });

      throw error;
    }
  }

  /**
   * Despacha el chispazo de telemetría bajo el patrón Fire-and-Forget
   * con aislamiento Fail-Safe ante posibles caídas de MySQL.
   */
  private emitTelemetry(event: LlmTelemetryEvent): void {
    if (process.env.TELEMETRY_LLM_ENABLED === 'false' || !this.telemetryRepo) {
      return;
    }

    // Sanitización síncrona en memoria antes de despachar hacia el repositorio
    const sanitizedPayload = TelemetryEntry.sanitizePayload(event.payload);

    void this.telemetryRepo
      .log(
        new TelemetryEntry(
          event.level,
          event.context,
          event.message,
          sanitizedPayload,
          event.statusCode,
          event.durationMs,
        ),
      )
      .catch((err) => {
        console.warn('[Telemetry LLM Fire-and-Forget Fallback]', err);
      });
  }

  private resolveModelName(): string {
    return process.env.GEMINI_MODELS?.split(',')[0]?.trim() || 'gemini-1.5-flash';
  }

  private extractStatusCode(error: unknown): number {
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      if (typeof err.status === 'number') return err.status;
      if (typeof err.statusCode === 'number') return err.statusCode;
      const msg = typeof err.message === 'string' ? err.message : '';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) return 429;
      if (msg.includes('503')) return 503;
      if (msg.includes('401')) return 401;
    }
    return 500;
  }
}
