import type { IncomingMessage } from 'node:http';
import { describe, expect, it } from 'vitest';
import { AUTH_HEADER_NAME, timingSafeCompare, validateGatewayAuth } from './auth.js';

describe('IA Gateway Auth Middleware', () => {
  it('debe validar coincidencia exacta en tiempo constante', () => {
    expect(timingSafeCompare('super-secret-key-123', 'super-secret-key-123')).toBe(true);
    expect(timingSafeCompare('wrong-key', 'super-secret-key-123')).toBe(false);
    expect(timingSafeCompare('', 'super-secret-key-123')).toBe(false);
  });

  it('debe validar la cabecera x-ia-gateway-secret', () => {
    const validReq = {
      headers: {
        [AUTH_HEADER_NAME]: 'my-gateway-secret',
      },
    } as unknown as IncomingMessage;

    expect(validateGatewayAuth(validReq, 'my-gateway-secret')).toBe(true);
    expect(validateGatewayAuth(validReq, 'different-secret')).toBe(false);
  });

  it('debe rechazar peticiones sin la cabecera', () => {
    const reqWithoutHeader = {
      headers: {},
    } as unknown as IncomingMessage;

    expect(validateGatewayAuth(reqWithoutHeader, 'my-gateway-secret')).toBe(false);
  });

  it('debe rechazar si el secreto esperado no está configurado', () => {
    const validReq = {
      headers: {
        [AUTH_HEADER_NAME]: 'my-gateway-secret',
      },
    } as unknown as IncomingMessage;

    expect(validateGatewayAuth(validReq, undefined)).toBe(false);
    expect(validateGatewayAuth(validReq, '')).toBe(false);
  });
});
