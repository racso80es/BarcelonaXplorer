import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JevClient } from '@/features/ai-engine/jev/jevClient';
import { TelemetryRepositoryPort } from '@/features/telemetry';

describe('JevClient evaluateChoice (HU-CORE-TRIAGE-002: System One Choice)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      JEV_API_KEY: 'jev_test_key_choice_98765',
      JEV_BASE_URL: 'https://jev-ai.pro/api',
      TELEMETRY_LLM_ENABLED: 'true',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('TC-TRIAGE-03: evaluateChoice resuelve una selección categórica válida con probabilidades y confianza', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          model: 'jev-latest',
          answers: {
            eval_question: {
              type: 'choice',
              choice: 'time_window',
              probabilities: {
                time_window: 0.85,
                group_size: 0.1,
                vibe: 0.05,
              },
              confidence: 0.85,
            },
          },
        }),
      }),
    );

    const client = new JevClient();
    const result = await client.evaluateChoice(
      'Quiero pasear con amigos por Gràcia',
      '¿Qué variable de contexto está ausente en la petición?',
      ['time_window', 'group_size', 'vibe'] as const,
    );

    expect(result.selectedChoice).toBe('time_window');
    expect(result.confidence).toBe(0.85);
    expect(result.probabilities['time_window']).toBe(0.85);
    expect(result.probabilities['group_size']).toBe(0.1);
  });

  it('TC-TRIAGE-04: evaluateChoice registra traza en telemetría bajo LLM_ENGINE con nivel INFO', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          model: 'jev-latest',
          answers: {
            eval_question: {
              type: 'choice',
              choice: 'vibe',
              probabilities: { vibe: 0.9 },
              confidence: 0.9,
            },
          },
        }),
      }),
    );

    const mockTelemetry: TelemetryRepositoryPort = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    const client = new JevClient(undefined, mockTelemetry);
    await client.evaluateChoice('Prompt de prueba', 'Instrucción', ['vibe', 'time_window']);

    expect(mockTelemetry.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'INFO',
        context: 'LLM_ENGINE',
        statusCode: 200,
        message: expect.stringContaining('[Jev AI System One Choice]'),
      }),
    );
  });

  it('lanza error y registra telemetría ERROR si Jev responde HTTP 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      }),
    );

    const mockTelemetry: TelemetryRepositoryPort = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    const client = new JevClient(undefined, mockTelemetry);

    await expect(
      client.evaluateChoice('Prompt', 'Instrucción', ['a', 'b']),
    ).rejects.toThrow('Jev AI /v1/systemone error: HTTP 500');

    expect(mockTelemetry.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'ERROR',
        context: 'LLM_ENGINE',
        statusCode: 500,
      }),
    );
  });

  it('lanza excepción temprana si JEV_API_KEY no está configurada', async () => {
    delete process.env.JEV_API_KEY;
    const client = new JevClient({ apiKey: undefined });

    await expect(
      client.evaluateChoice('Prompt', 'Instrucción', ['a', 'b']),
    ).rejects.toThrow('JEV_API_KEY no configurada');
  });
});
