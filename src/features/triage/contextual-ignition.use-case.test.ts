import { describe, it, expect, vi } from 'vitest';
import { ContextualIgnitionUseCase } from './contextual-ignition.use-case';
import { IConversationalSLMPort } from '@/features/ai-engine';
import { IWeatherPort, WeatherReport } from './weather.port';
import { ICognitiveMemoryPort, DenseSemanticMatrix } from '@/features/cognitive-memory';

describe('ContextualIgnitionUseCase (S+ Grade)', () => {
  const dummySessionId = '550e8400-e29b-41d4-a716-446655440000';

  const createMockWeatherPort = (report: WeatherReport): IWeatherPort => ({
    getBarcelonaWeather: vi.fn().mockResolvedValue(report),
  });

  const createMockSlm = (greeting: string): IConversationalSLMPort => ({
    generateBounceMessage: vi.fn().mockResolvedValue('bounce'),
    generateRepromptMessage: vi.fn().mockResolvedValue('reprompt'),
    generateEmpatheticDialogue: vi.fn().mockResolvedValue('dialogue'),
    generateContextualGreeting: vi.fn().mockResolvedValue(greeting),
  });

  it('Escenario 1: Ignición virgen con lluvia y móvil (sin memoria LanceDB previa)', async () => {
    const weatherPort = createMockWeatherPort({
      summary: 'Lluvia en Barcelona',
      temperatureCelsius: 17,
      conditionCode: 61,
      isAdverse: true,
    });

    const expectedGreeting = '¡Buenos días! Parece que Barcelona ha amanecido con lluvia. ¿Buscamos un museo para resguardarnos?';
    const mockSlm = createMockSlm(expectedGreeting);

    const useCase = new ContextualIgnitionUseCase(mockSlm, weatherPort);

    // Simulamos las 10:00 AM en hora local (10 * 3600 * 1000 desde medianoche UTC aprox)
    const mockTimestamp = new Date('2026-09-26T10:00:00+02:00').getTime();

    const envelope = await useCase.execute({
      sessionId: dummySessionId,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      language: 'es',
      clientTimestamp: mockTimestamp,
    });

    expect(envelope.success).toBe(true);
    expect(envelope.result).toBeDefined();
    const result = envelope.result!;
    expect(result.greeting).toBe(expectedGreeting);
    expect(result.isFallback).toBe(false);
    expect(result.device).toBe('MOBILE');
    expect(result.period).toBe('MORNING');

    // Chispas: debe incluir chispa meteorológica de alta urgencia por ser lluvia
    const weatherSpark = result.sparks.find((s) => s.type === 'weather');
    expect(weatherSpark).toBeDefined();
    expect(weatherSpark?.urgency).toBe('high');
    expect(weatherSpark?.insight).toContain('Lluvia en Barcelona (17ºC)');
  });

  it('Escenario 2: Retorno de sesión con memoria previa en LanceDB (Continuidad táctica)', async () => {
    const weatherPort = createMockWeatherPort({
      summary: 'Cielo despejado',
      temperatureCelsius: 22,
      conditionCode: 0,
      isAdverse: false,
    });

    const mockSlm = createMockSlm('Buenas tardes de nuevo. Ayer dejamos pendiente la cena en el Born. ¿Continuamos?');

    const mockMemoryPort: ICognitiveMemoryPort = {
      persistMemory: vi.fn(),
      searchSimilarMemories: vi.fn(),
      getRecentMemories: vi.fn(),
      clearSessionMemory: vi.fn(),
      getLatestSessionMemory: vi.fn().mockResolvedValue(

        DenseSemanticMatrix.create({
          sessionId: dummySessionId,
          matrixId: 'default',
          payload: {
            group_size: 2,
            time_window: '3 horas',
            vibe: 'Romántico',
            preferences: ['Gastronomía'],
          },
        }),
      ),
    };


    const useCase = new ContextualIgnitionUseCase(mockSlm, weatherPort, mockMemoryPort);

    const mockTimestamp = new Date('2026-09-26T19:30:00+02:00').getTime();

    const envelope = await useCase.execute({
      sessionId: dummySessionId,
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      language: 'es',
      clientTimestamp: mockTimestamp,
    });

    expect(envelope.success).toBe(true);
    const result = envelope.result!;
    expect(result.period).toBe('AFTERNOON');
    expect(result.device).toBe('DESKTOP');

    // Chispa de memoria logística
    const memorySpark = result.sparks.find((s) => s.type === 'logistics');
    expect(memorySpark).toBeDefined();
    expect(memorySpark?.insight).toContain('Sesión recuperada');
    expect(memorySpark?.insight).toContain('Grupo: 2');
    expect(memorySpark?.insight).toContain('Romántico');


    // Verificamos que se le pasó al SLM el contexto previo
    expect(mockSlm.generateContextualGreeting).toHaveBeenCalledWith(
      expect.objectContaining({
        priorMemoryExcerpt: expect.stringContaining('Grupo: 2'),
      }),
    );
  });

  it('Escenario 3: Acceso nocturno/madrugada desde escritorio (DAWN & DESKTOP)', async () => {
    const weatherPort = createMockWeatherPort({
      summary: 'Despejado',
      temperatureCelsius: 16,
      conditionCode: 0,
      isAdverse: false,
    });

    const mockSlm = createMockSlm('¿Planificando tarde? Dejemos tu ruta por Barcelona lista.');
    const useCase = new ContextualIgnitionUseCase(mockSlm, weatherPort);

    const mockTimestamp = new Date('2026-09-26T03:30:00+02:00').getTime();

    const envelope = await useCase.execute({
      sessionId: dummySessionId,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      language: 'es',
      clientTimestamp: mockTimestamp,
    });

    expect(envelope.success).toBe(true);
    const result = envelope.result!;
    expect(result.period).toBe('DAWN');
    expect(result.device).toBe('DESKTOP');
  });

  it('Escenario 4: Degradación elegante (Fail-Soft) ante fallo o timeout del SLM', async () => {
    const weatherPort = createMockWeatherPort({
      summary: 'Nublado',
      temperatureCelsius: 19,
      conditionCode: 2,
      isAdverse: false,
    });

    const failingSlm: IConversationalSLMPort = {
      generateBounceMessage: vi.fn(),
      generateRepromptMessage: vi.fn(),
      generateEmpatheticDialogue: vi.fn(),
      generateContextualGreeting: vi.fn().mockRejectedValue(new Error('Groq SLM timeout exceeded (250ms)')),
    };

    const useCase = new ContextualIgnitionUseCase(failingSlm, weatherPort);

    const mockTimestamp = new Date('2026-09-26T15:00:00+02:00').getTime();

    const envelope = await useCase.execute({
      sessionId: dummySessionId,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
      language: 'es',
      clientTimestamp: mockTimestamp,
    });

    expect(envelope.success).toBe(true);
    const result = envelope.result!;
    expect(result.isFallback).toBe(true);
    expect(result.greeting).toContain('Buenas tardes');
    expect(result.period).toBe('AFTERNOON');
    expect(result.device).toBe('MOBILE');
  });
});
