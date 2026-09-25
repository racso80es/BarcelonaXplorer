import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiClient } from '@/features/ai-engine';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { TelemetryEntry } from '@/features/telemetry';

describe('GeminiClient (Telemetría LLM_ENGINE e Inferencia)', () => {
  const originalEnv = process.env;
  let mockTelemetryRepo: TelemetryRepositoryPort;
  let mockGenerateContent: ReturnType<typeof vi.fn>;

  const createMockAiClient = (generateContentFn: ReturnType<typeof vi.fn>) =>
    ({
      models: {
        generateContent: generateContentFn,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      GEMINI_API_KEY: 'test-gemini-key-123',
      GEMINI_MODELS: 'gemini-1.5-flash',
      TELEMETRY_LLM_ENABLED: 'true',
    };
    mockTelemetryRepo = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };
    mockGenerateContent = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('TC-GEMINI-01: Lanza error si GEMINI_API_KEY no está configurada y no hay cliente inyectado', () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => new GeminiClient(undefined, mockTelemetryRepo)).toThrow(
      'GEMINI_API_KEY no está configurada en las variables de entorno.',
    );
  });

  it('TC-GEMINI-02: generateText registra INFO en telemetría LLM_ENGINE ante inferencia exitosa', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: 'Barcelona es una ciudad cosmopolita del Mediterráneo.',
    });

    const mockAi = createMockAiClient(mockGenerateContent);
    const client = new GeminiClient(mockAi, mockTelemetryRepo);
    const result = await client.generateText('Describe Barcelona en una frase');

    expect(result).toBe('Barcelona es una ciudad cosmopolita del Mediterráneo.');
    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);

    const logged = (mockTelemetryRepo.log as any).mock.calls[0][0] as TelemetryEntry;
    expect(logged.level).toBe('INFO');
    expect(logged.context).toBe('LLM_ENGINE');
    expect(logged.statusCode).toBe(200);
    expect(logged.message).toContain('[Gemini generateText] Inferencia completada con éxito');
    expect(logged.payload).toMatchObject({
      model: 'gemini-1.5-flash',
      prompt: 'Describe Barcelona en una frase',
      responseLength: 53,
    });
  });

  it('TC-GEMINI-03: generateText registra WARN en telemetría ante fallo del modelo', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('Quota exceeded for model gemini-1.5-flash'));

    const mockAi = createMockAiClient(mockGenerateContent);
    const client = new GeminiClient(mockAi, mockTelemetryRepo);
    await expect(client.generateText('Frase corta')).rejects.toThrow(
      'Todos los modelos fallaron en generateText',
    );

    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);
    const logged = (mockTelemetryRepo.log as any).mock.calls[0][0] as TelemetryEntry;
    expect(logged.level).toBe('WARN');
    expect(logged.context).toBe('LLM_ENGINE');
    expect(logged.statusCode).toBe(500);
    expect(logged.message).toContain('Quota exceeded');
  });

  it('TC-GEMINI-04: generateText omite registro de telemetría si TELEMETRY_LLM_ENABLED es false', async () => {
    process.env.TELEMETRY_LLM_ENABLED = 'false';
    mockGenerateContent.mockResolvedValueOnce({
      text: 'Respuesta sin telemetría.',
    });

    const mockAi = createMockAiClient(mockGenerateContent);
    const client = new GeminiClient(mockAi, mockTelemetryRepo);
    const result = await client.generateText('Hola');

    expect(result).toBe('Respuesta sin telemetría.');
    expect(mockTelemetryRepo.log).not.toHaveBeenCalled();
  });
});
