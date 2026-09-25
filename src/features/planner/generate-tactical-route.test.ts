import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GenerateTacticalRouteUseCase } from './generate-tactical-route.use-case';
import { AiGeneratorPort } from '@/application/ports/out/ai-generator.port';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { TacticalRoute, TacticalWaypoint } from '@/domain/entities/tactical-route.entity';
import { TacticalRouteZodSchema } from '@/infrastructure/ai/schemas/tactical-route.schema';
import { TelemetryEntry } from '@/features/telemetry';
import {
  LlmEnvironmentContext,
  LlmWarningTelemetryPayload,
  LlmTelemetryEvent,
} from '@/domain/entities/llm-telemetry.types';

describe('GenerateTacticalRouteUseCase (Aduana Cognitiva del Motor LLM)', () => {
  let mockAiPort: AiGeneratorPort;
  let mockTelemetryRepo: TelemetryRepositoryPort;
  const originalEnv = process.env.TELEMETRY_LLM_ENABLED;

  beforeEach(() => {
    process.env.TELEMETRY_LLM_ENABLED = 'true';
    mockAiPort = {
      generateTacticalRoute: vi.fn(),
    };
    mockTelemetryRepo = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn(),
      prune: vi.fn(),
    };
  });

  afterEach(() => {
    process.env.TELEMETRY_LLM_ENABLED = originalEnv;
    vi.restoreAllMocks();
  });

  it('Escenario 1: Registro Exitoso de Orquestación LLM (INFO)', async () => {
    const mockRoute = new TacticalRoute('route-101', 'Ruta modernista por el Eixample', [
      new TacticalWaypoint('wp-1', 'Casa Batlló', 'Obra cumbre de Gaudí'),
      new TacticalWaypoint('wp-2', 'La Pedrera', 'Cantera de formas ondulantes'),
    ]);

    (mockAiPort.generateTacticalRoute as any).mockResolvedValue(mockRoute);

    const useCase = new GenerateTacticalRouteUseCase(mockAiPort, mockTelemetryRepo);
    const context: LlmEnvironmentContext = {
      localTime: '2026-09-22T16:00:00.000Z',
      weather: 'Despejado, 22°C',
    };

    const result = await useCase.execute({
      prompt: 'Quiero visitar arquitectura modernista en 2 horas',
      environment: context,
    });

    expect(result).toBe(mockRoute);
    expect(mockAiPort.generateTacticalRoute).toHaveBeenCalledWith(
      'Quiero visitar arquitectura modernista en 2 horas',
    );

    // Esperar microtask asíncrona de Fire-and-Forget
    await new Promise((r) => setTimeout(r, 10));

    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);
    const loggedEntry = (mockTelemetryRepo.log as any).mock.calls[0][0] as TelemetryEntry;
    expect(loggedEntry.level).toBe('INFO');
    expect(loggedEntry.context).toBe('LLM_ENGINE');
    expect(loggedEntry.statusCode).toBe(200);
    expect(loggedEntry.message).toContain('[LLM SUCCESS] Ruta forjada id: route-101');
    expect(loggedEntry.durationMs).toBeGreaterThanOrEqual(0);
    expect(loggedEntry.payload).toMatchObject({
      routeId: 'route-101',
      waypointsCount: 2,
      environmentVariables: context,
      request: {
        prompt: 'Quiero visitar arquitectura modernista en 2 horas',
        promptLength: 'Quiero visitar arquitectura modernista en 2 horas'.length,
        environmentVariables: context,
      },
      response: {
        id: 'route-101',
        summary: 'Ruta modernista por el Eixample',
        waypointsCount: 2,
        waypoints: [
          expect.objectContaining({
            id: 'wp-1',
            title: 'Casa Batlló',
            description: 'Obra cumbre de Gaudí',
          }),
          expect.objectContaining({
            id: 'wp-2',
            title: 'La Pedrera',
            description: 'Cantera de formas ondulantes',
          }),
        ],
      },
    });
  });

  it('Escenario 2: Captura de Fricción Cognitiva "No se pudo forjar la ruta" (WARN)', async () => {
    const claudicatedRoute = new TacticalRoute(
      'route-failed',
      'No se pudo forjar la ruta.',
      [],
    );

    (mockAiPort.generateTacticalRoute as any).mockResolvedValue(claudicatedRoute);

    const useCase = new GenerateTacticalRouteUseCase(mockAiPort, mockTelemetryRepo);
    const context: LlmEnvironmentContext = {
      localTime: '2026-09-22T16:30:00.000Z',
      weather: 'Tormenta eléctrica',
      constraints: ['visitar 15 museos en 10 minutos'],
    };

    const result = await useCase.execute({
      prompt: 'Quiero visitar 15 museos en 10 minutos a pie',
      environment: context,
    });

    expect(result).toBe('No se pudo forjar la ruta.');

    await new Promise((r) => setTimeout(r, 10));

    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);
    const loggedEntry = (mockTelemetryRepo.log as any).mock.calls[0][0] as TelemetryEntry;
    expect(loggedEntry.level).toBe('WARN');
    expect(loggedEntry.context).toBe('LLM_ENGINE');
    expect(loggedEntry.statusCode).toBe(422);
    expect(loggedEntry.message).toContain('[LLM WARN] Fricción cognitiva: No se pudo forjar la ruta.');
    
    // Verificación de invariante forense: environmentVariables NO es undefined
    expect(loggedEntry.payload).toBeDefined();
    expect((loggedEntry.payload as any).reason).toBe('NO_ROUTE_FORGED');
    expect((loggedEntry.payload as any).environmentVariables).toEqual(context);
    expect((loggedEntry.payload as any).request).toEqual({
      prompt: 'Quiero visitar 15 museos en 10 minutos a pie',
      promptLength: 'Quiero visitar 15 museos en 10 minutos a pie'.length,
      environmentVariables: context,
    });
    expect((loggedEntry.payload as any).response).toMatchObject({
      status: 'CLAUDICATION',
      message: 'No se pudo forjar la ruta.',
    });
  });

  it('Escenario 2b: Intercepción de excepción con "No se pudo forjar la ruta." como WARN', async () => {
    (mockAiPort.generateTacticalRoute as any).mockRejectedValue(
      new Error('El modelo claudicó: No se pudo forjar la ruta.'),
    );

    const useCase = new GenerateTacticalRouteUseCase(mockAiPort, mockTelemetryRepo);
    const context: LlmEnvironmentContext = {
      localTime: '2026-09-22T17:00:00.000Z',
      userLocation: { lat: 41.3851, lng: 2.1734 },
    };

    const result = await useCase.execute({
      prompt: 'Ruta imposible',
      environment: context,
    });

    expect(result).toBe('No se pudo forjar la ruta.');

    await new Promise((r) => setTimeout(r, 10));

    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);
    const loggedEntry = (mockTelemetryRepo.log as any).mock.calls[0][0] as TelemetryEntry;
    expect(loggedEntry.level).toBe('WARN');
    expect(loggedEntry.context).toBe('LLM_ENGINE');
    expect(loggedEntry.statusCode).toBe(422);
    expect((loggedEntry.payload as any).environmentVariables).toEqual(context);
    expect((loggedEntry.payload as any).request).toEqual({
      prompt: 'Ruta imposible',
      promptLength: 'Ruta imposible'.length,
      environmentVariables: context,
    });
    expect((loggedEntry.payload as any).response).toMatchObject({
      status: 'CLAUDICATION',
      message: 'No se pudo forjar la ruta.',
    });
  });

  it('Escenario 3: Resiliencia ante Fallos de Red Periféricos o Cuota Excedida (ERROR)', async () => {
    const quotaError = new Error('429 RESOURCE_EXHAUSTED: Quota exceeded for Gemini API');
    (mockAiPort.generateTacticalRoute as any).mockRejectedValue(quotaError);

    const useCase = new GenerateTacticalRouteUseCase(mockAiPort, mockTelemetryRepo);
    const context: LlmEnvironmentContext = {
      localTime: '2026-09-22T17:15:00.000Z',
    };

    await expect(
      useCase.execute({
        prompt: 'Ruta nocturna',
        environment: context,
      }),
    ).rejects.toThrow('429 RESOURCE_EXHAUSTED');

    await new Promise((r) => setTimeout(r, 10));

    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);
    const loggedEntry = (mockTelemetryRepo.log as any).mock.calls[0][0] as TelemetryEntry;
    expect(loggedEntry.level).toBe('ERROR');
    expect(loggedEntry.context).toBe('LLM_ENGINE');
    expect(loggedEntry.statusCode).toBe(429);
    expect(loggedEntry.message).toContain('[LLM ERROR]');
    expect((loggedEntry.payload as any).request).toMatchObject({
      prompt: 'Ruta nocturna',
      environmentVariables: context,
    });
    expect((loggedEntry.payload as any).response).toMatchObject({
      statusCode: 429,
      error: expect.stringContaining('429 RESOURCE_EXHAUSTED'),
    });
  });

  it('Escenario 4: Supresión Térmica mediante Feature Flag (TELEMETRY_LLM_ENABLED=false)', async () => {
    process.env.TELEMETRY_LLM_ENABLED = 'false';

    const mockRoute = new TacticalRoute('route-debug-off', 'Ruta rápida', [
      new TacticalWaypoint('wp-1', 'Parc de la Ciutadella', 'Paseo verde'),
    ]);
    (mockAiPort.generateTacticalRoute as any).mockResolvedValue(mockRoute);

    const useCase = new GenerateTacticalRouteUseCase(mockAiPort, mockTelemetryRepo);
    const result = await useCase.execute({
      prompt: 'Paseo corto',
    });

    expect(result).toBe(mockRoute);

    await new Promise((r) => setTimeout(r, 10));

    // Consumo cero de MySQL
    expect(mockTelemetryRepo.log).not.toHaveBeenCalled();
  });

  it('Escenario 5: Fricción Cero y Fail-Safe ante Caída de MySQL', async () => {
    const mockRoute = new TacticalRoute('route-safe', 'Ruta segura', [
      new TacticalWaypoint('wp-1', 'Montjuïc', 'Vistas panorámicas'),
    ]);
    (mockAiPort.generateTacticalRoute as any).mockResolvedValue(mockRoute);

    // Repositorio arroja fallo simulado de base de datos
    (mockTelemetryRepo.log as any).mockRejectedValue(new Error('MySQL Deadlock / Timeout'));

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const useCase = new GenerateTacticalRouteUseCase(mockAiPort, mockTelemetryRepo);
    const result = await useCase.execute({
      prompt: 'Subir a Montjuïc',
    });

    // La promesa del usuario no se interrumpe
    expect(result).toBe(mockRoute);

    await new Promise((r) => setTimeout(r, 10));

    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Telemetry LLM Fire-and-Forget Fallback]'),
      expect.any(Error),
    );
  });

  it('Escenario 6: Blindaje Estático de Tipos (Invariante de environmentVariables en WARN)', () => {
    // Verificación a nivel de TypeScript:
    // Un objeto LlmWarningTelemetryPayload no compila si environmentVariables falta
    const context: LlmEnvironmentContext = {
      localTime: '2026-09-22T17:30:00.000Z',
      weather: 'Lluvia ligera',
    };

    const validWarningPayload: LlmWarningTelemetryPayload = {
      model: 'gemini-1.5-flash',
      prompt: 'Ruta imposible',
      promptLength: 14,
      reason: 'NO_ROUTE_FORGED',
      environmentVariables: context, // Válido
      request: {
        prompt: 'Ruta imposible',
        promptLength: 14,
        environmentVariables: context,
      },
      response: {
        status: 'CLAUDICATION',
        message: 'No se pudo forjar la ruta.',
      },
    };

    const validEvent: LlmTelemetryEvent = {
      level: 'WARN',
      context: 'LLM_ENGINE',
      message: '[LLM WARN] Fricción cognitiva: No se pudo forjar la ruta.',
      statusCode: 422,
      durationMs: 850,
      payload: validWarningPayload,
    };

    expect(validEvent.level).toBe('WARN');
    expect(validEvent.payload.environmentVariables).toBeDefined();
    expect(validEvent.payload.environmentVariables.weather).toBe('Lluvia ligera');
    expect(validEvent.payload.request.environmentVariables.weather).toBe('Lluvia ligera');
    expect(validEvent.payload.response.status).toBe('CLAUDICATION');
  });

  it('Escenario 8: Resiliencia del Escudo Zod ante recommendations como string unitario o array', () => {
    // Caso 1: El LLM devuelve recommendations como string plano
    const rawDataWithStringRec = {
      id: 'test-1',
      summary: 'Ruta romántica',
      waypoints: [
        {
          id: 'wp-1',
          title: 'Mirador de Colom',
          description: 'Vistas al puerto',
          recommendations: 'Llegar al atardecer para fotos',
        },
      ],
    };

    const parsed = TacticalRouteZodSchema.parse(rawDataWithStringRec);
    expect(parsed.waypoints[0].recommendations).toEqual(['Llegar al atardecer para fotos']);

    // Caso 2: El LLM devuelve recommendations como array estándar
    const rawDataWithArrayRec = {
      id: 'test-2',
      summary: 'Ruta gastronómica',
      waypoints: [
        {
          id: 'wp-2',
          title: 'El Born',
          description: 'Tapas variadas',
          recommendations: ['Pedir vermut', 'Reservar mesa'],
        },
      ],
    };

    const parsedArray = TacticalRouteZodSchema.parse(rawDataWithArrayRec);
    expect(parsedArray.waypoints[0].recommendations).toEqual(['Pedir vermut', 'Reservar mesa']);
  });
});
