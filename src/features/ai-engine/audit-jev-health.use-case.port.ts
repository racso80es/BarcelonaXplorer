/**
 * Puerto de Entrada Hexagonal: Auditoría de Salud y Telemetría de Jev AI.
 * Desacopla la capa de presentación (UI) de la orquestación y persistencia de telemetría.
 */

export type JevHealthState = 'ok' | 'warn' | 'error';

export interface AuditJevHealthResult {
  readonly state: JevHealthState;
  readonly msg: string;
  readonly latencyMs: number;
  readonly model: string;
  readonly isHealthy: boolean;
}

export interface AuditJevHealthUseCasePort {
  /**
   * Ejecuta la sonda térmica contra Jev AI, audita latencia y disponibilidad,
   * y despacha telemetría de forma reactiva ante degradación o fallos.
   */
  execute(): Promise<AuditJevHealthResult>;
}
