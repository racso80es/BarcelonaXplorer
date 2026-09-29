import crypto from 'node:crypto';
import type { IncomingMessage } from 'node:http';

export const AUTH_HEADER_NAME = 'x-ia-gateway-secret';

/**
 * Compara dos secretos en tiempo constante mediante SHA-256 para evitar ataques de canal lateral (timing attacks).
 */
export function timingSafeCompare(provided: string, expected: string): boolean {
  if (!provided || !expected) {
    return false;
  }
  const hashProvided = crypto.createHash('sha256').update(provided, 'utf8').digest();
  const hashExpected = crypto.createHash('sha256').update(expected, 'utf8').digest();
  return crypto.timingSafeEqual(hashProvided, hashExpected);
}

/**
 * Valida la cabecera de autenticación del IA Gateway.
 */
export function validateGatewayAuth(
  req: IncomingMessage,
  expectedSecret: string | undefined
): boolean {
  if (!expectedSecret) {
    return false;
  }

  const rawHeader = req.headers[AUTH_HEADER_NAME];
  const providedSecret = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

  if (typeof providedSecret !== 'string') {
    return false;
  }

  return timingSafeCompare(providedSecret, expectedSecret);
}
