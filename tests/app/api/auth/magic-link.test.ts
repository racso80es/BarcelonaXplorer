import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/auth/magic-link/route';
import { NextRequest } from 'next/server';

describe('GET /api/auth/magic-link', () => {
  it('redirige con error si el parámetro token está ausente', async () => {
    const req = new NextRequest('http://localhost/api/auth/magic-link', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('auth_error=missing_token');
  });

  it('redirige con error si el token es inválido o expirado', async () => {
    const req = new NextRequest(
      'http://localhost/api/auth/magic-link?token=invalid.token.123',
      {
        method: 'GET',
      }
    );

    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain(
      'auth_error=invalid_or_expired_token'
    );
  });
});
