import { describe, expect, it, vi } from 'vitest';
import { IaGatewayClient } from './ia-gateway.client';
import type { TelemetryRepositoryPort } from '@/features/telemetry';

describe('IaGatewayClient (PBI-GW-006)', () => {
  const secret = 'test-secret-gateway-123';
  const baseUrl = 'http://ia-gateway:3001';

  it('CA-1: debe ejecutar evaluateNoul enviando cabecera y parseando con Zod', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        exitCode: 0,
        result: {
          primitive: 'noul',
          probability: 0.85,
          isAffirmative: true,
          metrics: {
            engineType: 'TYPED_DECISION',
            provider: 'JEV',
            modelId: 'jev-latest',
            promptTokens: 100,
            completionTokens: 5,
            totalTokens: 105,
            fallbackTriggered: false,
            attemptedProviders: ['JEV'],
            durationMs: 150,
          },
        },
      }),
    });

    const client = new IaGatewayClient({ baseUrl, gatewaySecret: secret }, undefined, mockFetch as unknown as typeof fetch);
    const result = await client.evaluateNoul('Contexto', '¿Es afirmativo?');

    expect(result.probability).toBe(0.85);
    expect(result.isAffirmative).toBe(true);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://ia-gateway:3001/v1/decision/evaluate',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-ia-gateway-secret': secret,
        }),
      })
    );
  });

  it('CA-1: debe ejecutar evaluateChoice correctamente', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        exitCode: 0,
        result: {
          primitive: 'choice',
          selectedChoice: 'gothic',
          confidence: 0.95,
          probabilities: { gothic: 0.95, modern: 0.05 },
          metrics: {
            engineType: 'TYPED_DECISION',
            provider: 'JEV',
            modelId: 'jev-latest',
            promptTokens: 120,
            completionTokens: 10,
            totalTokens: 130,
            fallbackTriggered: false,
            attemptedProviders: ['JEV'],
            durationMs: 160,
          },
        },
      }),
    });

    const client = new IaGatewayClient({ baseUrl, gatewaySecret: secret }, undefined, mockFetch as unknown as typeof fetch);
    const result = await client.evaluateChoice('Barri Gòtic', 'Identifica el barrio', ['gothic', 'modern']);

    expect(result.selectedChoice).toBe('gothic');
    expect(result.confidence).toBe(0.95);
    expect(result.probabilities['gothic']).toBe(0.95);
  });

  it('CA-1 (PBI-GW-017): lanza error y registra telemetría ERROR si selectedChoice está fuera de las opciones válidas', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        exitCode: 0,
        result: {
          primitive: 'choice',
          selectedChoice: 'alien_neighborhood',
          confidence: 0.99,
          probabilities: { alien_neighborhood: 0.99 },
          metrics: {
            engineType: 'TYPED_DECISION',
            provider: 'JEV',
            modelId: 'jev-latest',
            promptTokens: 100,
            completionTokens: 10,
            totalTokens: 110,
            fallbackTriggered: false,
            attemptedProviders: ['JEV'],
            durationMs: 120,
          },
        },
      }),
    });

    const mockTelemetryRepo: TelemetryRepositoryPort = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue(0),
    };

    const client = new IaGatewayClient(
      { baseUrl, gatewaySecret: secret },
      mockTelemetryRepo,
      mockFetch as unknown as typeof fetch
    );

    await expect(
      client.evaluateChoice('Barri Gòtic', 'Identifica el barrio', ['gothic', 'modern'] as const)
    ).rejects.toThrow(/fuera de las opciones válidas/);

    expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'ERROR',
        statusCode: 422,
        message: expect.stringContaining('alien_neighborhood'),
      })
    );
  });

  it('CA-1 (PBI-GW-017): lanza error y registra telemetría ERROR si una clave de probabilities es inválida', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        exitCode: 0,
        result: {
          primitive: 'choice',
          selectedChoice: 'gothic',
          confidence: 0.9,
          probabilities: { gothic: 0.9, invalid_key: 0.1 },
          metrics: {
            engineType: 'TYPED_DECISION',
            provider: 'JEV',
            modelId: 'jev-latest',
            promptTokens: 100,
            completionTokens: 10,
            totalTokens: 110,
            fallbackTriggered: false,
            attemptedProviders: ['JEV'],
            durationMs: 120,
          },
        },
      }),
    });

    const mockTelemetryRepo: TelemetryRepositoryPort = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue(0),
    };

    const client = new IaGatewayClient(
      { baseUrl, gatewaySecret: secret },
      mockTelemetryRepo,
      mockFetch as unknown as typeof fetch
    );

    await expect(
      client.evaluateChoice('Barri Gòtic', 'Identifica el barrio', ['gothic', 'modern'] as const)
    ).rejects.toThrow(/clave inválida 'invalid_key'/);

    expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'ERROR',
        statusCode: 422,
      })
    );
  });

  it('CA-1: debe reportar evaluateHealth correctamente', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        exitCode: 0,
        result: {
          status: 'healthy',
          timestamp: '2026-09-29T12:00:00.000Z',
        },
      }),
    });

    const client = new IaGatewayClient({ baseUrl, gatewaySecret: secret }, undefined, mockFetch as unknown as typeof fetch);
    const health = await client.evaluateHealth();

    expect(health.isHealthy).toBe(true);
    expect(health.statusCode).toBe(200);
  });

  it('CA-2: debe generar ruta táctica (JSON) y devolver entidades puras de dominio', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        exitCode: 0,
        result: {
          text: '{}',
          json: {
            id: 'route-bcn-1',
            summary: 'Ruta Táctica Modernista en Eixample',
            waypoints: [
              {
                id: 'wp-1',
                title: 'Casa Batlló',
                description: 'Obra de Antoni Gaudí',
                coordinates: { lat: 41.3916, lng: 2.1648 },
                timeSpan: { start: '10:00', end: '11:30' },
                recommendations: ['Reserva con antelación'],
              },
            ],
          },
          metrics: {
            engineType: 'REASONING_LLM',
            provider: 'GOOGLE',
            modelId: 'gemini-2.5-flash',
            promptTokens: 150,
            completionTokens: 80,
            totalTokens: 230,
            fallbackTriggered: false,
            attemptedProviders: ['GOOGLE'],
            durationMs: 450,
          },
        },
      }),
    });

    const client = new IaGatewayClient({ baseUrl, gatewaySecret: secret }, undefined, mockFetch as unknown as typeof fetch);
    const route = await client.generateTacticalRoute('Ruta modernista en Barcelona');

    expect(route.id).toBe('route-bcn-1');
    expect(route.summary).toBe('Ruta Táctica Modernista en Eixample');
    expect(route.waypoints.length).toBe(1);
    expect(route.waypoints[0]?.coordinates?.lat).toBe(41.3916);
  });

  it('CA-2: debe generar texto libre mediante generateText', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        exitCode: 0,
        result: {
          text: 'Consejo rápido de tránsito en Barcelona.',
          metrics: {
            engineType: 'FAST_LLM',
            provider: 'GROQ',
            modelId: 'llama-3.3-70b-versatile',
            promptTokens: 40,
            completionTokens: 10,
            totalTokens: 50,
            fallbackTriggered: false,
            attemptedProviders: ['GROQ'],
            durationMs: 120,
          },
        },
      }),
    });

    const client = new IaGatewayClient({ baseUrl, gatewaySecret: secret }, undefined, mockFetch as unknown as typeof fetch);
    const text = await client.generateText('Dame un consejo');

    expect(text).toBe('Consejo rápido de tránsito en Barcelona.');
  });

  it('CA-5: debe propagar error determinista si el sobre devuelve success: false', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        exitCode: 503,
        errors: ['Agotamiento total de proveedores LLM'],
        feedback: 'Servicio no disponible',
      }),
    });

    const client = new IaGatewayClient({ baseUrl, gatewaySecret: secret }, undefined, mockFetch as unknown as typeof fetch);
    await expect(client.generateText('Pregunta')).rejects.toThrow(
      'IA Gateway error (503): Agotamiento total de proveedores LLM'
    );
  });

  it('CA-5: debe manejar gateway inalcanzable por fallo de red', async () => {
    const mockFetch = vi.fn().mockRejectedValueOnce(new Error('fetch failed: ECONNREFUSED'));

    const client = new IaGatewayClient({ baseUrl, gatewaySecret: secret }, undefined, mockFetch as unknown as typeof fetch);
    await expect(client.evaluateNoul('s', 'i')).rejects.toThrow('ECONNREFUSED');
  });

  // ─────────────────────────────────────────────────────────────
  // PBI-GW-007: Telemetría Unificada bajo LLM_ENGINE
  // ─────────────────────────────────────────────────────────────

  it('PBI-GW-007 CA-1/CA-2/CA-3: debe emitir telemetría bajo contexto LLM_ENGINE con métricas completas', async () => {
    const previousEnv = process.env.TELEMETRY_LLM_ENABLED;
    delete process.env.TELEMETRY_LLM_ENABLED;

    const mockTelemetryRepo = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        exitCode: 0,
        result: {
          primitive: 'noul',
          probability: 0.9,
          isAffirmative: true,
          metrics: {
            engineType: 'TYPED_DECISION',
            provider: 'JEV',
            modelId: 'jev-decision-v1',
            promptTokens: 80,
            completionTokens: 2,
            totalTokens: 82,
            fallbackTriggered: false,
            attemptedProviders: ['JEV'],
            durationMs: 95,
          },
        },
      }),
    });

    const client = new IaGatewayClient(
      { baseUrl, gatewaySecret: secret },
      mockTelemetryRepo,
      mockFetch as unknown as typeof fetch
    );

    await client.evaluateNoul('Estado', 'Instrucción');

    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);
    const loggedEntry = mockTelemetryRepo.log.mock.calls[0]?.[0];
    expect(loggedEntry).toBeDefined();
    expect(loggedEntry.context).toBe('LLM_ENGINE');
    expect(loggedEntry.level).toBe('INFO');
    expect(loggedEntry.statusCode).toBe(200);
    expect(loggedEntry.durationMs).toBe(95);
    expect(loggedEntry.message).toContain('[IA Gateway TYPED_DECISION]');
    expect(loggedEntry.payload).toEqual({
      engineType: 'TYPED_DECISION',
      provider: 'JEV',
      modelId: 'jev-decision-v1',
      promptTokens: 80,
      completionTokens: 2,
      totalTokens: 82,
      fallbackTriggered: false,
      attemptedProviders: ['JEV'],
      attemptedModels: [],
    });

    if (previousEnv !== undefined) {
      process.env.TELEMETRY_LLM_ENABLED = previousEnv;
    }
  });

  it('PBI-GW-007 CA-2: debe registrar WARN si se activó fallbackTriggered', async () => {
    const previousEnv = process.env.TELEMETRY_LLM_ENABLED;
    delete process.env.TELEMETRY_LLM_ENABLED;

    const mockTelemetryRepo = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        exitCode: 0,
        result: {
          text: 'Respuesta generada vía Gemini tras fallback',
          metrics: {
            engineType: 'FAST_LLM',
            provider: 'GOOGLE',
            modelId: 'gemini-2.5-flash',
            promptTokens: 50,
            completionTokens: 20,
            totalTokens: 70,
            fallbackTriggered: true,
            attemptedProviders: ['GROQ', 'GOOGLE'],
            durationMs: 380,
          },
        },
      }),
    });

    const client = new IaGatewayClient(
      { baseUrl, gatewaySecret: secret },
      mockTelemetryRepo,
      mockFetch as unknown as typeof fetch
    );

    await client.generateText('Consulta');

    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);
    const loggedEntry = mockTelemetryRepo.log.mock.calls[0]?.[0];
    expect(loggedEntry.level).toBe('WARN');
    expect(loggedEntry.message).toContain('anclaje base');
    expect(loggedEntry.payload).toMatchObject({
      fallbackTriggered: true,
      attemptedProviders: ['GROQ', 'GOOGLE'],
    });

    if (previousEnv !== undefined) {
      process.env.TELEMETRY_LLM_ENABLED = previousEnv;
    }
  });

  it('PBI-GW-007 CA-4: debe omitir el registro cuando TELEMETRY_LLM_ENABLED es false', async () => {
    const previousEnv = process.env.TELEMETRY_LLM_ENABLED;
    process.env.TELEMETRY_LLM_ENABLED = 'false';

    const mockTelemetryRepo = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        exitCode: 0,
        result: {
          text: 'Sin telemetría',
          metrics: {
            engineType: 'FAST_LLM',
            provider: 'GROQ',
            modelId: 'llama-3.3-70b-versatile',
            promptTokens: 10,
            completionTokens: 5,
            totalTokens: 15,
            fallbackTriggered: false,
            attemptedProviders: ['GROQ'],
            durationMs: 80,
          },
        },
      }),
    });

    const client = new IaGatewayClient(
      { baseUrl, gatewaySecret: secret },
      mockTelemetryRepo,
      mockFetch as unknown as typeof fetch
    );

    await client.generateText('Prueba');

    expect(mockTelemetryRepo.log).not.toHaveBeenCalled();

    if (previousEnv !== undefined) {
      process.env.TELEMETRY_LLM_ENABLED = previousEnv;
    } else {
      delete process.env.TELEMETRY_LLM_ENABLED;
    }
  });

  it('PBI-GW-007 CA-1: fallo en telemetría fire-and-forget no interrumpe la respuesta al cliente', async () => {
    const previousEnv = process.env.TELEMETRY_LLM_ENABLED;
    delete process.env.TELEMETRY_LLM_ENABLED;

    const mockTelemetryRepo = {
      log: vi.fn().mockRejectedValue(new Error('Fallo de escritura en DB')),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        exitCode: 0,
        result: {
          text: 'Texto válido',
          metrics: {
            engineType: 'FAST_LLM',
            provider: 'GROQ',
            modelId: 'llama-3.3-70b-versatile',
            promptTokens: 10,
            completionTokens: 5,
            totalTokens: 15,
            fallbackTriggered: false,
            attemptedProviders: ['GROQ'],
            durationMs: 80,
          },
        },
      }),
    });

    const client = new IaGatewayClient(
      { baseUrl, gatewaySecret: secret },
      mockTelemetryRepo,
      mockFetch as unknown as typeof fetch
    );

    const result = await client.generateText('Prueba');
    expect(result).toBe('Texto válido');

    if (previousEnv !== undefined) {
      process.env.TELEMETRY_LLM_ENABLED = previousEnv;
    }
  });

  it('PBI-GW-010 CA-3: debe incluir attemptedModels en el payload de telemetría', async () => {
    const previousEnv = process.env.TELEMETRY_LLM_ENABLED;
    process.env.TELEMETRY_LLM_ENABLED = 'true';

    const mockTelemetryRepo = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        exitCode: 0,
        result: {
          text: 'Respuesta recuperada tras degradación intra-proveedor',
          metrics: {
            engineType: 'REASONING_LLM',
            provider: 'GOOGLE',
            modelId: 'gemini-3-flash-preview',
            promptTokens: 120,
            completionTokens: 30,
            totalTokens: 150,
            fallbackTriggered: false,
            attemptedProviders: ['GOOGLE'],
            attemptedModels: ['GOOGLE:gemini-3.5-flash', 'GOOGLE:gemini-3-flash-preview'],
            durationMs: 250,
          },
        },
      }),
    });

    const client = new IaGatewayClient(
      { baseUrl, gatewaySecret: secret },
      mockTelemetryRepo,
      mockFetch as unknown as typeof fetch
    );

    await client.generateText('Consulta con degradación de modelos');

    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);
    const loggedEntry = mockTelemetryRepo.log.mock.calls[0]?.[0];
    expect(loggedEntry.payload).toMatchObject({
      engineType: 'REASONING_LLM',
      provider: 'GOOGLE',
      modelId: 'gemini-3-flash-preview',
      attemptedProviders: ['GOOGLE'],
      attemptedModels: ['GOOGLE:gemini-3.5-flash', 'GOOGLE:gemini-3-flash-preview'],
    });

    if (previousEnv !== undefined) {
      process.env.TELEMETRY_LLM_ENABLED = previousEnv;
    }
  });

  describe('Grounding y Discriminación de Capacidades (PBI-CTX-002)', () => {
    it('CA-9: debe ejecutar generateWithGrounding y devolver texto con fuentes citadas', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          exitCode: 0,
          result: {
            text: 'Información con grounding de Gemini',
            json: {
              groundingSources: [{ uri: 'https://barcelona.cat', title: 'Ajuntament de Barcelona' }],
            },
            metrics: {
              engineType: 'REASONING_LLM',
              provider: 'GOOGLE',
              modelId: 'gemini-3.5-flash',
              promptTokens: 100,
              completionTokens: 20,
              totalTokens: 120,
              fallbackTriggered: false,
              attemptedProviders: ['GOOGLE'],
              attemptedModels: ['GOOGLE:gemini-3.5-flash'],
              durationMs: 200,
              grounded: true,
            },
          },
        }),
      });

      const client = new IaGatewayClient(
        { baseUrl, gatewaySecret: secret },
        undefined,
        mockFetch as unknown as typeof fetch
      );

      const res = await client.generateWithGrounding('Consulta cultural');
      expect(res.text).toBe('Información con grounding de Gemini');
      expect(res.groundingSources).toHaveLength(1);
      expect(res.groundingSources[0]?.uri).toBe('https://barcelona.cat');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://ia-gateway:3001/v1/llm/generate',
        expect.objectContaining({
          body: JSON.stringify({
            prompt: 'Consulta cultural',
            engineType: 'REASONING_LLM',
            responseFormat: 'text',
            grounding: true,
          }),
        })
      );
    });

    it('CA-9: debe discriminar error 501 UNSUPPORTED_CAPABILITY lanzando UnsupportedCapabilityError', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 501,
        json: async () => ({
          success: false,
          exitCode: 501,
          feedback: 'Capacidad no disponible',
          errors: ['UNSUPPORTED_CAPABILITY: grounding requiere proveedor GOOGLE disponible'],
        }),
      });

      const client = new IaGatewayClient(
        { baseUrl, gatewaySecret: secret },
        undefined,
        mockFetch as unknown as typeof fetch
      );

      await expect(client.generateWithGrounding('Consulta')).rejects.toThrowError(
        'UNSUPPORTED_CAPABILITY: grounding requiere proveedor GOOGLE disponible'
      );
    });
  });
});
