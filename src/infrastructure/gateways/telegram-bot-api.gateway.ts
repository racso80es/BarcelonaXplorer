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

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Adaptador de infraestructura para interactuar con la API oficial de Telegram Bot.
 * Implementa Fail-Closed en verificación de cabeceras y Fail-Safe con timeout en envíos y sondas.
 */
export class TelegramBotApiGateway implements TelegramBotGatewayPort {
  private readonly botToken: string | undefined;
  private readonly webhookSecret: string | undefined;

  constructor(botToken?: string, webhookSecret?: string) {
    this.botToken = botToken || process.env.TELEGRAM_BOT_TOKEN;
    this.webhookSecret = webhookSecret || process.env.TELEGRAM_WEBHOOK_SECRET;
  }

  verifySecretHeader(headerSecret: string | null): boolean {
    if (!this.webhookSecret || !headerSecret) {
      return false;
    }
    return constantTimeEqual(headerSecret.trim(), this.webhookSecret.trim());
  }

  async sendMessage(
    chatId: string,
    text: string,
    buttons?: TelegramButton[][]
  ): Promise<void> {
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
    const timeoutId = setTimeout(() => controller.abort(), 3500);

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
          `[TelegramBotApiGateway] Error en respuesta de Telegram API (${response.status}): ${errorText}`
        );
      }
    } catch (error) {
      console.warn(
        `[TelegramBotApiGateway] Fallo de conexión o timeout hacia Telegram API:`,
        error instanceof Error ? error.message : error
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
    if (!this.botToken) {
      console.warn('[TelegramBotApiGateway] getMe abortado: TELEGRAM_BOT_TOKEN no configurado');
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

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
        error instanceof Error ? error.message : error
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
    if (!this.botToken) {
      console.warn('[TelegramBotApiGateway] getWebhookInfo abortado: TELEGRAM_BOT_TOKEN no configurado');
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

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
        error instanceof Error ? error.message : error
      );
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

