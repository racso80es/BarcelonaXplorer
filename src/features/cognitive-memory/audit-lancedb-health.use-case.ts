import {
  AuditLanceDbHealthUseCasePort,
  AuditLanceDbHealthResult,
  LanceDbHealthState,
} from '@/application/ports/in/audit-lancedb-health.use-case.port';
import { IVectorStorePort } from '@/application/ports/out/vector-store.port';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { TelemetryEntry } from '@/features/telemetry';

export interface AuditLanceDbHealthConfig {
  readonly latencyWarnThresholdMs?: number;
}

/**
 * Caso de Uso: Auditoría de Salud y Telemetría del Almacén Vectorial Embebido (LanceDB).
 *
 * Principio DIP (La Vía del Yunque):
 * Centraliza la orquestación de la sonda sensorial sobre disco/Arrow y el registro
 * reactivo en la bitácora de MySQL (SYSTEM) ante anomalías o degradación de latencia/permisos.
 */
export class AuditLanceDbHealthUseCase implements AuditLanceDbHealthUseCasePort {
  private readonly latencyWarnThresholdMs: number;

  constructor(
    private readonly vectorStore: IVectorStorePort,
    private readonly telemetryRepository?: TelemetryRepositoryPort,
    config?: AuditLanceDbHealthConfig
  ) {
    this.latencyWarnThresholdMs = config?.latencyWarnThresholdMs ?? 50;
  }

  async execute(): Promise<AuditLanceDbHealthResult> {
    const probe = await this.vectorStore.ping();

    if (probe.ok) {
      const isDegraded = probe.latencyMs >= this.latencyWarnThresholdMs;
      const state: LanceDbHealthState = isDegraded ? 'warn' : 'ok';
      const msg = isDegraded
        ? `Latencia Alta (${probe.latencyMs}ms)`
        : 'Almacén Vectorial Saludable';

      if (isDegraded && this.telemetryRepository) {
        await this.logSafely(
          'WARN',
          `[LanceDB] Latencia de acceso a disco degradada: ${probe.latencyMs}ms`,
          {
            latencyMs: probe.latencyMs,
            thresholdMs: this.latencyWarnThresholdMs,
            path: probe.path,
            tableCount: probe.tableCount,
          },
          200,
          probe.latencyMs
        );
      }

      return {
        state,
        msg,
        path: probe.path,
        latencyMs: probe.latencyMs,
        tableCount: probe.tableCount,
        isHealthy: true,
      };
    }

    // Estado Fallido (Error de permisos POSIX, EACCES o descriptor cerrado)
    const state: LanceDbHealthState = 'error';
    const msg = probe.error ? `Fallo: ${probe.error}` : 'Fallo de acceso o permisos POSIX';

    if (this.telemetryRepository) {
      await this.logSafely(
        'ERROR',
        `[LanceDB] Sonda vectorial fallida: ${msg}`,
        {
          error: probe.error,
          path: probe.path,
          latencyMs: probe.latencyMs,
        },
        500,
        probe.latencyMs
      );
    }

    return {
      state,
      msg,
      path: probe.path,
      latencyMs: probe.latencyMs,
      tableCount: 0,
      isHealthy: false,
    };
  }

  private async logSafely(
    level: 'WARN' | 'ERROR',
    message: string,
    payload: Record<string, unknown>,
    statusCode: number,
    durationMs: number
  ): Promise<void> {
    if (!this.telemetryRepository) return;
    try {
      const entry = new TelemetryEntry(
        level,
        'SYSTEM',
        message,
        payload,
        statusCode,
        durationMs
      );
      await this.telemetryRepository.log(entry);
    } catch {
      // Fail-Soft perimetral: el fallo de telemetría secundaria nunca colapsa la sonda
    }
  }
}
