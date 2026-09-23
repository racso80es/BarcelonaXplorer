import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GroqGeographicBounceGenerator } from '@/infrastructure/ai/groq/groq-geographic-bounce-generator';
import { TelemetryRepositoryPort } from '@/application/ports/out/telemetry-repository.port';
import { TelemetryEntry } from '@/domain/entities/telemetry-entry.entity';

describe('GroqGeographicBounceGenerator (Telemetría LLM_ENGINE e Inferencia SLM)', () => {
  let mockTelemetryRepo: TelemetryRepositoryPort;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTelemetryRepo = {
      log: vi.fn().mockResolvedValue(undefined),
    };
    mockCreate = vi.fn();
    vi.stubEnv('GROQ_API_KEY', 'gsk_test_key_fake');
    vi.stubEnv('GROQ_FAST_MODEL', 'qwen/qwen3.8-27b');
    vi.stubEnv('TELEMETRY_LLM_ENABLED', 'true');
  });

  const createMockGroqClient = (createFn: ReturnType<typeof vi.fn>) => {
    return {
      chat: {
        completions: {
          create: createFn,
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  };

  it('TC-BOUNCE-01: Genera rebote táctico exitosamente y registra INFO en telemetría LLM_ENGINE', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: 'Ese destino queda fuera de nuestro radar barcelonés. Barcelona te espera con otras rutas.',
          },
        },
      ],
    });

    const client = createMockGroqClient(mockCreate);
    const generator = new GroqGeographicBounceGenerator(client, mockTelemetryRepo);

    const message = await generator.generateBounceMessage('Madrid', 'Quiero ver la Cibeles en Madrid');

    expect(message).toBe('Ese destino queda fuera de nuestro radar barcelonés. Barcelona te espera con otras rutas.');
    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);

    const logged = (mockTelemetryRepo.log as any).mock.calls[0][0] as TelemetryEntry;
    expect(logged.level).toBe('INFO');
    expect(logged.context).toBe('LLM_ENGINE');
    expect(logged.statusCode).toBe(200);
    expect(logged.message).toContain("[Groq LLM Bounce] Generado mensaje de rebote para entidad 'Madrid'");
    expect(logged.payload).toMatchObject({
      model: 'qwen/qwen3.8-27b',
      rejectedEntity: 'Madrid',
      prompt: 'Quiero ver la Cibeles en Madrid',
      bounceMessage: 'Ese destino queda fuera de nuestro radar barcelonés. Barcelona te espera con otras rutas.',
    });
  });

  it('TC-BOUNCE-02: Retorna mensaje fallback sin fallar si el cliente no está inicializado', async () => {
    delete process.env.GROQ_API_KEY;
    const generator = new GroqGeographicBounceGenerator(undefined, mockTelemetryRepo);

    const message = await generator.generateBounceMessage('París', 'Quiero ver la Torre Eiffel');

    expect(message).toContain('Mi radar táctico está calibrado exclusivamente para el asfalto de Barcelona');
    expect(mockTelemetryRepo.log).not.toHaveBeenCalled();
  });

  it('TC-BOUNCE-03: Ante fallo de API de Groq, registra WARN en telemetría y retorna fallback defensivo', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Groq 503 Service Unavailable'));

    const client = createMockGroqClient(mockCreate);
    const generator = new GroqGeographicBounceGenerator(client, mockTelemetryRepo);

    const message = await generator.generateBounceMessage('Toledo', 'Ruta por el Alcázar de Toledo');

    expect(message).toContain('Mi radar táctico está calibrado exclusivamente para el asfalto de Barcelona');
    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);

    const logged = (mockTelemetryRepo.log as any).mock.calls[0][0] as TelemetryEntry;
    expect(logged.level).toBe('WARN');
    expect(logged.context).toBe('LLM_ENGINE');
    expect(logged.statusCode).toBe(500);
    expect(logged.message).toContain('Groq 503 Service Unavailable');
    expect(logged.payload).toMatchObject({
      rejectedEntity: 'Toledo',
      error: 'Groq 503 Service Unavailable',
    });
  });

  it('TC-BOUNCE-04: Retorna mensaje fallback si el modelo devuelve contenido vacío o en blanco', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: '   ',
          },
        },
      ],
    });

    const client = createMockGroqClient(mockCreate);
    const generator = new GroqGeographicBounceGenerator(client, mockTelemetryRepo);

    const message = await generator.generateBounceMessage('Valencia', 'Ir a la Ciudad de las Artes');

    expect(message).toContain('Mi radar táctico está calibrado exclusivamente para el asfalto de Barcelona');
    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);
    const logged = (mockTelemetryRepo.log as any).mock.calls[0][0] as TelemetryEntry;
    expect(logged.level).toBe('INFO');
  });

  it('TC-BOUNCE-05: Omite registro de telemetría si TELEMETRY_LLM_ENABLED es false', async () => {
    vi.stubEnv('TELEMETRY_LLM_ENABLED', 'false');
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: 'Fuera de Barcelona.',
          },
        },
      ],
    });

    const client = createMockGroqClient(mockCreate);
    const generator = new GroqGeographicBounceGenerator(client, mockTelemetryRepo);

    const message = await generator.generateBounceMessage('Sevilla', 'Giralda');

    expect(message).toBe('Fuera de Barcelona.');
    expect(mockTelemetryRepo.log).not.toHaveBeenCalled();
  });
});
