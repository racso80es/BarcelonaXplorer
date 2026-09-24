import { NextRequest, NextResponse } from 'next/server';

/**
 * Comparación en tiempo constante para mitigar ataques de canal lateral (timing attacks).
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Calcula el hash SHA-256 en formato hexadecimal usando estrictamente Web Crypto API
 * compatible con Edge Runtime.
 */
async function computeSha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((byte: number): string => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Decodifica y parsea la cabecera 'Authorization: Basic <base64>'.
 * Utiliza atob y TextDecoder para decodificación conforme a UTF-8.
 */
function parseBasicAuth(
  headerValue: string
): { username: string; password: string } | null {
  const [scheme, credentials] = headerValue.split(' ');
  if (!scheme || !credentials || scheme.toLowerCase() !== 'basic') {
    return null;
  }

  try {
    const binary = atob(credentials.trim());
    const bytes = Uint8Array.from(binary, (char: string): number => char.charCodeAt(0));
    const decoded = new TextDecoder('utf-8').decode(bytes);

    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) {
      return null;
    }

    const username = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);

    return { username, password };
  } catch {
    return null;
  }
}

/**
 * Aplica cabeceras de blindaje criptográfico y seguridad perimetral (HSTS, etc.).
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

/**
 * Despacha telemetría perimetral al Route Handler /api/telemetry/log desde el Edge Runtime.
 * No bloquea la respuesta al atacante/cliente ni depende del runtime de Node.js o Prisma.
 */
function dispatchPerimeterTelemetry(
  request: NextRequest,
  statusCode: number,
  reason: string
): void {
  try {
    const telemetryUrl = new URL('/api/telemetry/log', request.url);
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('cf-connecting-ip') ||
      'unknown';

    const currentEnv =
      process.env.APP_ENV ||
      (process.env.NODE_ENV === 'production' ? 'production' : 'development');

    void fetch(telemetryUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: statusCode >= 500 ? 'ERROR' : 'WARN',
        context: 'SECURITY_PERIMETER',
        message: `[Centinela] ${reason}`,
        statusCode,
        environment: currentEnv,
        payload: {
          path: request.nextUrl.pathname,
          method: request.method,
          ip,
          userAgent: request.headers.get('user-agent'),
        },
      }),
    }).catch(() => {});
  } catch {
    // Aislamiento perimetral silencioso
  }
}

/**
 * Genera una respuesta HTTP 401 con la cabecera WWW-Authenticate para activar
 * el cuadro de diálogo nativo de Basic Auth en el cliente/navegador.
 */
function unauthorizedResponse(): NextResponse {
  const response = new NextResponse('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="BarcelonaXplorer Admin", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
  return applySecurityHeaders(response);
}

/**
 * Evalúa si la conexión entrante está cifrada (HTTPS) o proviene de localhost/test.
 * Detecta cabeceras de proxy inverso (Cloudflare Tunnels, Nginx).
 */
function isSecureConnection(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  const host = request.headers.get('host') ?? '';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return true;
  }

  const proto =
    request.headers.get('x-forwarded-proto') ||
    (request.headers.get('cf-visitor')?.includes('"scheme":"https"') ? 'https' : null) ||
    request.nextUrl.protocol.replace(':', '');

  return proto === 'https';
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const authHeader = request.headers.get('authorization');

  // 1. Detección de Protocolo Seguro y Variante Canónica de Ruta
  const isSecure = isSecureConnection(request);
  const isLowerCaseAdmin = pathname === '/admin' || pathname.startsWith('/admin/');

  // 2. Cifrado en Tránsito: si ya transmitieron credenciales por HTTP inseguro, rechazar inmediatamente (403)
  if (!isSecure && authHeader) {
    dispatchPerimeterTelemetry(
      request,
      403,
      'Transmisión de credenciales insegura por HTTP en producción'
    );
    const insecureResponse = new NextResponse(
      'Insecure transmission forbidden: HTTP Basic Auth requires an encrypted HTTPS connection.',
      {
        status: 403,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }
    );
    return applySecurityHeaders(insecureResponse);
  }

  // 3. Redirección Canónica 308 Unificada:
  // - Fuerza HTTPS antes de emitir reto de Basic Auth.
  // - Normaliza variantes minúsculas /admin a la ruta canónica /Admin.
  // Beneficio RFC 7617: Unifica el prefijo de ruta en el navegador, asegurando el almacenamiento
  // de credenciales sin discrepancias de path y permitiendo que Linux Mint / Docker resuelva app/Admin.
  if (!isSecure || isLowerCaseAdmin) {
    const targetUrl = request.nextUrl.clone();
    if (!isSecure) {
      targetUrl.protocol = 'https:';
    }
    if (isLowerCaseAdmin) {
      targetUrl.pathname = `/Admin${pathname.slice(6)}`;
    }
    return applySecurityHeaders(NextResponse.redirect(targetUrl, { status: 308 }));
  }

  // 4. Extracción de credenciales y principio Fail-Closed
  const expectedUser = process.env.ADMIN_USER;
  const expectedPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!expectedUser || !expectedPasswordHash) {
    console.error(
      '[Security Alert] ADMIN_USER o ADMIN_PASSWORD_HASH no configuradas en el entorno.'
    );
    dispatchPerimeterTelemetry(
      request,
      401,
      'Fail-Closed: ADMIN_USER o ADMIN_PASSWORD_HASH no configuradas'
    );
    return unauthorizedResponse();
  }

  // 5. Verificación de Cabecera Authorization
  if (!authHeader) {
    return unauthorizedResponse();
  }

  const credentials = parseBasicAuth(authHeader);
  if (!credentials) {
    dispatchPerimeterTelemetry(
      request,
      401,
      'Cabecera Basic Auth malformada o inválida'
    );
    return unauthorizedResponse();
  }

  const inputPasswordHash = await computeSha256Hex(credentials.password);

  const isUserValid = constantTimeEqual(credentials.username, expectedUser);
  const isPasswordValid = constantTimeEqual(
    inputPasswordHash.toLowerCase(),
    expectedPasswordHash.toLowerCase()
  );

  if (!isUserValid || !isPasswordValid) {
    dispatchPerimeterTelemetry(
      request,
      401,
      'Credenciales inválidas de acceso al nodo /Admin'
    );
    return unauthorizedResponse();
  }

  return applySecurityHeaders(NextResponse.next());
}

/**
 * Matcher configurado para interceptar tanto variantes en mayúscula como en minúscula.
 */
export const config = {
  matcher: ['/Admin', '/Admin/:path*', '/admin', '/admin/:path*'],
};
