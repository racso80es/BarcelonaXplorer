import { describe, it, expect, vi, afterEach } from 'vitest';
import { GET } from '@/app/api/auth/magic-link/route';
import { NextRequest } from 'next/server';
import { RestoreSessionFromMagicLinkUseCase } from '@/features/auth';

describe('GET /api/auth/magic-link', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

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

  it('restaura sesión exitosamente e inyecta cookie con HttpOnly, SameSite=Lax y Secure bajo NODE_ENV=production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const sessionId = '550e8400-e29b-41d4-a716-446655440000';

    vi.spyOn(RestoreSessionFromMagicLinkUseCase.prototype, 'execute').mockResolvedValue({
      success: true,
      sessionId,
      telegramChatId: '123456789',
    });

    const req = new NextRequest(
      'http://localhost/api/auth/magic-link?token=valid.magic.token',
      { method: 'GET' }
    );

    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/orchestrator?session_restored=true');

    const cookie = res.cookies.get('bx_session_id');
    expect(cookie).toBeDefined();
    expect(cookie?.value).toBe(sessionId);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('lax');
    expect(cookie?.secure).toBe(true);

    const setCookieHeader = res.headers.get('set-cookie');
    expect(setCookieHeader).toContain('HttpOnly');
    expect(setCookieHeader).toMatch(/SameSite=lax/i);
    expect(setCookieHeader).toContain('Secure');
  });
});
