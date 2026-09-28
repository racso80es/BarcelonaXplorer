import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/telegram/anchor-link/route';
import { NextRequest } from 'next/server';

describe('GET /api/telegram/anchor-link', () => {
  it('retorna 400 si la cookie bx_session_id está ausente', async () => {
    const req = new NextRequest('http://localhost/api/telegram/anchor-link', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('No active session found');
  });

  it('retorna el deepLink de Telegram con token AES-256-GCM de 59 caracteres cuando la cookie es un UUID válido', async () => {
    const req = new NextRequest('http://localhost/api/telegram/anchor-link', {
      method: 'GET',
      headers: {
        cookie: 'bx_session_id=550e8400-e29b-41d4-a716-446655440000',
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deepLink).toContain('https://t.me/');
    expect(json.deepLink).toContain('?start=');
    expect(json.token.length).toBe(59);
  });

  it('rechaza defensivamente con HTTP 400 Bad Request si la cookie tiene formato no-UUID (DomainException)', async () => {
    const req = new NextRequest('http://localhost/api/telegram/anchor-link', {
      method: 'GET',
      headers: {
        cookie: 'bx_session_id=payload-no-uuid-corrupto',
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Formato de UUID inválido');
  });
});
