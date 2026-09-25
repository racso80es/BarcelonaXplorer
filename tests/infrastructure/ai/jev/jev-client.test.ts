import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JevClient } from '@/infrastructure/ai/jev/jevClient';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { TelemetryEntry } from '@/features/telemetry';

describe('JevClient (HU-INFRA-JEV-001: Infraestructura y Sonda Térmica)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      JEV_API_KEY: 'jev_test_key_live_12345',
      JEV_BASE_URL: 'https://jev-ai.pro/api',
      JEV_LATENCY_WARN_THRESHOLD_MS: '800',
      JEV_HEALTH_TIMEOUT_MS: '2000',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('TC-JEV-01: Ping exitoso a /v1/models reporta estado saludable y modelos disponibles', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          models: [
            { name: 'jev-latest', description: 'Jev System One' },
            { name: 'laya-multilingual', description: 'Multilingual Classifier' },
          ],
        }),
      }),
    );

    const client = new JevClient();
    const result = await client.evaluateHealth();

    expect(result.isHealthy).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.modelCount).toBe(2);
    expect(result.error).toBeUndefined();
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('TC-JEV-03: Manejo estructurado de error HTTP 401 (Unauthorized) sin propagar crash', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: { message: 'Invalid or revoked Jev API Key' },
        }),
      }),
    );

    const client = new JevClient();
    const result = await client.evaluateHealth();

    expect(result.isHealthy).toBe(false);
    expect(result.statusCode).toBe(401);
    expect(result.error).toContain('Invalid or revoked Jev API Key');
  });

  it('TC-JEV-04: Resiliencia Fail-Soft ante corte de red o timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValueOnce(new Error('Connection reset by peer')),
    );

    const client = new JevClient();
    const result = await client.evaluateHealth();

    expect(result.isHealthy).toBe(false);
    expect(result.error).toContain('Connection reset by peer');
  });

  it('TC-JEV-05: Comportamiento seguro si JEV_API_KEY no está configurada', async () => {
    delete process.env.JEV_API_KEY;

    const client = new JevClient();
    const result = await client.evaluateHealth();

    expect(result.isHealthy).toBe(false);
    expect(result.latencyMs).toBe(0);
    expect(result.error).toContain('JEV_API_KEY no configurada');
  });

  it('TC-JEV-06: Inferencia Noul evalúa probabilidad afirmativa correctamente', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          model: 'jev-1.13.0',
          answers: {
            eval_question: {
              type: 'noul',
              noul: 0.94,
            },
          },
          usage: { input_tokens: 45, output_tokens: 2 },
        }),
      }),
    );

    const client = new JevClient();
    const evaluation = await client.evaluateNoul(
      'El cliente quiere visitar la Sagrada Família',
      '¿La intención ocurre dentro de Barcelona?',
      0.5,
    );

    expect(evaluation.probability).toBe(0.94);
    expect(evaluation.isAffirmative).toBe(true);
  });

  it('TC-JEV-07: Resiliencia Fail-Soft ante payload malformado de /v1/models validado por Zod', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          unexpected_key: 'invalid_data',
        }),
      }),
    );

    const client = new JevClient();
    const result = await client.evaluateHealth();

    expect(result.isHealthy).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/models/i);
  });

  it('TC-JEV-08: Mapea etiquetas de diccionario para códigos 402, 429, 502 y 503 cuando no hay cuerpo estructurado', async () => {
    const errorCodes = [
      { code: 402, text: 'Saldo de tokens o créditos insuficiente' },
      { code: 429, text: 'Límite de cuota excedido' },
      { code: 502, text: 'Gateway de Jev AI no disponible' },
      { code: 503, text: 'Servicio upstream en mantenimiento' },
    ];

    for (const { code, text } of errorCodes) {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce({
          ok: false,
          status: code,
          statusText: 'Error',
          json: async () => {
            throw new Error('Not JSON');
          },
        }),
      );

      const client = new JevClient();
      const result = await client.evaluateHealth();
      expect(result.statusCode).toBe(code);
      expect(result.error).toBe(text);
    }
  });

  it('TC-JEV-09: Maneja errores que no son instancias de Error nativo en evaluateHealth', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce('raw-string-rejection'));

    const client = new JevClient();
    const result = await client.evaluateHealth();

    expect(result.isHealthy).toBe(false);
    expect(result.error).toContain('Fallo de conexión no especificado');
  });

  it('TC-JEV-10: evaluateNoul lanza error si JEV_API_KEY no existe', async () => {
    delete process.env.JEV_API_KEY;
    const client = new JevClient();

    await expect(
      client.evaluateNoul('state', 'instruction'),
    ).rejects.toThrow('JEV_API_KEY no configurada');
  });

  it('TC-JEV-11: evaluateNoul lanza error ante respuesta HTTP no exitosa', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
      }),
    );

    const client = new JevClient();
    await expect(
      client.evaluateNoul('state', 'instruction'),
    ).rejects.toThrow('Jev AI /v1/systemone error: HTTP 500');
  });

  it('TC-JEV-12: evaluateNoul lanza error ante respuesta con tipo no noul o malformada', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          model: 'jev-latest',
          answers: {
            eval_question: {
              type: 'choice',
              choice: 'c',
              probabilities: { c: 1 },
            },
          },
        }),
      }),
    );

    const client = new JevClient();
    await expect(
      client.evaluateNoul('state', 'instruction'),
    ).rejects.toThrow('Respuesta malformada de Jev AI para pregunta noul');
  });

  it('TC-JEV-13: evaluateNoul calcula isAffirmative = false cuando la probabilidad es menor al umbral', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          model: 'jev-latest',
          answers: {
            eval_question: {
              type: 'noul',
              noul: 0.35,
            },
          },
        }),
      }),
    );

    const client = new JevClient();
    const result = await client.evaluateNoul('Madrid Gran Vía', '¿Es Barcelona?', 0.6);

    expect(result.probability).toBe(0.35);
    expect(result.isAffirmative).toBe(false);
  });

  it('TC-JEV-14: evaluateNoul registra INFO en telemetría LLM_ENGINE ante inferencia exitosa', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          model: 'jev-latest',
          answers: {
            eval_question: {
              type: 'noul',
              noul: 0.92,
            },
          },
        }),
      }),
    );

    const mockTelemetryRepo: TelemetryRepositoryPort = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    const client = new JevClient(undefined, mockTelemetryRepo);
    const result = await client.evaluateNoul('Sagrada Família', '¿Es Barcelona?', 0.5);

    expect(result.isAffirmative).toBe(true);
    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);

    const logged = (mockTelemetryRepo.log as any).mock.calls[0][0] as TelemetryEntry;
    expect(logged.level).toBe('INFO');
    expect(logged.context).toBe('LLM_ENGINE');
    expect(logged.statusCode).toBe(200);
    expect(logged.message).toContain('[Jev AI System One] Inferencia evaluada');
    expect(logged.payload).toMatchObject({
      model: 'jev-latest',
      state: 'Sagrada Família',
      instruction: '¿Es Barcelona?',
      probability: 0.92,
      isAffirmative: true,
    });
  });

  it('TC-JEV-15: evaluateNoul registra ERROR en telemetría LLM_ENGINE ante fallo de inferencia', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
      }),
    );

    const mockTelemetryRepo: TelemetryRepositoryPort = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    const client = new JevClient(undefined, mockTelemetryRepo);
    await expect(client.evaluateNoul('Park Güell', '¿Es Barcelona?')).rejects.toThrow();

    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);
    const logged = (mockTelemetryRepo.log as any).mock.calls[0][0] as TelemetryEntry;
    expect(logged.level).toBe('ERROR');
    expect(logged.context).toBe('LLM_ENGINE');
    expect(logged.statusCode).toBe(500);
    expect(logged.message).toContain('[Jev AI System One] Fallo en inferencia');
  });

  it('TC-JEV-16: evaluateNoul omite telemetría si TELEMETRY_LLM_ENABLED es false', async () => {
    process.env.TELEMETRY_LLM_ENABLED = 'false';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
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
        }),
      }),
    );

    const mockTelemetryRepo: TelemetryRepositoryPort = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    const client = new JevClient(undefined, mockTelemetryRepo);
    await client.evaluateNoul('Born', '¿Es Barcelona?');

    expect(mockTelemetryRepo.log).not.toHaveBeenCalled();
  });
});

