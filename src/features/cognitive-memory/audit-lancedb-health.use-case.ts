import type {
  AuditLanceDbHealthUseCasePort,
  AuditLanceDbHealthResult,
  LanceDbHealthState,
} from './audit-lancedb-health.use-case.port';
import type { IVectorStorePort } from './vector-store.port';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { TelemetryEntry } from '@/features/telemetry';
import {
  purgeFallbackVectors,
  PurgeFallbackVectorsReport,
} from './purge-fallback-vectors';

export type FallbackScannerFn = (options?: {
  dryRun?: boolean;
  uri?: string;
}) => Promise<PurgeFallbackVectorsReport>;

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
  private readonly fallbackScanner: FallbackScannerFn;

  constructor(
    private readonly vectorStore: IVectorStorePort,
    private readonly telemetryRepository?: TelemetryRepositoryPort,
    config?: AuditLanceDbHealthConfig,
    fallbackScanner?: FallbackScannerFn,
  ) {
    this.latencyWarnThresholdMs = config?.latencyWarnThresholdMs ?? 50;
    this.fallbackScanner = fallbackScanner ?? purgeFallbackVectors;
  }

  async execute(): Promise<AuditLanceDbHealthResult> {
    const probe = await this.vectorStore.ping();

    if (probe.ok) {
      let fallbackVectorCount = 0;
      try {
        const scanReport = await this.fallbackScanner({
          dryRun: true,
          uri: probe.path,
        });
        fallbackVectorCount = scanReport.tables.reduce(
          (acc, table) => acc + table.matches,
          0,
        );
      } catch {
        // Fail-Soft perimetral ante error en el escaneo de pureza
      }

      const isLatencyDegraded = probe.latencyMs >= this.latencyWarnThresholdMs;
      const isContaminated = fallbackVectorCount > 0;
      const isDegraded = isLatencyDegraded || isContaminated;
      const state: LanceDbHealthState = isDegraded ? 'warn' : 'ok';

      let msg: string;
      if (isContaminated && isLatencyDegraded) {
        msg = `Latencia Alta (${probe.latencyMs}ms) y ${fallbackVectorCount} vectores fallback detectados`;
      } else if (isContaminated) {
        msg = `${fallbackVectorCount} vectores fallback detectados en corpus`;
      } else if (isLatencyDegraded) {
        msg = `Latencia Alta (${probe.latencyMs}ms)`;
      } else {
        msg = 'Almacén Vectorial Saludable';
      }

      if (isContaminated && this.telemetryRepository) {
        await this.logSafely(
          'WARN',
          `[LanceDB] Vectores de fallback detectados en corpus: ${fallbackVectorCount}`,
          {
            fallbackVectorCount,
            path: probe.path,
            tableCount: probe.tableCount,
          },
          200,
          probe.latencyMs,
        );
      } else if (isLatencyDegraded && this.telemetryRepository) {
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
          probe.latencyMs,
        );
      }

      return {
        state,
        msg,
        path: probe.path,
        latencyMs: probe.latencyMs,
        tableCount: probe.tableCount,
        isHealthy: true,
        fallbackVectorCount,
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
