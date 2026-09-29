import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createGatewayServer } from '../../server.js';
import { AUTH_HEADER_NAME } from '../../shared/auth.js';
import type { OperationEnvelope } from '../../shared/envelope.js';
import { createDecisionHandler } from './decision.handler.js';
import { JevAdapter } from './jev.adapter.js';

describe('POST /v1/decision/evaluate (PBI-GW-002)', () => {
  let server: http.Server;
  let baseUrl: string;
  const testSecret = 'sec-key-decision-test';

  const mockFetch = vi.fn();

  beforeAll(async () => {
    const adapter = new JevAdapter(
      {
        baseUrl: 'https://mock.jev-ai.pro/api',
        apiKey: 'jev-test-key',
        model: 'jev-latest',
        timeoutMs: 1000,
      },
      mockFetch as unknown as typeof fetch
    );

    const decisionHandler = createDecisionHandler(adapter);

    server = createGatewayServer({
      port: 0,
      gatewaySecret: testSecret,
      decisionHandler,
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

  it('CA-1 y CA-2: debe evaluar correctamente una pregunta noul', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        model: 'jev-latest',
        answers: {
          eval_question: {
            type: 'noul',
            noul: 0.88,
          },
        },
        usage: {
          input_tokens: 150,
          output_tokens: 10,
        },
      }),
    });

    const res = await fetch(`${baseUrl}/v1/decision/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AUTH_HEADER_NAME]: testSecret,
      },
      body: JSON.stringify({
        primitive: 'noul',
        state: 'Contexto de usuario en Barcelona',
        instruction: '¿El usuario tiene intencionalidad gastronómica?',
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as OperationEnvelope<{
      primitive: string;
      probability: number;
      isAffirmative: boolean;
      metrics: {
        engineType: string;
        provider: string;
        totalTokens: number;
      };
    }>;

    expect(body.success).toBe(true);
    expect(body.result?.primitive).toBe('noul');
    expect(body.result?.probability).toBe(0.88);
    expect(body.result?.isAffirmative).toBe(true);
    expect(body.result?.metrics.engineType).toBe('TYPED_DECISION');
    expect(body.result?.metrics.provider).toBe('JEV');
    expect(body.result?.metrics.totalTokens).toBe(160);
  });

  it('CA-1 y CA-2: debe evaluar correctamente una pregunta choice', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        model: 'jev-latest',
        answers: {
          eval_question: {
            type: 'choice',
            choice: 'modernisme',
            confidence: 0.92,
            probabilities: {
              modernisme: 0.92,
              gastronomia: 0.08,
            },
          },
        },
        usage: {
          input_tokens: 200,
          output_tokens: 15,
        },
      }),
    });

    const res = await fetch(`${baseUrl}/v1/decision/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AUTH_HEADER_NAME]: testSecret,
      },
      body: JSON.stringify({
        primitive: 'choice',
        state: 'Visitante buscando arquitectura en Eixample',
        instruction: 'Clasifica la categoría principal',
        choices: ['modernisme', 'gastronomia'],
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as OperationEnvelope<{
      primitive: string;
      selectedChoice: string;
      confidence: number;
      probabilities: Record<string, number>;
      metrics: {
        promptTokens: number;
        completionTokens: number;
      };
    }>;

    expect(body.success).toBe(true);
    expect(body.result?.primitive).toBe('choice');
    expect(body.result?.selectedChoice).toBe('modernisme');
    expect(body.result?.confidence).toBe(0.92);
    expect(body.result?.probabilities['modernisme']).toBe(0.92);
    expect(body.result?.metrics.promptTokens).toBe(200);
    expect(body.result?.metrics.completionTokens).toBe(15);
  });

  it('CA-4: debe manejar error 402 de Jev AI (saldo insuficiente) sin emitir 500', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 402,
      json: async () => ({
        error: { message: 'Insufficient credits on Jev account' },
      }),
    });

    const res = await fetch(`${baseUrl}/v1/decision/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AUTH_HEADER_NAME]: testSecret,
      },
      body: JSON.stringify({
        primitive: 'noul',
        state: 'Contexto',
        instruction: '¿Confirmar?',
      }),
    });

    expect(res.status).toBe(402);
    const body = (await res.json()) as OperationEnvelope<never>;
    expect(body.success).toBe(false);
    expect(body.exitCode).toBe(402);
    expect(body.errors?.[0]).toContain('Insufficient credits');
  });

  it('CA-5: debe rechazar con 400 cuando el cuerpo no cumple con el esquema', async () => {
    const res = await fetch(`${baseUrl}/v1/decision/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AUTH_HEADER_NAME]: testSecret,
      },
      body: JSON.stringify({
        primitive: 'choice',
        state: 'Contexto',
        instruction: '¿Cuál opción?',
        choices: ['única_opción_inválida'],
      }),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as OperationEnvelope<never>;
    expect(body.success).toBe(false);
    expect(body.exitCode).toBe(400);
    expect(body.errors?.some((e) => e.includes('choices'))).toBe(true);
  });
});
