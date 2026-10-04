import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { GenerateTacticalRouteUseCase } from './generate-tactical-route.use-case';
import { AiGeneratorPort } from '@/features/ai-engine';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { TacticalRoute, TacticalWaypoint } from '@/features/planner';
import { TacticalRouteZodSchema } from '@/features/planner';
import { TelemetryEntry } from '@/features/telemetry';
import {
  LlmEnvironmentContext,
  LlmWarningTelemetryPayload,
  LlmTelemetryEvent,
} from '@/features/telemetry';
import { createSuccessEnvelope, createErrorEnvelope } from '@/shared/operation-envelope';

interface MockAiPort extends AiGeneratorPort {
  generateTacticalRoute: Mock<(prompt: string) => Promise<TacticalRoute>>;
}

interface MockTelemetryRepo extends TelemetryRepositoryPort {
  log: Mock<(entry: TelemetryEntry) => Promise<void>>;
  getRecentLogs: Mock<TelemetryRepositoryPort['getRecentLogs']>;
  prune: Mock<TelemetryRepositoryPort['prune']>;
}

describe('GenerateTacticalRouteUseCase (Aduana Cognitiva del Motor LLM)', () => {
  let mockAiPort: MockAiPort;
  let mockTelemetryRepo: MockTelemetryRepo;
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

    mockAiPort.generateTacticalRoute.mockResolvedValue(mockRoute);

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
    const loggedEntry = mockTelemetryRepo.log.mock.calls[0][0] as TelemetryEntry;
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

    mockAiPort.generateTacticalRoute.mockResolvedValue(claudicatedRoute);

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
    const loggedEntry = mockTelemetryRepo.log.mock.calls[0][0] as TelemetryEntry;
    expect(loggedEntry.level).toBe('WARN');
    expect(loggedEntry.context).toBe('LLM_ENGINE');
    expect(loggedEntry.statusCode).toBe(422);
    expect(loggedEntry.message).toContain('[LLM WARN] Fricción cognitiva: No se pudo forjar la ruta.');
    
    // Verificación de invariante forense: environmentVariables NO es undefined
    expect(loggedEntry.payload).toBeDefined();
    const payload = loggedEntry.payload as Record<string, unknown>;
    expect(payload.reason).toBe('NO_ROUTE_FORGED');
    expect(payload.environmentVariables).toEqual(context);
    expect(payload.request).toEqual({
      prompt: 'Quiero visitar 15 museos en 10 minutos a pie',
      promptLength: 'Quiero visitar 15 museos en 10 minutos a pie'.length,
      environmentVariables: context,
    });
    expect(payload.response).toMatchObject({
      status: 'CLAUDICATION',
      message: 'No se pudo forjar la ruta.',
    });
  });

  it('Escenario 2b: Intercepción de excepción con "No se pudo forjar la ruta." como WARN', async () => {
    mockAiPort.generateTacticalRoute.mockRejectedValue(
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
    const loggedEntry = mockTelemetryRepo.log.mock.calls[0][0] as TelemetryEntry;
    expect(loggedEntry.level).toBe('WARN');
    expect(loggedEntry.context).toBe('LLM_ENGINE');
    expect(loggedEntry.statusCode).toBe(422);
    const payload2b = loggedEntry.payload as Record<string, unknown>;
    expect(payload2b.environmentVariables).toEqual(context);
    expect(payload2b.request).toEqual({
      prompt: 'Ruta imposible',
      promptLength: 'Ruta imposible'.length,
      environmentVariables: context,
    });
    expect(payload2b.response).toMatchObject({
      status: 'CLAUDICATION',
      message: 'No se pudo forjar la ruta.',
    });
  });

  it('Escenario 3: Resiliencia ante Fallos de Red Periféricos o Cuota Excedida (ERROR)', async () => {
    const quotaError = new Error('429 RESOURCE_EXHAUSTED: Quota exceeded for Gemini API');
    mockAiPort.generateTacticalRoute.mockRejectedValue(quotaError);

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
    const loggedEntry = mockTelemetryRepo.log.mock.calls[0][0] as TelemetryEntry;
    expect(loggedEntry.level).toBe('ERROR');
    expect(loggedEntry.context).toBe('LLM_ENGINE');
    expect(loggedEntry.statusCode).toBe(429);
    expect(loggedEntry.message).toContain('[LLM ERROR]');
    const payload3 = loggedEntry.payload as Record<string, unknown>;
    expect(payload3.request).toMatchObject({
      prompt: 'Ruta nocturna',
      environmentVariables: context,
    });
    expect(payload3.response).toMatchObject({
      statusCode: 429,
      error: expect.stringContaining('429 RESOURCE_EXHAUSTED'),
    });
  });

  it('Escenario 4: Supresión Térmica mediante Feature Flag (TELEMETRY_LLM_ENABLED=false)', async () => {
    process.env.TELEMETRY_LLM_ENABLED = 'false';

    const mockRoute = new TacticalRoute('route-debug-off', 'Ruta rápida', [
      new TacticalWaypoint('wp-1', 'Parc de la Ciutadella', 'Paseo verde'),
    ]);
    mockAiPort.generateTacticalRoute.mockResolvedValue(mockRoute);

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
    mockAiPort.generateTacticalRoute.mockResolvedValue(mockRoute);

    // Repositorio arroja fallo simulado de base de datos
    mockTelemetryRepo.log.mockRejectedValue(new Error('MySQL Deadlock / Timeout'));

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

  describe('PBI-CTX-011: Recuperación RAG de Contexto Hiperlocal', () => {
    const mockRoute = new TacticalRoute('route-ctx-1', 'Ruta contextualizada', [
      new TacticalWaypoint('wp-ctx-1', 'Plaça del Sol', 'Concierto en vivo'),
    ]);

    const dummyContextEntry = {
      id: 'socrata:event-1',
      sourceTag: 'socrata',
      category: 'EVENT' as const,
      title: 'Festival de Música al Carrer',
      summary: 'Actuaciones gratuitas en las plazas de Gràcia.',
      startsAt: '2026-10-15T18:00:00.000Z',
      expiresAt: '2026-10-16T00:00:00.000Z',
      location: { name: 'Plaça del Sol' },
      url: 'https://ajuntament.barcelona.cat/agenda',
      contentHash: 'd'.repeat(64),
      tags: ['música'],
    };

    it('CA-2 & CA-5: Inyecta bloque compacto de contexto y registra injectedContextIds en telemetría', async () => {
      mockAiPort.generateTacticalRoute.mockResolvedValue(mockRoute);

      const mockEmbeddingPort = {
        generateEmbedding: vi.fn().mockResolvedValue(
          createSuccessEnvelope<number[]>([0.1, 0.2]),
        ),
        getDimensions: vi.fn().mockReturnValue(768),
      };

      const mockRetrievalPort = {
        search: vi.fn().mockResolvedValue({
          success: true,
          exitCode: 0,
          result: [dummyContextEntry],
        }),
      };

      const useCase = new GenerateTacticalRouteUseCase(
        mockAiPort,
        mockTelemetryRepo,
        mockRetrievalPort,
        mockEmbeddingPort
      );

      const result = await useCase.execute({
        prompt: 'Ruta bohemia por Gràcia de noche',
      });

      expect(result).toBe(mockRoute);
      expect(mockAiPort.generateTacticalRoute).toHaveBeenCalledWith(
        expect.stringContaining('[CONTEXTO HIPERLOCAL VIGENTE EN BARCELONA]:')
      );
      expect(mockAiPort.generateTacticalRoute).toHaveBeenCalledWith(
        expect.stringContaining('Festival de Música al Carrer')
      );

      // CA-5: Trazabilidad en la telemetría
      expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'INFO',
          payload: expect.objectContaining({
            injectedContextIds: ['socrata:event-1'],
          }),
        })
      );
    });

    it('CA-3: Omite la búsqueda vectorial si el embedding no está disponible y emite WARN', async () => {
      mockAiPort.generateTacticalRoute.mockResolvedValue(mockRoute);

      const mockEmbeddingPort = {
        generateEmbedding: vi.fn().mockResolvedValue(
          createErrorEnvelope<number[]>(['Embedding no disponible'], 422),
        ),
        getDimensions: vi.fn().mockReturnValue(768),
      };

      const mockRetrievalPort = {
        search: vi.fn(),
      };

      const useCase = new GenerateTacticalRouteUseCase(
        mockAiPort,
        mockTelemetryRepo,
        mockRetrievalPort,
        mockEmbeddingPort
      );

      await useCase.execute({
        prompt: 'Ruta por la Barceloneta',
      });

      expect(mockRetrievalPort.search).not.toHaveBeenCalled();
      expect(mockAiPort.generateTacticalRoute).toHaveBeenCalledWith('Ruta por la Barceloneta');
      expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'WARN',
          message: expect.stringContaining('Embedding de consulta en modo fallback'),
        })
      );
    });

    it('CA-4: Opera en fail-soft si el puerto de recuperación falla (la ruta se genera igual)', async () => {
      mockAiPort.generateTacticalRoute.mockResolvedValue(mockRoute);

      const mockEmbeddingPort = {
        generateEmbedding: vi.fn().mockResolvedValue(
          createSuccessEnvelope<number[]>([0.1, 0.2]),
        ),
        getDimensions: vi.fn().mockReturnValue(768),
      };

      const mockRetrievalPort = {
        search: vi.fn().mockRejectedValue(new Error('LanceDB connection timeout')),
      };

      const useCase = new GenerateTacticalRouteUseCase(
        mockAiPort,
        mockTelemetryRepo,
        mockRetrievalPort,
        mockEmbeddingPort
      );

      const result = await useCase.execute({
        prompt: 'Ruta arquitectónica por el Born',
      });

      expect(result).toBe(mockRoute);
      expect(mockAiPort.generateTacticalRoute).toHaveBeenCalledWith('Ruta arquitectónica por el Born');
      expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'WARN',
          message: expect.stringContaining('Excepción en contextRetrievalPort'),
        })
      );
    });

    it('PBI-ARCH-JEV-006 CA-4: GenerateTacticalRouteUseCase no invoca evaluateNoul ni evaluateChoice', () => {
      const useCase = new GenerateTacticalRouteUseCase(mockAiPort, mockTelemetryRepo);
      expect('decisionEngine' in useCase).toBe(false);
      expect('evaluateNoul' in mockAiPort).toBe(false);
      expect('evaluateChoice' in mockAiPort).toBe(false);
    });
  });
});

