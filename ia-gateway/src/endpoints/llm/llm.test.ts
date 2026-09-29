import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { HealthSensor } from '../../health/health-sensor.js';
import type { LlmGenerateOutput } from '../../schemas/llm.schema.js';
import { createGatewayServer } from '../../server.js';
import { AUTH_HEADER_NAME } from '../../shared/auth.js';
import type { OperationEnvelope } from '../../shared/envelope.js';
import { GeminiAdapter } from './gemini.adapter.js';
import { GroqAdapter } from './groq.adapter.js';
import { createLlmHandler } from './llm.handler.js';

describe('POST /v1/llm/generate (PBI-GW-003)', () => {
  let server: http.Server;
  let baseUrl: string;
  const testSecret = 'sec-key-llm-test';

  const mockGeminiGenerate = vi.fn();
  const mockGroqGenerate = vi.fn();

  beforeAll(async () => {
    const geminiAdapter = new GeminiAdapter({ apiKey: 'fake-gemini-key' });
    geminiAdapter.generate = mockGeminiGenerate;

    const groqAdapter = new GroqAdapter({ apiKey: 'fake-groq-key' });
    groqAdapter.generate = mockGroqGenerate;

    const healthSensor = new HealthSensor();
    const llmHandler = createLlmHandler(geminiAdapter, groqAdapter, healthSensor);

    server = createGatewayServer({
      port: 0,
      gatewaySecret: testSecret,
      llmHandler,
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

  it('CA-2 y CA-5: debe generar texto libre con Gemini en REASONING_LLM', async () => {
    mockGeminiGenerate.mockResolvedValueOnce({
      text: 'Explicación arquitectónica de la Sagrada Família.',
      modelId: 'gemini-2.5-flash',
      promptTokens: 80,
      completionTokens: 25,
      totalTokens: 105,
      durationMs: 320,
    });

    const res = await fetch(`${baseUrl}/v1/llm/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AUTH_HEADER_NAME]: testSecret,
      },
      body: JSON.stringify({
        prompt: 'Explica la Sagrada Família',
        engineType: 'REASONING_LLM',
        responseFormat: 'text',
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as OperationEnvelope<LlmGenerateOutput>;
    expect(body.success).toBe(true);
    expect(body.result?.text).toContain('Sagrada Família');
    expect(body.result?.metrics.provider).toBe('GOOGLE');
    expect(body.result?.metrics.engineType).toBe('REASONING_LLM');
    expect(body.result?.metrics.promptTokens).toBe(80);
    expect(body.result?.metrics.completionTokens).toBe(25);
    expect(body.result?.metrics.totalTokens).toBe(105);
    expect(body.result?.metrics.attemptedProviders).toEqual(['GOOGLE']);
  });

  it('CA-3: debe generar JSON estructurado con Groq en FAST_LLM', async () => {
    mockGroqGenerate.mockResolvedValueOnce({
      text: JSON.stringify({
        category: 'transit',
        observation: 'Línea L3 con demoras de 5 minutos en Passeig de Gràcia.',
        severityLevel: 1,
      }),
      modelId: 'llama-3.3-70b-versatile',
      promptTokens: 50,
      completionTokens: 20,
      totalTokens: 70,
      durationMs: 140,
    });

    const res = await fetch(`${baseUrl}/v1/llm/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AUTH_HEADER_NAME]: testSecret,
      },
      body: JSON.stringify({
        prompt: 'Dame insight de metro L3',
        engineType: 'FAST_LLM',
        responseFormat: 'json',
        schemaId: 'fast-insight',
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as OperationEnvelope<LlmGenerateOutput>;
    expect(body.success).toBe(true);
    expect(body.result?.json).toBeDefined();
    expect(body.result?.json?.category).toBe('transit');
    expect(body.result?.metrics.provider).toBe('GROQ');
    expect(body.result?.metrics.attemptedProviders).toEqual(['GROQ']);
  });

  it('CA-4: cascada a segundo proveedor cuando el primero falla la validación estructural Zod', async () => {
    // 1. Groq devuelve JSON que NO cumple el esquema fast-insight (falta observation)
    mockGroqGenerate.mockResolvedValueOnce({
      text: JSON.stringify({ category: 'transit' }), // Inválido según FastInsightSchema
      modelId: 'llama-3.3-70b-versatile',
      promptTokens: 40,
      completionTokens: 5,
      totalTokens: 45,
      durationMs: 120,
    });

    // 2. Gemini devuelve JSON válido que cumple el esquema
    mockGeminiGenerate.mockResolvedValueOnce({
      text: JSON.stringify({
        category: 'transit',
        observation: 'Servicio fluido en L1.',
      }),
      modelId: 'gemini-2.5-flash',
      promptTokens: 60,
      completionTokens: 15,
      totalTokens: 75,
      durationMs: 310,
    });

    const res = await fetch(`${baseUrl}/v1/llm/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AUTH_HEADER_NAME]: testSecret,
      },
      body: JSON.stringify({
        prompt: 'Estado de transporte',
        engineType: 'FAST_LLM',
        responseFormat: 'json',
        schemaId: 'fast-insight',
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as OperationEnvelope<LlmGenerateOutput>;
    expect(body.success).toBe(true);
    expect(body.result?.json?.observation).toBe('Servicio fluido en L1.');
    expect(body.result?.metrics.provider).toBe('GOOGLE'); // Recuperado por el segundo proveedor
    expect(body.result?.metrics.attemptedProviders).toEqual(['GROQ', 'GOOGLE']);
  });

  it('CA-6: devuelve error determinista 502 si todos los proveedores fallan', async () => {
    mockGroqGenerate.mockRejectedValueOnce(new Error('Groq upstream error 503'));
    mockGeminiGenerate.mockRejectedValueOnce(new Error('Gemini upstream error 503'));

    const res = await fetch(`${baseUrl}/v1/llm/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [AUTH_HEADER_NAME]: testSecret,
      },
      body: JSON.stringify({
        prompt: 'Ruta táctica',
        engineType: 'FAST_LLM',
        responseFormat: 'text',
      }),
    });

    expect(res.status).toBe(503);
    const body = (await res.json()) as OperationEnvelope<never>;
    expect(body.success).toBe(false);
    expect(body.exitCode).toBe(503);
    expect(body.errors?.some((e) => e.includes('Groq upstream error'))).toBe(true);
  });

  it('PBI-GW-010 CA-2, CA-4: el primer modelo de Gemini responde 503 y el segundo responde 200 sin llegar a Groq', async () => {
    const localGeminiAdapter = new GeminiAdapter({ apiKey: 'fake-gemini-key' });
    const localGeminiMock = vi.fn();
    localGeminiAdapter.generate = localGeminiMock;

    const localGroqAdapter = new GroqAdapter({ apiKey: 'fake-groq-key' });
    const localGroqMock = vi.fn();
    localGroqAdapter.generate = localGroqMock;

    const healthSensor = new HealthSensor();
    const providerModels = {
      geminiModels: ['gemini-primary-fail', 'gemini-secondary-success'],
      groqModels: ['llama-3.3-70b-versatile'],
    };

    const handler = createLlmHandler(
      localGeminiAdapter,
      localGroqAdapter,
      healthSensor,
      undefined,
      providerModels
    );

    const srv = createGatewayServer({
      port: 0,
      gatewaySecret: testSecret,
      llmHandler: handler,
    });

    let srvUrl = '';
    await new Promise<void>((resolve) => {
      srv.listen(0, '127.0.0.1', () => {
        const addr = srv.address() as AddressInfo;
        srvUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    try {
      localGeminiMock.mockRejectedValueOnce(new Error('503 Service Unavailable'));
      localGeminiMock.mockResolvedValueOnce({
        text: 'Respuesta recuperada por segundo modelo de Gemini',
        modelId: 'gemini-secondary-success',
        promptTokens: 45,
        completionTokens: 15,
        totalTokens: 60,
        durationMs: 160,
      });

      const res = await fetch(`${srvUrl}/v1/llm/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AUTH_HEADER_NAME]: testSecret,
        },
        body: JSON.stringify({
          prompt: 'Consulta de prueba intra-proveedor',
          engineType: 'REASONING_LLM',
          responseFormat: 'text',
        }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as OperationEnvelope<LlmGenerateOutput>;
      expect(body.success).toBe(true);
      expect(body.result?.metrics.provider).toBe('GOOGLE');
      expect(body.result?.metrics.modelId).toBe('gemini-secondary-success');
      expect(body.result?.metrics.attemptedProviders).toEqual(['GOOGLE']);
      expect(body.result?.metrics.attemptedModels).toEqual([
        'GOOGLE:gemini-primary-fail',
        'GOOGLE:gemini-secondary-success',
      ]);
      expect(localGroqMock).not.toHaveBeenCalled();
    } finally {
      await new Promise<void>((resolve) => srv.close(() => resolve()));
    }
  });

  it('PBI-GW-010 CA-2, CA-4: todos los modelos de un proveedor fallan y se conmuta al siguiente proveedor', async () => {
    const localGeminiAdapter = new GeminiAdapter({ apiKey: 'fake-gemini-key' });
    const localGeminiMock = vi.fn();
    localGeminiAdapter.generate = localGeminiMock;

    const localGroqAdapter = new GroqAdapter({ apiKey: 'fake-groq-key' });
    const localGroqMock = vi.fn();
    localGroqAdapter.generate = localGroqMock;

    const healthSensor = new HealthSensor();
    const providerModels = {
      geminiModels: ['gemini-fail-1', 'gemini-fail-2'],
      groqModels: ['groq-success'],
    };

    const handler = createLlmHandler(
      localGeminiAdapter,
      localGroqAdapter,
      healthSensor,
      undefined,
      providerModels
    );

    const srv = createGatewayServer({
      port: 0,
      gatewaySecret: testSecret,
      llmHandler: handler,
    });

    let srvUrl = '';
    await new Promise<void>((resolve) => {
      srv.listen(0, '127.0.0.1', () => {
        const addr = srv.address() as AddressInfo;
        srvUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    try {
      localGeminiMock.mockRejectedValueOnce(new Error('Gemini fail 1'));
      localGeminiMock.mockRejectedValueOnce(new Error('Gemini fail 2'));
      localGroqMock.mockResolvedValueOnce({
        text: 'Respuesta recuperada por Groq tras agotar modelos Gemini',
        modelId: 'groq-success',
        promptTokens: 30,
        completionTokens: 10,
        totalTokens: 40,
        durationMs: 80,
      });

      const res = await fetch(`${srvUrl}/v1/llm/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AUTH_HEADER_NAME]: testSecret,
        },
        body: JSON.stringify({
          prompt: 'Consulta fallback multi-proveedor',
          engineType: 'REASONING_LLM',
          responseFormat: 'text',
        }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as OperationEnvelope<LlmGenerateOutput>;
      expect(body.success).toBe(true);
      expect(body.result?.metrics.provider).toBe('GROQ');
      expect(body.result?.metrics.modelId).toBe('groq-success');
      expect(body.result?.metrics.attemptedProviders).toEqual(['GOOGLE', 'GROQ']);
      expect(body.result?.metrics.attemptedModels).toEqual([
        'GOOGLE:gemini-fail-1',
        'GOOGLE:gemini-fail-2',
        'GROQ:groq-success',
      ]);
    } finally {
      await new Promise<void>((resolve) => srv.close(() => resolve()));
    }
  });
});
