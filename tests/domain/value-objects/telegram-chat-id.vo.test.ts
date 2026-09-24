import { describe, it, expect } from 'vitest';
import { TelegramChatId } from '@/domain/value-objects/telegram-chat-id.vo';
import { InvalidTelegramChatIdException } from '@/domain/exceptions/invalid-telegram-chat-id.exception';

describe('TelegramChatId Value Object', () => {
  it('instancia correctamente con identificadores numéricos positivos', () => {
    const chatId = new TelegramChatId('123456789');
    expect(chatId.getValue()).toBe('123456789');
    expect(chatId.toString()).toBe('123456789');
  });

  it('instancia correctamente con identificadores numéricos negativos (grupos/canales)', () => {
    const chatId = new TelegramChatId('-100123456789');
    expect(chatId.getValue()).toBe('-100123456789');
  });

  it('instancia correctamente a partir de número primitivo', () => {
    const chatId = new TelegramChatId(987654321);
    expect(chatId.getValue()).toBe('987654321');
  });

  it('compara igualdad por valor correctamente', () => {
    const a = new TelegramChatId('12345');
    const b = new TelegramChatId(12345);
    const c = new TelegramChatId('54321');

    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('lanza InvalidTelegramChatIdException ante identificadores alfanuméricos o inválidos', () => {
    expect(() => new TelegramChatId('invalid_chat_id')).toThrow(InvalidTelegramChatIdException);
    expect(() => new TelegramChatId('')).toThrow(InvalidTelegramChatIdException);
    expect(() => new TelegramChatId('1234abc')).toThrow(InvalidTelegramChatIdException);
    expect(() => new TelegramChatId('   ')).toThrow(InvalidTelegramChatIdException);
  });
});
