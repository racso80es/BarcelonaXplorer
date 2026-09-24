/**
 * Puerto de Entrada Hexagonal: Auditoría de Salud y Telemetría del Bot de Telegram.
 * Desacopla la capa de presentación (UI) de la orquestación, validación de enrutamiento
 * y persistencia defensiva de telemetría.
 */

export type TelegramBotHealthState = 'ok' | 'warn' | 'error' | 'disabled';

export interface AuditTelegramBotHealthResult {
  readonly state: TelegramBotHealthState;
  readonly msg: string;
  readonly botUsername?: string;
  readonly webhookUrl?: string;
  readonly isWebhookAligned: boolean;
  readonly pendingUpdates: number;
  readonly lastErrorMessage?: string;
  readonly latencyMs: number;
  readonly isHealthy: boolean;
}

export interface AuditTelegramBotHealthUseCasePort {
  /**
   * Ejecuta la auditoría táctica de dos fases contra la API de Telegram,
   * evalúa la salud del enrutamiento y emite telemetría reactiva ante anomalías.
   */
  execute(): Promise<AuditTelegramBotHealthResult>;
}
