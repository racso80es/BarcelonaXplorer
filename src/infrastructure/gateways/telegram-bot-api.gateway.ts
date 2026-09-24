import {
  TelegramBotGatewayPort,
  TelegramButton,
} from '@/application/ports/out/telegram-bot-gateway.port';

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
 * Implementa Fail-Closed en verificación de cabeceras y Fail-Safe con timeout en envíos.
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
}
