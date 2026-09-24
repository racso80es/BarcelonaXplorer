export interface TelegramButton {
  text: string;
  url?: string;
  callback_data?: string;
}

/**
 * Puerto de Salida para la comunicación con la Telegram Bot API y verificación de secretos.
 */
export interface TelegramBotGatewayPort {
  sendMessage(
    chatId: string,
    text: string,
    buttons?: TelegramButton[][]
  ): Promise<void>;

  verifySecretHeader(headerSecret: string | null): boolean;
}
