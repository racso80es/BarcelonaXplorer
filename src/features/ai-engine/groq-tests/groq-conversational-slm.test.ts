import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type Groq from 'groq-sdk';
import { GroqConversationalSlmAdapter } from '@/features/ai-engine/groq/groq-conversational-slm.adapter';
import { TelemetryRepositoryPort } from '@/features/telemetry';

describe('GroqConversationalSlmAdapter (HU-CORE-TRIAGE-002: System Two Ligero)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      GROQ_API_KEY: 'gsk_mock_test_key_12345',
      GROQ_FAST_MODEL: 'qwen/qwen3.8-27b',
      TELEMETRY_LLM_ENABLED: 'true',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('TC-TRIAGE-05: generateRepromptMessage genera una repregunta contextual con Groq', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: '¡Gran plan por el Gótico! Para calcular la ruta exacta, ¿cuántas horas tienes pensadas?',
          },
        },
      ],
    });

    const mockGroqClient = {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    } as unknown as Groq;

    const mockTelemetry: TelemetryRepositoryPort = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    const adapter = new GroqConversationalSlmAdapter(mockGroqClient, mockTelemetry);
    const message = await adapter.generateRepromptMessage(
      'time_window',
      'Quiero ver rincones del Gótico con amigos',
      '{"group_size": 3}',
    );

    expect(message).toBe(
      '¡Gran plan por el Gótico! Para calcular la ruta exacta, ¿cuántas horas tienes pensadas?',
    );
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockTelemetry.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'INFO',
        context: 'LLM_ENGINE',
        statusCode: 200,
      }),
    );
  });

  it('generateBounceMessage genera un rebote empático para destino foráneo', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: 'Mi radar está anclado en Barcelona; si te animas a explorar la capital catalana, avísame.',
          },
        },
      ],
    });

    const mockGroqClient = {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    } as unknown as Groq;

    const adapter = new GroqConversationalSlmAdapter(mockGroqClient);
    const message = await adapter.generateBounceMessage('Girona', 'Restaurantes en Girona');

    expect(message).toContain('Mi radar está anclado en Barcelona');
  });

  it('retorna fallback determinista si GROQ_API_KEY no está configurada', async () => {
    delete process.env.GROQ_API_KEY;

    const adapter = new GroqConversationalSlmAdapter();
    const reprompt = await adapter.generateRepromptMessage('time_window', 'Quiero pasear');

    expect(reprompt).toContain('¿cuántas horas o qué parte del día tienes disponible?');
  });

  it('activa Fail-Soft y emite WARN en telemetría ante error en la llamada de Groq', async () => {
    const mockCreate = vi.fn().mockRejectedValue(new Error('Rate limit exceeded 429'));

    const mockGroqClient = {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    } as unknown as Groq;

    const mockTelemetry: TelemetryRepositoryPort = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    const adapter = new GroqConversationalSlmAdapter(mockGroqClient, mockTelemetry);
    const message = await adapter.generateRepromptMessage('group_size', 'Ruta en bici');

    // Debe devolver el mensaje fallback en vez de lanzar error
    expect(message).toContain('¿cuántas personas seréis?');
    expect(mockTelemetry.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'WARN',
        context: 'LLM_ENGINE',
        statusCode: 500,
      }),
    );
  });

  it('TC-TRIAGE-06: generateContextualGreeting sintetiza un saludo proactivo con telemetría INFO', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: '¡Buenos días! Barcelona amanece radiante. ¿Arrancamos con una ruta por el Born?',
          },
        },
      ],
    });

    const mockGroqClient = {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    } as unknown as Groq;

    const mockTelemetry: TelemetryRepositoryPort = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    const adapter = new GroqConversationalSlmAdapter(mockGroqClient, mockTelemetry);
    const greeting = await adapter.generateContextualGreeting({
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      device: 'MOBILE',
      language: 'es',
      clientTimestamp: Date.now(),
      serverTimestamp: Date.now(),
      detectedHour: 10,
      period: 'MORNING',
      weatherSummary: 'Cielo despejado',
      temperatureCelsius: 21,
    });

    expect(greeting).toBe('¡Buenos días! Barcelona amanece radiante. ¿Arrancamos con una ruta por el Born?');
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockTelemetry.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'INFO',
        context: 'LLM_ENGINE',
        statusCode: 200,
      }),
    );
  });
});

