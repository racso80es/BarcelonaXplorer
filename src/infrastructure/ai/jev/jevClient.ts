import {
  ITypedDecisionEngine,
  JevDecisionProbeResult,
  JevNoulEvaluation,
} from '@/application/ports/out/ITypedDecisionEngine';
import { TelemetryRepositoryPort } from '@/application/ports/out/telemetry-repository.port';
import { TelemetryEntry } from '@/domain/entities/telemetry-entry.entity';
import { getJevConfig, JevConfig } from './config';
import {
  JevModelsResponseSchema,
  JevNoulAnswerSchema,
  JevSystemOneResponseSchema,
} from './types';

/**
 * Adaptador de Infraestructura: Cliente HTTP para Jev AI (System One).
 *
 * Implementa ITypedDecisionEngine bajo los dogmas de la Constitución:
 * - Aislamiento del dominio e inversión de dependencias.
 * - Validación Zod en la frontera de datos.
 * - Tolerancia cero a tipos any.
 * - Resiliencia perimetral Fail-Soft ante cortes de red o caídas del servicio.
 * - Registro de inferencias en telemetría bajo LLM_ENGINE con nivel INFO.
 */
export class JevClient implements ITypedDecisionEngine {
  private readonly config: JevConfig;

  constructor(
    customConfig?: Partial<JevConfig>,
    private readonly telemetryRepo?: TelemetryRepositoryPort,
  ) {
    const baseConfig = getJevConfig();
    this.config = {
      ...baseConfig,
      ...customConfig,
    };
  }

  async evaluateHealth(): Promise<JevDecisionProbeResult> {
    const t0 = performance.now();

    if (!this.config.apiKey) {
      return {
        isHealthy: false,
        latencyMs: 0,
        error: 'JEV_API_KEY no configurada en el entorno',
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.config.healthTimeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl}/v1/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - t0);

      if (!response.ok) {
        let errorDetail = '';
        try {
          const body = (await response.json()) as { error?: { message?: string } };
          if (typeof body?.error?.message === 'string') {
            errorDetail = body.error.message;
          }
        } catch {
          // Si el cuerpo no es JSON, se conserva vacío
        }

        const statusLabels: Record<number, string> = {
          401: 'Clave de API inválida o revocada',
          402: 'Saldo de tokens o créditos insuficiente',
          429: 'Límite de cuota excedido',
          502: 'Gateway de Jev AI no disponible',
          503: 'Servicio upstream en mantenimiento',
        };

        const finalError =
          errorDetail || statusLabels[response.status] || `HTTP ${response.status} ${response.statusText}`;

        return {
          isHealthy: false,
          latencyMs,
          statusCode: response.status,
          error: finalError,
        };
      }

      const rawData: unknown = await response.json();
      const parsedData = JevModelsResponseSchema.parse(rawData);
      const modelCount = parsedData.models.length;

      return {
        isHealthy: true,
        latencyMs,
        statusCode: response.status,
        modelCount,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - t0);
      const isAbort =
        (err instanceof Error && err.name === 'AbortError') ||
        (err as { type?: string })?.type === 'aborted';

      const errorMsg = isAbort
        ? `Timeout perimetral excedido (${this.config.healthTimeoutMs}ms)`
        : err instanceof Error
          ? err.message
          : 'Fallo de conexión no especificado';

      return {
        isHealthy: false,
        latencyMs,
        error: `Fallo de red Jev AI: ${errorMsg}`,
      };
    }
  }

  async evaluateNoul(
    state: string,
    instruction: string,
    threshold = 0.5,
  ): Promise<JevNoulEvaluation> {
    if (!this.config.apiKey) {
      throw new Error('JEV_API_KEY no configurada');
    }

    const payload = {
      model: this.config.defaultModel,
      state,
      questions: {
        eval_question: {
          type: 'noul',
          instructions: instruction,
        },
      },
    };

    const startTime = Date.now();

    try {
      const response = await fetch(`${this.config.baseUrl}/v1/systemone`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Jev AI /v1/systemone error: HTTP ${response.status}`);
      }

      const rawJson: unknown = await response.json();
      const parsed = JevSystemOneResponseSchema.parse(rawJson);
      const rawAnswer = parsed.answers['eval_question'];
      const parsedNoul = JevNoulAnswerSchema.safeParse(rawAnswer);

      if (!parsedNoul.success) {
        throw new Error('Respuesta malformada de Jev AI para pregunta noul');
      }

      const durationMs = Date.now() - startTime;
      const probability = parsedNoul.data.noul;
      const isAffirmative = probability >= threshold;

      if (process.env.TELEMETRY_LLM_ENABLED !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo.log(
          new TelemetryEntry(
            'INFO',
            'LLM_ENGINE',
            `[Jev AI System One] Inferencia evaluada | Modelo: ${this.config.defaultModel}`,
            {
              model: this.config.defaultModel,
              state,
              instruction,
              threshold,
              probability,
              isAffirmative,
              durationMs,
            },
            200,
            durationMs,
          ),
        ).catch((e) => console.warn('[Telemetry Jev Fire-and-Forget Error]', e));
      }

      return {
        probability,
        isAffirmative,
      };
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;

      if (process.env.TELEMETRY_LLM_ENABLED !== 'false' && this.telemetryRepo) {
        void this.telemetryRepo.log(
          new TelemetryEntry(
            'ERROR',
            'LLM_ENGINE',
            `[Jev AI System One] Fallo en inferencia: ${err instanceof Error ? err.message : 'Error desconocido'}`,
            {
              model: this.config.defaultModel,
              state,
              instruction,
              error: err instanceof Error ? err.message : String(err),
              durationMs,
            },
            500,
            durationMs,
          ),
        ).catch((e) => console.warn('[Telemetry Jev Fire-and-Forget Error]', e));
      }

      throw err;
    }
  }
}
