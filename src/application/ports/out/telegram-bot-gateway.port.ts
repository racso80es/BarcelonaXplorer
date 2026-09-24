export interface TelegramButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface TelegramBotInfo {
  readonly id: number;
  readonly username: string;
  readonly firstName: string;
  readonly canJoinGroups: boolean;
}

export interface TelegramWebhookInfo {
  readonly url: string;
  readonly hasCustomCertificate: boolean;
  readonly pendingUpdateCount: number;
  readonly lastErrorDate?: number;
  readonly lastErrorMessage?: string;
  readonly maxConnections?: number;
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

  /**
   * Sonda de Identidad: Consulta los datos del bot autenticado.
   * Retorna null si el token no está configurado, es inválido o la petición falla.
   */
  getMe(): Promise<TelegramBotInfo | null>;

  /**
   * Sonda de Enrutamiento: Consulta el estado del webhook configurado en Telegram.
   * Retorna null si no es posible consultar el webhook o la petición falla.
   */
  getWebhookInfo(): Promise<TelegramWebhookInfo | null>;
}

