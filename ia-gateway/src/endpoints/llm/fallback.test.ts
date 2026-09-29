import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { HealthSensor } from '../../health/health-sensor.js';
import type { LlmGenerateOutput } from '../../schemas/llm.schema.js';
import { createGatewayServer } from '../../server.js';
import { AUTH_HEADER_NAME } from '../../shared/auth.js';
import type { OperationEnvelope } from '../../shared/envelope.js';
import { parseAnchorString, resolveFallbackConfig } from './fallback.config.js';
import { GeminiAdapter } from './gemini.adapter.js';
import { GroqAdapter } from './groq.adapter.js';
import { createLlmHandler } from './llm.handler.js';

describe('Fallback and Base Anchor Hierarchy (PBI-GW-005)', () => {
  describe('Fallback Config Validation (CA-1, CA-2)', () => {
    it('debe parsear correctamente formato <proveedor>:<modelo>', () => {
      const parsed = parseAnchorString('google:gemini-2.5-flash');
      expect(parsed.provider).toBe('GOOGLE');
      expect(parsed.modelId).toBe('gemini-2.5-flash');

      const parsedGroq = parseAnchorString('groq:llama-3.3-70b-versatile');
      expect(parsedGroq.provider).toBe('GROQ');
      expect(parsedGroq.modelId).toBe('llama-3.3-70b-versatile');
    });

    it('debe rechazar formato inválido mediante Zod', () => {
      expect(() => parseAnchorString('invalid-string')).toThrow();
      expect(() => parseAnchorString('openai:gpt-4')).toThrow(); // Solo google o groq
    });

    it('debe emitir advertencia si el anclaje comparte proveedor con el principal', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      resolveFallbackConfig({
        DEFAULT_FAST_LLM: 'groq:llama-3.3-70b-versatile', // Comparte con GROQ (principal de FAST_LLM)
        DEFAULT_REASONING_LLM: 'google:gemini-2.5-flash', // Comparte con GOOGLE (principal de REASONING)
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEFAULT_FAST_LLM comparte proveedor')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEFAULT_REASONING_LLM comparte proveedor')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Fallback Execution Cascade (CA-3, CA-4)', () => {
    let server: http.Server;
    let baseUrl: string;
    const testSecret = 'sec-fallback-test';

    const mockGeminiGenerate = vi.fn();
    const mockGroqGenerate = vi.fn();

    beforeAll(async () => {
      const geminiAdapter = new GeminiAdapter({ apiKey: 'k-gemini' });
      geminiAdapter.generate = mockGeminiGenerate;

      const groqAdapter = new GroqAdapter({ apiKey: 'k-groq' });
      groqAdapter.generate = mockGroqGenerate;

      const healthSensor = new HealthSensor();
      const fallbackConfig = {
        defaultFastLlm: { provider: 'GOOGLE' as const, modelId: 'gemini-2.5-flash-anchor' },
        defaultReasoningLlm: { provider: 'GROQ' as const, modelId: 'llama-3.3-70b-anchor' },
      };

      const llmHandler = createLlmHandler(geminiAdapter, groqAdapter, healthSensor, fallbackConfig);

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

    it('CA-4: debe invocar anclaje base cuando la matriz falla y marcar fallbackTriggered: true', async () => {
      // FAST_LLM intenta GROQ (falla) y GOOGLE (falla)
      mockGroqGenerate.mockRejectedValueOnce(new Error('Groq 500'));
      mockGeminiGenerate.mockRejectedValueOnce(new Error('Gemini 500'));

      // El anclaje base (GOOGLE gemini-2.5-flash-anchor) tiene éxito
      mockGeminiGenerate.mockResolvedValueOnce({
        text: 'Respuesta servida por anclaje base',
        modelId: 'gemini-2.5-flash-anchor',
        promptTokens: 50,
        completionTokens: 20,
        totalTokens: 70,
        durationMs: 400,
      });

      const res = await fetch(`${baseUrl}/v1/llm/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AUTH_HEADER_NAME]: testSecret,
        },
        body: JSON.stringify({
          prompt: 'Consulta de contingencia',
          engineType: 'FAST_LLM',
          responseFormat: 'text',
        }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as OperationEnvelope<LlmGenerateOutput>;
      expect(body.success).toBe(true);
      expect(body.result?.text).toBe('Respuesta servida por anclaje base');
      expect(body.result?.metrics.fallbackTriggered).toBe(true);
      expect(body.result?.metrics.provider).toBe('GOOGLE');
      expect(body.result?.metrics.attemptedProviders.some((p) => p.includes('anchor'))).toBe(true);
    });

    it('CA-3: debe responder con 503 y sobre de error determinista ante agotamiento total', async () => {
      // Todo falla: matriz y anclaje
      mockGroqGenerate.mockRejectedValueOnce(new Error('Groq down'));
      mockGeminiGenerate.mockRejectedValueOnce(new Error('Gemini down'));
      mockGeminiGenerate.mockRejectedValueOnce(new Error('Anchor down'));

      const res = await fetch(`${baseUrl}/v1/llm/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [AUTH_HEADER_NAME]: testSecret,
        },
        body: JSON.stringify({
          prompt: 'Consulta sin respuesta posible',
          engineType: 'FAST_LLM',
          responseFormat: 'text',
        }),
      });

      expect(res.status).toBe(503);
      const body = (await res.json()) as OperationEnvelope<never>;
      expect(body.success).toBe(false);
      expect(body.exitCode).toBe(503);
      expect(body.errors?.[0]).toContain('Agotamiento total de proveedores');
    });
  });
});
