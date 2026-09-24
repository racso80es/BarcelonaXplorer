import {
  TelegramBotGatewayPort,
  TelegramButton,
  TelegramBotInfo,
  TelegramWebhookInfo,
} from '@/application/ports/out/telegram-bot-gateway.port';
import {
  TelegramGetMeResponseSchema,
  TelegramGetWebhookInfoResponseSchema,
} from '@/domain/schemas/telegram-webhook.schema';
import { constantTimeEqualSync } from '@/infrastructure/security/crypto.utils';

/**
 * Expresión regular que detecta y redacta tokens de la Telegram Bot API en URLs o cadenas de error.
 * Formato URL estándar: https://api.telegram.org/bot<TOKEN>/<METODO>
 */
const TELEGRAM_TOKEN_URL_REGEX = /\/bot[^\/\s?]+/gi;

function redactSensitiveData(message: string, botToken?: string): string {
  let redacted = message.replace(TELEGRAM_TOKEN_URL_REGEX, '/bot[REDACTED_TOKEN]');
  if (botToken && botToken.trim().length > 0) {
    redacted = redacted.replaceAll(botToken, '[REDACTED_TOKEN]');
  }
  return redacted;
}

/**
 * Adaptador de infraestructura para interactuar con la API oficial de Telegram Bot.
 * Implementa Fail-Closed en verificación de cabeceras y Fail-Safe con timeout en envíos y sondas.
 *
 * Timeouts diferenciados por contexto operativo:
 * - Sonda de salud (getMe/getWebhookInfo): 8000ms — tolera latencia DNS elevada en Docker/producción
 *   sin impactar la seguridad del webhook. Solo afecta al tiempo de carga del panel /Admin/System.
 * - Envío de mensajes (sendMessage): 10000ms — el webhook de Telegram espera hasta 60s, por lo que
 *   hay margen holgado. Protege contra caídas completas de la API sin truncar entregas legítimas.
 */
export class TelegramBotApiGateway implements TelegramBotGatewayPort {
  private readonly botToken: string | undefined;
  private readonly webhookSecret: string | undefined;
  /** Timeout para sondas de salud (getMe, getWebhookInfo) en ms */
  private readonly probeTimeoutMs: number;
  /** Timeout para operaciones de envío (sendMessage) en ms */
  private readonly sendTimeoutMs: number;
  private readonly enabled: boolean;

  constructor(
    botToken?: string,
    webhookSecret?: string,
    options?: { probeTimeoutMs?: number; sendTimeoutMs?: number; enabled?: boolean }
  ) {
    this.botToken = botToken || process.env.TELEGRAM_BOT_TOKEN;
    this.webhookSecret = webhookSecret || process.env.TELEGRAM_WEBHOOK_SECRET;
    this.probeTimeoutMs = options?.probeTimeoutMs ?? 8000;
    this.sendTimeoutMs = options?.sendTimeoutMs ?? 10000;

    if (options?.enabled !== undefined) {
      this.enabled = options.enabled;
    } else if (botToken) {
      // Inyección explícita de token (ej. pruebas unitarias con token mock)
      this.enabled = true;
    } else if (process.env.TELEGRAM_ENABLED !== undefined) {
      this.enabled = process.env.TELEGRAM_ENABLED === 'true';
    } else {
      const env = process.env.APP_ENV || process.env.NODE_ENV || 'development';
      this.enabled = env === 'production';
    }
  }

  private redact(message: string): string {
    return redactSensitiveData(message, this.botToken);
  }

  isGatewayEnabled(): boolean {
    return this.enabled;
  }

  verifySecretHeader(headerSecret: string | null): boolean {
    if (!this.webhookSecret || !headerSecret) {
      return false;
    }
    return constantTimeEqualSync(headerSecret.trim(), this.webhookSecret.trim());
  }

  async sendMessage(
    chatId: string,
    text: string,
    buttons?: TelegramButton[][]
  ): Promise<void> {
    if (!this.enabled) {
      return;
    }

    if (!this.botToken) {
      console.warn(
        `[TelegramBotApiGateway] Mensaje no enviado (TELEGRAM_BOT_TOKEN no configurado): chatId=${chatId}`
      );
      return;
    }

    const payload: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };

    if (buttons && buttons.length > 0) {
      payload.reply_markup = {
        inline_keyboard: buttons,
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.sendTimeoutMs);

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.warn(
          `[TelegramBotApiGateway] Error en respuesta de Telegram API (${response.status}): ${this.redact(errorText)}`
        );
      }
    } catch (error) {
      console.warn(
        `[TelegramBotApiGateway] Fallo de conexión o timeout hacia Telegram API:`,
        this.redact(error instanceof Error ? error.message : String(error))
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Sonda de Identidad: Consulta los datos del bot autenticado.
   * Retorna null si el token no está configurado, es inválido o la petición falla.
   */
  async getMe(): Promise<TelegramBotInfo | null> {
    if (!this.enabled) {
      return null;
    }

    if (!this.botToken) {
      console.warn('[TelegramBotApiGateway] getMe abortado: TELEGRAM_BOT_TOKEN no configurado');
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.probeTimeoutMs);

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`, {
        method: 'GET',
        signal: controller.signal,
      });

      if (!response.ok) {
        console.warn(`[TelegramBotApiGateway] getMe error status ${response.status}`);
        return null;
      }

      const json = await response.json();
      const parseResult = TelegramGetMeResponseSchema.safeParse(json);
      if (!parseResult.success) {
        console.warn('[TelegramBotApiGateway] getMe parse error:', parseResult.error.message);
        return null;
      }

      return {
        id: parseResult.data.result.id,
        username: parseResult.data.result.username ?? '',
        firstName: parseResult.data.result.first_name,
        canJoinGroups: parseResult.data.result.can_join_groups ?? false,
      };
    } catch (error) {
      console.warn(
        '[TelegramBotApiGateway] getMe fallo de conexión o timeout:',
        this.redact(error instanceof Error ? error.message : String(error))
      );
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Sonda de Enrutamiento: Consulta el estado del webhook configurado en Telegram.
   * Retorna null si no es posible consultar el webhook o la petición falla.
   */
  async getWebhookInfo(): Promise<TelegramWebhookInfo | null> {
    if (!this.enabled) {
      return null;
    }

    if (!this.botToken) {
      console.warn('[TelegramBotApiGateway] getWebhookInfo abortado: TELEGRAM_BOT_TOKEN no configurado');
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.probeTimeoutMs);

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getWebhookInfo`, {
        method: 'GET',
        signal: controller.signal,
      });

      if (!response.ok) {
        console.warn(`[TelegramBotApiGateway] getWebhookInfo error status ${response.status}`);
        return null;
      }

      const json = await response.json();
      const parseResult = TelegramGetWebhookInfoResponseSchema.safeParse(json);
      if (!parseResult.success) {
        console.warn('[TelegramBotApiGateway] getWebhookInfo parse error:', parseResult.error.message);
        return null;
      }

      return {
        url: parseResult.data.result.url,
        hasCustomCertificate: parseResult.data.result.has_custom_certificate,
        pendingUpdateCount: parseResult.data.result.pending_update_count,
        lastErrorDate: parseResult.data.result.last_error_date,
        lastErrorMessage: parseResult.data.result.last_error_message,
        maxConnections: parseResult.data.result.max_connections,
      };
    } catch (error) {
      console.warn(
        '[TelegramBotApiGateway] getWebhookInfo fallo de conexión o timeout:',
        this.redact(error instanceof Error ? error.message : String(error))
      );
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

