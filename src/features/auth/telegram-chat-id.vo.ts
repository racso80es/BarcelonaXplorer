import { InvalidTelegramChatIdException } from '@/domain/exceptions/invalid-telegram-chat-id.exception';

/**
 * Objeto de Valor inmutable para validar y encapsular identificadores de chat de Telegram.
 * Cumple con La Vía del Yunque: erradica tipos primitivos y blinda el dominio.
 */
export class TelegramChatId {
  private readonly value: string;

  constructor(chatId: string | number) {
    const sanitized = String(chatId).trim();
    if (!/^-?\d+$/.test(sanitized)) {
      throw new InvalidTelegramChatIdException(
        `El chat_id '${chatId}' no es un identificador numérico válido de Telegram.`
      );
    }
    this.value = sanitized;
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: TelegramChatId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
