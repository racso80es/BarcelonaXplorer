import { describe, it, expect } from 'vitest';
import { TelegramUpdateSchema } from '@/domain/schemas/telegram-webhook.schema';

describe('TelegramWebhook Zod Schema', () => {
  it('valida exitosamente un update con comando /start', () => {
    const payload = {
      update_id: 10001,
      message: {
        message_id: 42,
        from: {
          id: 12345678,
          is_bot: false,
          first_name: 'Carlos',
          username: 'carlos_bcn',
        },
        chat: {
          id: 12345678,
          type: 'private',
          username: 'carlos_bcn',
        },
        date: 1727160000,
        text: '/start abcdef123456',
      },
    };

    const result = TelegramUpdateSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.update_id).toBe(10001);
      expect(result.data.message?.text).toBe('/start abcdef123456');
    }
  });

  it('valida exitosamente un callback_query de botón inline', () => {
    const payload = {
      update_id: 10002,
      callback_query: {
        id: 'cb_query_99',
        from: {
          id: 12345678,
          is_bot: false,
          first_name: 'Carlos',
        },
        data: 'cross_device_login',
      },
    };

    const result = TelegramUpdateSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.callback_query?.data).toBe('cross_device_login');
    }
  });

  it('rechaza payloads inválidos sin update_id', () => {
    const payload = {
      message: {
        text: 'hola',
      },
    };

    const result = TelegramUpdateSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
