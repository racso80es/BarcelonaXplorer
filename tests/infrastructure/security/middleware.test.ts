import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware, config } from '@/middleware';

describe('Admin Security Middleware (middleware.ts)', () => {
  const ORIGINAL_ENV = { ...process.env };
  const TEST_USER = 'admin';
  const TEST_PASS = 'admin123';
  // SHA-256 hex de 'admin123'
  const TEST_PASS_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      ADMIN_USER: TEST_USER,
      ADMIN_PASSWORD_HASH: TEST_PASS_HASH,
      NODE_ENV: 'test',
    };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  function createBasicAuthHeader(user: string, pass: string): string {
    const utf8Bytes = new TextEncoder().encode(`${user}:${pass}`);
    const binary = Array.from(utf8Bytes, (b) => String.fromCharCode(b)).join('');
    return `Basic ${btoa(binary)}`;
  }

  it('debe tener configurado el matcher para variantes mayúsculas y minúsculas (/Admin y /admin)', () => {
    expect(config.matcher).toEqual(['/Admin', '/Admin/:path*', '/admin', '/admin/:path*']);
  });

  it('debe retornar 401 con WWW-Authenticate si no se envía la cabecera Authorization', async () => {
    const request = new NextRequest('http://localhost:3000/Admin');
    const response = await middleware(request);

    expect(response.status).toBe(401);
    expect(response.headers.get('WWW-Authenticate')).toContain('Basic');
    expect(response.headers.get('WWW-Authenticate')).toContain('BarcelonaXplorer Admin');
    expect(response.headers.get('Strict-Transport-Security')).toBeDefined();
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('debe retornar 401 si el esquema no es Basic', async () => {
    const request = new NextRequest('http://localhost:3000/Admin', {
      headers: {
        authorization: 'Bearer token_invalido',
      },
    });
    const response = await middleware(request);

    expect(response.status).toBe(401);
  });

  it('debe retornar 401 si la cadena base64 es inválida o no contiene separador de credenciales', async () => {
    const request = new NextRequest('http://localhost:3000/Admin', {
      headers: {
        authorization: `Basic ${btoa('solousuario_sin_dos_puntos')}`,
      },
    });
    const response = await middleware(request);

    expect(response.status).toBe(401);
  });

  it('debe retornar 401 si el usuario es incorrecto aunque la contraseña sea correcta', async () => {
    const request = new NextRequest('http://localhost:3000/Admin', {
      headers: {
        authorization: createBasicAuthHeader('usuario_intruso', TEST_PASS),
      },
    });
    const response = await middleware(request);

    expect(response.status).toBe(401);
  });

  it('debe retornar 401 si la contraseña es incorrecta aunque el usuario coincida', async () => {
    const request = new NextRequest('http://localhost:3000/Admin', {
      headers: {
        authorization: createBasicAuthHeader(TEST_USER, 'contraseña_falsa'),
      },
    });
    const response = await middleware(request);

    expect(response.status).toBe(401);
  });

  it('debe retornar 200 (NextResponse.next()) si el usuario y la contraseña son válidos para /Admin', async () => {
    const request = new NextRequest('http://localhost:3000/Admin/System', {
      headers: {
        authorization: createBasicAuthHeader(TEST_USER, TEST_PASS),
      },
    });
    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Strict-Transport-Security')).toBeDefined();
  });

  it('debe emitir redirección canónica 308 hacia /Admin cuando se accede a /admin en minúscula (RFC 7617)', async () => {
    const request = new NextRequest('http://localhost:3000/admin/System');
    const response = await middleware(request);

    expect(response.status).toBe(308);
    expect(response.headers.get('Location')).toBe('http://localhost:3000/Admin/System');
    expect(response.headers.get('Strict-Transport-Security')).toBeDefined();
  });

  it('debe redirigir canónicamente con 308 la ruta base /admin hacia /Admin', async () => {
    const request = new NextRequest('http://localhost:3000/admin');
    const response = await middleware(request);

    expect(response.status).toBe(308);
    expect(response.headers.get('Location')).toBe('http://localhost:3000/Admin');
  });

  it('debe soportar caracteres especiales UTF-8 en usuario y contraseña', async () => {
    const specialUser = 'admin_cataluña';
    const specialPass = 'cl@ve_ñandú_123';
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(specialPass));
    const specialHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    process.env.ADMIN_USER = specialUser;
    process.env.ADMIN_PASSWORD_HASH = specialHash;

    const request = new NextRequest('http://localhost:3000/Admin/System', {
      headers: {
        authorization: createBasicAuthHeader(specialUser, specialPass),
      },
    });
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });

  it('debe denegar acceso (401 fail-closed) si falta ADMIN_USER o ADMIN_PASSWORD_HASH en el entorno', async () => {
    delete process.env.ADMIN_USER;

    const request = new NextRequest('http://localhost:3000/Admin', {
      headers: {
        authorization: createBasicAuthHeader(TEST_USER, TEST_PASS),
      },
    });
    const response = await middleware(request);

    expect(response.status).toBe(401);
  });

  describe('Cifrado en Tránsito (Blindaje en Producción)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('debe forzar redirección 308 a HTTPS en producción si la petición llega por HTTP sin credenciales', async () => {
      const request = new NextRequest('http://barcelonaxplorer.pro/Admin', {
        headers: {
          host: 'barcelonaxplorer.pro',
          'x-forwarded-proto': 'http',
        },
      });
      const response = await middleware(request);

      expect(response.status).toBe(308);
      expect(response.headers.get('Location')).toContain('https://barcelonaxplorer.pro/Admin');
    });

    it('debe rechazar con 403 si se transmiten credenciales por HTTP en producción', async () => {
      const request = new NextRequest('http://barcelonaxplorer.pro/Admin', {
        headers: {
          host: 'barcelonaxplorer.pro',
          'x-forwarded-proto': 'http',
          authorization: createBasicAuthHeader(TEST_USER, TEST_PASS),
        },
      });
      const response = await middleware(request);

      expect(response.status).toBe(403);
    });

    it('debe aceptar credenciales cuando x-forwarded-proto es https (Cloudflare Tunnels)', async () => {
      const request = new NextRequest('https://barcelonaxplorer.pro/Admin', {
        headers: {
          host: 'barcelonaxplorer.pro',
          'x-forwarded-proto': 'https',
          authorization: createBasicAuthHeader(TEST_USER, TEST_PASS),
        },
      });
      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Strict-Transport-Security')).toBe(
        'max-age=63072000; includeSubDomains; preload'
      );
    });

    it('debe aceptar credenciales cuando cf-visitor indica https (Cloudflare)', async () => {
      const request = new NextRequest('https://barcelonaxplorer.pro/Admin', {
        headers: {
          host: 'barcelonaxplorer.pro',
          'cf-visitor': '{"scheme":"https"}',
          authorization: createBasicAuthHeader(TEST_USER, TEST_PASS),
        },
      });
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });
  });
});
