import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { validateGatewayAuth } from './shared/auth.js';
import { createErrorEnvelope, createSuccessEnvelope } from './shared/envelope.js';

export interface GatewayServerConfig {
  port: number;
  gatewaySecret: string;
  decisionHandler?: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
  llmHandler?: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
  healthHandler?: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
}

export function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

export async function parseJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
      if (body.length > 2 * 1024 * 1024) {
        // 2MB limit
        reject(new Error('Payload demasiado grande'));
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({} as T);
        return;
      }
      try {
        resolve(JSON.parse(body) as T);
      } catch {
        reject(new Error('Formato JSON inválido'));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

export function createGatewayServer(config: GatewayServerConfig): http.Server {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const pathname = url.pathname;
    const method = req.method ?? 'GET';

    // 1. Healthcheck no requiere autenticación
    if (method === 'GET' && (pathname === '/healthz' || pathname === '/health')) {
      if (config.healthHandler) {
        await config.healthHandler(req, res);
      } else {
        sendJson(res, 200, createSuccessEnvelope({ status: 'healthy', timestamp: new Date().toISOString() }));
      }
      return;
    }

    // 2. Middleware de autenticación interna por secreto compartido
    if (!validateGatewayAuth(req, config.gatewaySecret)) {
      sendJson(
        res,
        401,
        createErrorEnvelope(
          ['Acceso no autorizado: Secreto de IA Gateway inválido o ausente'],
          401,
          'Fallo de autenticación en aduana interna'
        )
      );
      return;
    }

    // 3. Enrutamiento de endpoints
    if (pathname === '/v1/decision/evaluate' && method === 'POST') {
      if (config.decisionHandler) {
        await config.decisionHandler(req, res);
      } else {
        sendJson(
          res,
          501,
          createErrorEnvelope(['Endpoint /v1/decision/evaluate no implementado aún'], 501)
        );
      }
      return;
    }

    if (pathname === '/v1/llm/generate' && method === 'POST') {
      if (config.llmHandler) {
        await config.llmHandler(req, res);
      } else {
        sendJson(
          res,
          501,
          createErrorEnvelope(['Endpoint /v1/llm/generate no implementado aún'], 501)
        );
      }
      return;
    }

    // 4. Ruta no encontrada
    sendJson(
      res,
      404,
      createErrorEnvelope([`Ruta no encontrada: ${method} ${pathname}`], 404)
    );
  });
}
