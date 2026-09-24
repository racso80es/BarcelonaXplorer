import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/telegram/webhook/route';
import { NextRequest } from 'next/server';

describe('POST /api/telegram/webhook', () => {
  beforeEach(() => {
    process.env.TELEGRAM_WEBHOOK_SECRET = 'valid_test_secret_32_chars_12345';
  });

  it('rechaza con 401 si no se envía la cabecera secreta (Fail-Closed)', async () => {
    const req = new NextRequest('http://localhost/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ update_id: 1 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('rechaza con 401 si la cabecera secreta es incorrecta (Fail-Closed)', async () => {
    const req = new NextRequest('http://localhost/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-bot-api-secret-token': 'wrong_secret',
      },
      body: JSON.stringify({ update_id: 1 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('procesa update y responde 200 OK cuando la cabecera secreta es correcta', async () => {
    const req = new NextRequest('http://localhost/api/telegram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-bot-api-secret-token': 'valid_test_secret_32_chars_12345',
      },
      body: JSON.stringify({
        update_id: 9999,
        message: {
          message_id: 10,
          chat: { id: 12345678, type: 'private' },
          date: 1727160000,
          text: '/start',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});
