import {
  TelemetryEntry,
  TelemetryFilter,
  RetentionRules,
} from '@/domain/entities/telemetry-entry.entity';

/**
 * Puerto de Salida Hexagonal para la persistencia, consulta y poda
 * de eventos de telemetría y trazabilidad.
 */
export interface TelemetryRepositoryPort {
  /**
   * Persiste un evento de telemetría de forma asíncrona.
   */
  log(entry: TelemetryEntry): Promise<void>;

  /**
   * Obtiene los registros de telemetría más recientes aplicando filtros opcionales.
   */
  getRecentLogs(filter?: TelemetryFilter): Promise<TelemetryEntry[]>;

  /**
   * Ejecuta la Poda Ontológica eliminando registros que superen las políticas de retención.
   */
  prune(rules: RetentionRules): Promise<{ deletedCount: number }>;
}
