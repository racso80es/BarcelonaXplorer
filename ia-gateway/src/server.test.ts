import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createGatewayServer } from './server.js';
import { AUTH_HEADER_NAME } from './shared/auth.js';
import { createSuccessEnvelope } from './shared/envelope.js';

describe('Gateway HTTP Server', () => {
  let server: http.Server;
  let baseUrl: string;
  const testSecret = 'test-secret-12345';

  beforeAll(async () => {
    server = createGatewayServer({
      port: 0,
      gatewaySecret: testSecret,
      decisionHandler: async (_req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(createSuccessEnvelope({ handled: 'decision' })));
      },
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('GET /healthz debe responder 200 sin autenticación', async () => {
    const res = await fetch(`${baseUrl}/healthz`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; result: { status: string } };
    expect(body.success).toBe(true);
    expect(body.result.status).toBe('healthy');
  });

  it('debe rechazar con 401 peticiones sin secreto válido', async () => {
    const res = await fetch(`${baseUrl}/v1/decision/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ state: 's', instruction: 'i' }),
    });

    expect(res.status).toBe(401);
    const body = (await res.json()) as { success: boolean; exitCode: number; errors: string[] };
    expect(body.success).toBe(false);
    expect(body.exitCode).toBe(401);
    expect(body.errors[0]).toContain('Acceso no autorizado');
  });

  it('debe admitir petición con secreto válido y ejecutar handler', async () => {
    const res = await fetch(`${baseUrl}/v1/decision/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AUTH_HEADER_NAME]: testSecret,
      },
      body: JSON.stringify({ state: 's', instruction: 'i' }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; result: { handled: string } };
    expect(body.success).toBe(true);
    expect(body.result.handled).toBe('decision');
  });

  it('debe responder 404 en rutas no registradas', async () => {
    const res = await fetch(`${baseUrl}/v1/unknown-route`, {
      method: 'GET',
      headers: {
        [AUTH_HEADER_NAME]: testSecret,
      },
    });

    expect(res.status).toBe(404);
    const body = (await res.json()) as { success: boolean; exitCode: number };
    expect(body.success).toBe(false);
    expect(body.exitCode).toBe(404);
  });
});
