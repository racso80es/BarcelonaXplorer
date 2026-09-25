import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TriageInputUseCase } from '@/application/use-cases/triage-input.use-case';
import { ITypedDecisionEngine } from '@/features/ai-engine';
import { IConversationalSLMPort } from '@/features/ai-engine';
import { DensityMatrixRepositoryPort } from '@/application/ports/out/density-matrix-repository.port';
import { InMemoryDensityMatrixRepository } from '@/infrastructure/repositories/in-memory-density-matrix.repository';
import { GenerateTacticalRouteUseCase } from '@/application/use-cases/generate-tactical-route.use-case';
import { TelemetryRepositoryPort } from '@/features/telemetry';

describe('TriageInputUseCase (HU-CORE-TRIAGE-002: Orquestación del Triaje Entrópico - Laudos 1 y 2)', () => {
  let mockDecisionEngine: ITypedDecisionEngine;
  let mockConversationalSlm: IConversationalSLMPort;
  let matrixRepo: DensityMatrixRepositoryPort;
  let mockRouteUseCase: GenerateTacticalRouteUseCase;
  let mockTelemetryRepo: TelemetryRepositoryPort;

  beforeEach(() => {
    InMemoryDensityMatrixRepository.clearAll();
    matrixRepo = new InMemoryDensityMatrixRepository();

    mockDecisionEngine = {
      evaluateHealth: vi.fn(),
      evaluateNoul: vi.fn().mockImplementation(async (_state, instruction) => {
        if (instruction.includes('fuera')) {
          return { probability: 0.05, isAffirmative: false };
        }
        if (instruction.includes('tiempo') || instruction.includes('horas')) {
          return { probability: 0.1, isAffirmative: false };
        }
        return { probability: 0.5, isAffirmative: false };
      }),
      evaluateChoice: vi.fn().mockResolvedValue({
        selectedChoice: 'time_window',
        confidence: 0.9,
        probabilities: { time_window: 0.9 },
      }),
    };

    mockConversationalSlm = {
      generateBounceMessage: vi
        .fn()
        .mockResolvedValue('Radar exclusivo de Barcelona. Si vienes a la capital, cuenta con nosotros.'),
      generateRepromptMessage: vi
        .fn()
        .mockResolvedValue('¡Planazo! ¿De cuántas horas dispones para forjar la ruta?'),
    };

    mockRouteUseCase = {
      execute: vi.fn().mockResolvedValue({
        id: 'route-test-123',
        summary: 'Ruta Táctica por el Gótico',
        waypoints: [],
      }),
    } as unknown as GenerateTacticalRouteUseCase;

    mockTelemetryRepo = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };
  });

  it('TC-TRIAGE-06: Prompt fuera de perímetro (Girona) aborta inmediatamente con REBOUND_OUT_OF_SCOPE', async () => {
    const useCase = new TriageInputUseCase(
      mockDecisionEngine,
      mockConversationalSlm,
      matrixRepo,
      mockRouteUseCase,
      mockTelemetryRepo,
    );

    const outcome = await useCase.execute({
      sessionId: 'test-session-uuid-1',
      prompt: 'Recomiéndame los tres mejores restaurantes en Girona para cenar',
      matrixId: 'default',
    });

    expect(outcome.status).toBe('REBOUND_OUT_OF_SCOPE');
    expect(outcome.isThresholdSatisfied).toBe(false);
    expect(outcome.bounceMessage).toContain('Radar exclusivo de Barcelona');
    expect(outcome.rejectedEntity).toBe('Girona');
    expect(mockConversationalSlm.generateBounceMessage).toHaveBeenCalledWith(
      'Girona',
      expect.any(String),
    );
    expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'WARN',
        context: 'SECURITY_PERIMETER',
      }),
    );
  });

  it('TC-TRIAGE-07: Prompt en Barcelona sin tiempo activa repregunta y persiste estado previo en backend (Laudo 2)', async () => {
    const useCase = new TriageInputUseCase(
      mockDecisionEngine,
      mockConversationalSlm,
      matrixRepo,
      mockRouteUseCase,
      mockTelemetryRepo,
    );

    const outcome = await useCase.execute({
      sessionId: 'test-session-uuid-2',
      prompt: 'Quiero ver arquitectura modernista y tapas con amigos',
      matrixId: 'default',
    });

    expect(outcome.status).toBe('INCOMPLETE_REPROMPT');
    expect(outcome.isThresholdSatisfied).toBe(false);
    expect(outcome.missingVariable).toBe('time_window');
    expect(outcome.score).toBe(15); // vibe = modernismo
    expect(outcome.repromptMessage).toContain('horas dispones');

    // Laudo 2: Verificar que el estado parcial se guardó en el repositorio del backend
    const saved = await matrixRepo.getMatrixPayload('test-session-uuid-2', 'default');
    expect(saved).toBeDefined();
    expect(saved?.vibe).toBe('modernista');
  });

  it('TC-TRIAGE-08: Prompt completo despacha internamente a Gemini y limpia la sesión (Laudo 1 & 2)', async () => {
    const useCase = new TriageInputUseCase(
      mockDecisionEngine,
      mockConversationalSlm,
      matrixRepo,
      mockRouteUseCase,
      mockTelemetryRepo,
    );

    const outcome = await useCase.execute({
      sessionId: 'test-session-uuid-3',
      prompt: 'Ruta de 4 horas por el Gótico para 2 personas buscando tapas',
      matrixId: 'default',
    });

    expect(outcome.status).toBe('DISPATCH_READY');
    expect(outcome.isThresholdSatisfied).toBe(true);
    expect(outcome.score).toBeGreaterThanOrEqual(60);
    expect(outcome.payload).toBeDefined();
    expect(outcome.payload?.group_size).toBe(2);
    expect(outcome.payload?.time_window).toBeDefined();

    // Laudo 1: Verificar que se despachó internamente al orquestador pesado
    expect(mockRouteUseCase.execute).toHaveBeenCalledTimes(1);
    expect(outcome.route).toBeDefined();

    // Laudo 2: La sesión se limpia tras despachar
    const cleaned = await matrixRepo.getMatrixPayload('test-session-uuid-3', 'default');
    expect(cleaned).toBeNull();
  });

  it('TC-TRIAGE-09: Activa política Fail-Soft Assume-Barcelona-Default si Jev AI falla por corte de red', async () => {
    vi.mocked(mockDecisionEngine.evaluateNoul).mockRejectedValueOnce(
      new Error('Connection timed out to Jev gateway'),
    );

    const useCase = new TriageInputUseCase(
      mockDecisionEngine,
      mockConversationalSlm,
      matrixRepo,
      mockRouteUseCase,
      mockTelemetryRepo,
    );

    const outcome = await useCase.execute({
      sessionId: 'test-session-uuid-4',
      prompt: 'Ruta de 3 horas por la playa',
      matrixId: 'default',
    });

    // No debe lanzar 500, sino asumir Barcelona y continuar evaluando la matriz
    expect(outcome.status).toBe('DISPATCH_READY');
    expect(outcome.isThresholdSatisfied).toBe(true);
    expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'WARN',
        context: 'SECURITY_PERIMETER',
        message: expect.stringContaining('[Aduana Jev Fall-Soft]'),
      }),
    );
  });

  it('Turno multivuelta (Laudo 2): Recupera estado previo del backend y despacha al completar umbral', async () => {
    // Simular que en el turno 1 el backend ya guardó vibe y group_size (30%)
    await matrixRepo.saveMatrixPayload('test-multiturn-session', 'default', {
      vibe: 'gastronomía',
      group_size: 4,
    });

    const useCase = new TriageInputUseCase(
      mockDecisionEngine,
      mockConversationalSlm,
      matrixRepo,
      mockRouteUseCase,
      mockTelemetryRepo,
    );

    // En el turno 2, el cliente SOLO envía prompt y sessionId (CERO estado acumulado en DTO)
    const outcome = await useCase.execute({
      sessionId: 'test-multiturn-session',
      prompt: 'Tenemos 4 horas libres esta tarde',
      matrixId: 'default',
    });

    expect(outcome.status).toBe('DISPATCH_READY');
    expect(outcome.score).toBe(90); // 60 (time) + 15 (group) + 15 (vibe) = 90%
    expect(outcome.payload?.vibe).toBe('gastronomía');
    expect(outcome.payload?.group_size).toBe(4);
    expect(outcome.payload?.time_window).toBeDefined();

    // Verificación de despacho interno
    expect(mockRouteUseCase.execute).toHaveBeenCalledTimes(1);
    expect(outcome.route).toBeDefined();
  });

  describe('Anclaje Perimetral Barcelona y Localización (HU-PERIM-GEO-001 & HU-CORE-TRIAGE-002)', () => {
    it('Detecta distritos canónicos de Barcelona e inyecta en matriz y prompt enriquecido', async () => {
      const useCase = new TriageInputUseCase(
        mockDecisionEngine,
        mockConversationalSlm,
        matrixRepo,
        mockRouteUseCase,
        mockTelemetryRepo,
      );

      const outcome = await useCase.execute({
        sessionId: 'test-district-session',
        prompt: 'Ruta de 3 horas por Gràcia buscando tapas para 2 personas',
        matrixId: 'default',
      });

      expect(outcome.status).toBe('DISPATCH_READY');
      expect(outcome.detectedDistricts).toContain('Gràcia');
      expect(outcome.payload?.districts).toContain('Gràcia');
      expect(mockRouteUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('[Geo: Barcelona | Distritos: Gràcia]'),
        }),
      );
    });

    it('Tolera nodos logísticos periurbanos autorizados (Aeropuerto de El Prat)', async () => {
      const useCase = new TriageInputUseCase(
        mockDecisionEngine,
        mockConversationalSlm,
        matrixRepo,
        mockRouteUseCase,
        mockTelemetryRepo,
      );

      const outcome = await useCase.execute({
        sessionId: 'test-periurban-session',
        prompt: 'Llego al Aeropuerto de El Prat y tengo 2 horas libres solo',
        matrixId: 'default',
      });

      expect(outcome.status).toBe('DISPATCH_READY');
      expect(outcome.detectedDistricts).toContain('Aeropuerto de El Prat');
      expect(mockRouteUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('Aeropuerto de El Prat'),
        }),
      );
    });

    it('Valida GPS dentro del Bounding Box de Barcelona e inyecta coordenadas en prompt', async () => {
      const useCase = new TriageInputUseCase(
        mockDecisionEngine,
        mockConversationalSlm,
        matrixRepo,
        mockRouteUseCase,
        mockTelemetryRepo,
      );

      const outcome = await useCase.execute({
        sessionId: 'test-gps-in-session',
        prompt: 'Ruta de 2 horas para 1 persona buscando café',
        matrixId: 'default',
        userLocation: {
          lat: 41.3851, // Plaça Catalunya (dentro de Bounding Box)
          lng: 2.1734,
        },
      });

      expect(outcome.status).toBe('DISPATCH_READY');
      expect(mockRouteUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('| GPS: 41.3851,2.1734'),
        }),
      );
    });

    it('Rebota petición con GPS fuera de Bounding Box si el prompt es genérico', async () => {
      const useCase = new TriageInputUseCase(
        mockDecisionEngine,
        mockConversationalSlm,
        matrixRepo,
        mockRouteUseCase,
        mockTelemetryRepo,
      );

      const outcome = await useCase.execute({
        sessionId: 'test-gps-out-session',
        prompt: 'Quiero un café cerca en 1 hora',
        matrixId: 'default',
        userLocation: {
          lat: 40.4168, // Madrid (fuera de Bounding Box)
          lng: -3.7038,
        },
      });

      expect(outcome.status).toBe('REBOUND_OUT_OF_SCOPE');
      expect(outcome.rejectedEntity).toBe('Ubicación GPS fuera de perímetro');
      expect(mockConversationalSlm.generateBounceMessage).toHaveBeenCalledWith(
        'Ubicación GPS fuera de perímetro',
        expect.any(String),
      );
    });

    it('Permite planificación remota si GPS está fuera pero el prompt menciona Barcelona explícitamente', async () => {
      const useCase = new TriageInputUseCase(
        mockDecisionEngine,
        mockConversationalSlm,
        matrixRepo,
        mockRouteUseCase,
        mockTelemetryRepo,
      );

      const outcome = await useCase.execute({
        sessionId: 'test-gps-remote-session',
        prompt: 'Viajo a Barcelona el fin de semana, ruta de 4 horas para 2 personas',
        matrixId: 'default',
        userLocation: {
          lat: 40.4168, // Madrid
          lng: -3.7038,
        },
      });

      expect(outcome.status).toBe('DISPATCH_READY');
      expect(mockRouteUseCase.execute).toHaveBeenCalled();
    });

    it('TC-TRIAGE-16: Fricción Cero - Prompt implícito en Barcelona sin mención geográfica ("Dos parejas disponen del dia...") satura matriz y despacha a Gemini', async () => {
      const useCase = new TriageInputUseCase(
        mockDecisionEngine,
        mockConversationalSlm,
        matrixRepo,
        mockRouteUseCase,
        mockTelemetryRepo,
      );

      const outcome = await useCase.execute({
        sessionId: 'test-zero-friction-session',
        prompt: 'Dos parejas disponen del dia para disfrutar al máximo. Deportes, buena comida, espectáculos musicales y salas de fiesta',
        matrixId: 'default',
      });

      expect(outcome.status).toBe('DISPATCH_READY');
      expect(outcome.isThresholdSatisfied).toBe(true);
      expect(outcome.score).toBeGreaterThanOrEqual(60);
      expect(outcome.payload?.group_size).toBe(4);
      expect(outcome.payload?.time_window).toBeDefined();
      expect(outcome.payload?.vibe).toBeDefined();
      expect(outcome.geographicScope?.targetCity).toBe('Barcelona');
      expect(mockRouteUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('PBI-COG-MEM-005: Al superar el umbral, genera embedding y persiste la memoria cognitiva densa en LanceDB', async () => {
      const mockCognitiveMemory = {
        persistMemory: vi.fn().mockResolvedValue(undefined),
        getLatestSessionMemory: vi.fn().mockResolvedValue(null),
        searchSimilarMemories: vi.fn().mockResolvedValue([]),
        getRecentMemories: vi.fn().mockResolvedValue([]),
        clearSessionMemory: vi.fn().mockResolvedValue(undefined),
      };
      const mockEmbeddingPort = {
        generateEmbedding: vi.fn().mockResolvedValue(new Array(768).fill(0.01)),
        getDimensions: vi.fn().mockReturnValue(768),
      };

      const useCase = new TriageInputUseCase(
        mockDecisionEngine,
        mockConversationalSlm,
        matrixRepo,
        mockRouteUseCase,
        mockTelemetryRepo,
        undefined,
        mockCognitiveMemory,
        mockEmbeddingPort,
      );

      const outcome = await useCase.execute({
        sessionId: 'session-cog-persist',
        prompt: 'Vamos con 4 personas durante 3 horas para comer tapas en Gràcia',
        matrixId: 'default',
      });

      expect(outcome.status).toBe('DISPATCH_READY');
      expect(mockEmbeddingPort.generateEmbedding).toHaveBeenCalledWith(
        expect.stringContaining('Grupo: 4 personas'),
      );
      expect(mockCognitiveMemory.persistMemory).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            sessionId: 'session-cog-persist',
            groupSize: 4,
          }),
        }),
        expect.any(Array),
      );
    });

    it('PBI-COG-MEM-005: Recupera la memoria histórica previa desde LanceDB para refinamiento sin repreguntar', async () => {
      const { DenseSemanticMatrix } = await import('@/features/cognitive-memory');
      const priorMemory = DenseSemanticMatrix.create({
        sessionId: 'session-refine',
        matrixId: 'default',
        payload: {
          group_size: 4,
          vibe: 'cultural',
          districts: ['Eixample'],
        },
        score: 65,
        survivalThreshold: 60,
      });

      const mockCognitiveMemory = {
        persistMemory: vi.fn().mockResolvedValue(undefined),
        getLatestSessionMemory: vi.fn().mockResolvedValue(priorMemory),
        searchSimilarMemories: vi.fn().mockResolvedValue([]),
        getRecentMemories: vi.fn().mockResolvedValue([]),
        clearSessionMemory: vi.fn().mockResolvedValue(undefined),
      };
      const mockEmbeddingPort = {
        generateEmbedding: vi.fn().mockResolvedValue(new Array(768).fill(0.02)),
        getDimensions: vi.fn().mockReturnValue(768),
      };

      const useCase = new TriageInputUseCase(
        mockDecisionEngine,
        mockConversationalSlm,
        matrixRepo,
        mockRouteUseCase,
        mockTelemetryRepo,
        undefined,
        mockCognitiveMemory,
        mockEmbeddingPort,
      );

      // El usuario solo pide cambiar el plan aportando tiempo: "Durante 2 horas"
      const outcome = await useCase.execute({
        sessionId: 'session-refine',
        prompt: 'Tenemos 2 horas disponibles',
        matrixId: 'default',
      });

      expect(mockCognitiveMemory.getLatestSessionMemory).toHaveBeenCalledWith(
        'session-refine',
        'default',
      );
      expect(outcome.status).toBe('DISPATCH_READY');
      // Debe haber conservado el group_size: 4 de la memoria histórica previa
      expect(outcome.payload?.group_size).toBe(4);
    });
  });
});
