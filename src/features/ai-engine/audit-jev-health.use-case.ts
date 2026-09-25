import {
  AuditJevHealthUseCasePort,
  AuditJevHealthResult,
  JevHealthState,
} from '@/application/ports/in/audit-jev-health.use-case.port';
import { ITypedDecisionEngine } from '@/features/ai-engine';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { TelemetryEntry } from '@/features/telemetry';

export interface AuditJevHealthConfig {
  latencyWarnThresholdMs?: number;
  defaultModel?: string;
}

/**
 * Caso de Uso: Auditoría de Salud y Telemetría de Jev AI (System One).
 *
 * Principio DIP (Vía del Yunque):
 * Centraliza la orquestación de la sonda térmica y el registro reactivo de
 * telemetría defensiva, liberando por completo a la capa UI (JevTelemetryCard)
 * de responsabilidades de persistencia y mutación de estado.
 */
export class AuditJevHealthUseCase implements AuditJevHealthUseCasePort {
  private readonly latencyWarnThresholdMs: number;
  private readonly defaultModel: string;

  constructor(
    private readonly decisionEngine: ITypedDecisionEngine,
    private readonly telemetryRepository: TelemetryRepositoryPort,
    config?: AuditJevHealthConfig,
  ) {
    this.latencyWarnThresholdMs = config?.latencyWarnThresholdMs ?? 800;
    this.defaultModel = config?.defaultModel ?? 'jev-latest';
  }

  async execute(): Promise<AuditJevHealthResult> {
    const probe = await this.decisionEngine.evaluateHealth();

    if (probe.isHealthy) {
      const isDegraded = probe.latencyMs >= this.latencyWarnThresholdMs;
      const state: JevHealthState = isDegraded ? 'warn' : 'ok';
      const msg = isDegraded
        ? `Latencia Alta (${probe.latencyMs}ms)`
        : `Operativo (${probe.latencyMs}ms)`;

      if (isDegraded) {
        await this.logSafely(
          'WARN',
          `[Jev AI] Latencia térmica degradada: ${probe.latencyMs}ms`,
          {
            latencyMs: probe.latencyMs,
            thresholdMs: this.latencyWarnThresholdMs,
          },
          200,
          probe.latencyMs,
        );
      }

      return {
        state,
        msg,
        latencyMs: probe.latencyMs,
        model: this.defaultModel,
        isHealthy: true,
      };
    }

    // Estado Fallido / No Saludable
    const state: JevHealthState = 'error';
    const msg = probe.error || 'Sin respuesta';

    await this.logSafely(
      'ERROR',
      `[Jev AI] Sonda de salud fallida: ${msg}`,
      {
        error: probe.error,
        statusCode: probe.statusCode,
        latencyMs: probe.latencyMs,
      },
      probe.statusCode ?? 503,
      probe.latencyMs,
    );

    return {
      state,
      msg,
      latencyMs: probe.latencyMs,
      model: this.defaultModel,
      isHealthy: false,
    };
  }

  private async logSafely(
    level: 'WARN' | 'ERROR',
    message: string,
    payload: Record<string, unknown>,
    statusCode: number,
    durationMs: number,
  ): Promise<void> {
    try {
      const entry = new TelemetryEntry(
        level,
        'SECURITY_PERIMETER',
        message,
        payload,
        statusCode,
        durationMs,
      );
      await this.telemetryRepository.log(entry);
    } catch {
      // Fail-Soft perimetral: el fallo del almacenamiento secundario nunca interrumpe la auditoría
    }
  }
}
