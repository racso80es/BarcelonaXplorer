import {
  AuditTelegramBotHealthUseCasePort,
  AuditTelegramBotHealthResult,
  TelegramBotHealthState,
} from '@/application/ports/in/audit-telegram-bot-health.use-case.port';
import { TelegramBotGatewayPort } from '@/application/ports/out/telegram-bot-gateway.port';
import { TelemetryRepositoryPort } from '@/application/ports/out/telemetry-repository.port';
import { TelemetryEntry } from '@/domain/entities/telemetry-entry.entity';

export interface AuditTelegramBotHealthConfig {
  readonly expectedWebhookUrl?: string;
  readonly pendingUpdateWarnThreshold?: number;
}

/**
 * Caso de Uso: Auditoría de Salud y Telemetría del Bot de Telegram (Sensor C).
 *
 * Principio DIP (La Vía del Yunque):
 * Centraliza la orquestación de la sonda dual (identidad getMe + enrutamiento getWebhookInfo),
 * la verificación de alineación de la URL canónica de producción y el registro reactivo
 * en la bitácora sensorial de MySQL (SECURITY_PERIMETER) ante anomalías o degradación.
 */
export class AuditTelegramBotHealthUseCase implements AuditTelegramBotHealthUseCasePort {
  private readonly expectedWebhookUrl: string;
  private readonly pendingUpdateWarnThreshold: number;

  constructor(
    private readonly telegramBotGateway: TelegramBotGatewayPort,
    private readonly telemetryRepository: TelemetryRepositoryPort,
    config?: AuditTelegramBotHealthConfig
  ) {
    this.expectedWebhookUrl =
      config?.expectedWebhookUrl ||
      process.env.TELEGRAM_WEBHOOK_URL ||
      'https://barcelonaxplorer.com/api/telegram/webhook';
    this.pendingUpdateWarnThreshold = config?.pendingUpdateWarnThreshold ?? 100;
  }

  async execute(): Promise<AuditTelegramBotHealthResult> {
    const startTime = Date.now();

    // Sonda dual concurrente para minimizar la latencia agregada
    const [meSettled, webhookSettled] = await Promise.allSettled([
      this.telegramBotGateway.getMe(),
      this.telegramBotGateway.getWebhookInfo(),
    ]);

    const latencyMs = Date.now() - startTime;

    const botInfo = meSettled.status === 'fulfilled' ? meSettled.value : null;
    const webhookInfo = webhookSettled.status === 'fulfilled' ? webhookSettled.value : null;

    // 1. Evaluación de Identidad y Token (Fase A)
    if (!botInfo) {
      const state: TelegramBotHealthState = 'error';
      const msg = 'Token Inválido / No Configurado';

      await this.logSafely(
        'ERROR',
        `[Telegram Bot] Sonda táctica degradada: ${msg}`,
        {
          latencyMs,
          expectedWebhookUrl: this.expectedWebhookUrl,
          webhookActualUrl: webhookInfo?.url,
        },
        401,
        latencyMs
      );

      return {
        state,
        msg,
        botUsername: undefined,
        webhookUrl: webhookInfo?.url,
        isWebhookAligned: false,
        pendingUpdates: webhookInfo?.pendingUpdateCount ?? 0,
        lastErrorMessage: webhookInfo?.lastErrorMessage,
        latencyMs,
        isHealthy: false,
      };
    }

    const botUsername = botInfo.username ? `@${botInfo.username}` : `@${botInfo.firstName}`;

    // 2. Evaluación de Enrutamiento y Webhook (Fase B)
    if (!webhookInfo) {
      const state: TelegramBotHealthState = 'warn';
      const msg = 'Webhook Inaccesible';

      await this.logSafely(
        'WARN',
        `[Telegram Bot] Sonda táctica degradada: ${msg}`,
        {
          botUsername,
          latencyMs,
          expectedWebhookUrl: this.expectedWebhookUrl,
        },
        503,
        latencyMs
      );

      return {
        state,
        msg,
        botUsername,
        webhookUrl: undefined,
        isWebhookAligned: false,
        pendingUpdates: 0,
        lastErrorMessage: undefined,
        latencyMs,
        isHealthy: false,
      };
    }

    const isWebhookAligned =
      webhookInfo.url.trim().toLowerCase() === this.expectedWebhookUrl.trim().toLowerCase();

    // 3. Fricción por Desalineación de Webhook
    if (!isWebhookAligned) {
      const state: TelegramBotHealthState = 'warn';
      const msg = 'Webhook Desalineado';

      await this.logSafely(
        'WARN',
        `[Telegram Bot] Sonda táctica degradada: Webhook desalineado (${webhookInfo.url || 'vacía'})`,
        {
          botUsername,
          actualWebhookUrl: webhookInfo.url,
          expectedWebhookUrl: this.expectedWebhookUrl,
          pendingUpdates: webhookInfo.pendingUpdateCount,
          latencyMs,
        },
        200,
        latencyMs
      );

      return {
        state,
        msg,
        botUsername,
        webhookUrl: webhookInfo.url,
        isWebhookAligned: false,
        pendingUpdates: webhookInfo.pendingUpdateCount,
        lastErrorMessage: webhookInfo.lastErrorMessage,
        latencyMs,
        isHealthy: false,
      };
    }

    // 4. Fricción por Error de Entrega Reciente
    if (webhookInfo.lastErrorMessage) {
      const state: TelegramBotHealthState = 'warn';
      const msg = webhookInfo.lastErrorMessage.length > 50
        ? `${webhookInfo.lastErrorMessage.slice(0, 47)}...`
        : webhookInfo.lastErrorMessage;

      await this.logSafely(
        'WARN',
        `[Telegram Bot] Fricción de entrega reportada: ${webhookInfo.lastErrorMessage}`,
        {
          botUsername,
          webhookUrl: webhookInfo.url,
          lastErrorDate: webhookInfo.lastErrorDate,
          lastErrorMessage: webhookInfo.lastErrorMessage,
          pendingUpdates: webhookInfo.pendingUpdateCount,
          latencyMs,
        },
        200,
        latencyMs
      );

      return {
        state,
        msg,
        botUsername,
        webhookUrl: webhookInfo.url,
        isWebhookAligned: true,
        pendingUpdates: webhookInfo.pendingUpdateCount,
        lastErrorMessage: webhookInfo.lastErrorMessage,
        latencyMs,
        isHealthy: false,
      };
    }

    // 5. Advertencia por Saturación de Actualizaciones Pendientes
    if (webhookInfo.pendingUpdateCount >= this.pendingUpdateWarnThreshold) {
      const state: TelegramBotHealthState = 'warn';
      const msg = `Saturación (${webhookInfo.pendingUpdateCount} pendientes)`;

      await this.logSafely(
        'WARN',
        `[Telegram Bot] Volumen anómalo de actualizaciones pendientes: ${webhookInfo.pendingUpdateCount}`,
        {
          botUsername,
          webhookUrl: webhookInfo.url,
          pendingUpdates: webhookInfo.pendingUpdateCount,
          threshold: this.pendingUpdateWarnThreshold,
          latencyMs,
        },
        200,
        latencyMs
      );

      return {
        state,
        msg,
        botUsername,
        webhookUrl: webhookInfo.url,
        isWebhookAligned: true,
        pendingUpdates: webhookInfo.pendingUpdateCount,
        lastErrorMessage: undefined,
        latencyMs,
        isHealthy: false,
      };
    }

    // 6. Operación S+ Grade (Verde / Resonancia Táctica)
    return {
      state: 'ok',
      msg: botUsername,
      botUsername,
      webhookUrl: webhookInfo.url,
      isWebhookAligned: true,
      pendingUpdates: webhookInfo.pendingUpdateCount,
      lastErrorMessage: undefined,
      latencyMs,
      isHealthy: true,
    };
  }

  private async logSafely(
    level: 'WARN' | 'ERROR',
    message: string,
    payload: Record<string, unknown>,
    statusCode: number,
    durationMs: number
  ): Promise<void> {
    try {
      const entry = new TelemetryEntry(
        level,
        'SECURITY_PERIMETER',
        message,
        payload,
        statusCode,
        durationMs,
        process.env.NODE_ENV || 'production'
      );
      await this.telemetryRepository.log(entry);
    } catch (error) {
      console.warn(
        '[AuditTelegramBotHealthUseCase] Fallo silencioso al emitir telemetría reactiva:',
        error instanceof Error ? error.message : error
      );
    }
  }
}
