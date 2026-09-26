import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TriageInputSchema, TriageOutcomeDtoSchema } from './triage.schema';
import { TriageOutcome } from './triage-outcome.vo';
import { TriageInputUseCase } from './triage-input.use-case';
import { ITypedDecisionEngine, IConversationalSLMPort } from '@/features/ai-engine';
import {
  DensityMatrixRepositoryPort,
  GenerateTacticalRouteUseCase,
  TacticalRoute,
  TacticalWaypoint,
  TimeSpan,
  ItineraryPersistencePort,
} from '@/features/planner';

describe('Feature Triage (Vertical Slicing - Protocolo de Acero S+)', () => {
  it('debe validar la estructura de entrada de TriageInputSchema localmente', () => {
    const input = TriageInputSchema.parse({
      sessionId: 'sess-vertical-1',
      prompt: 'Quiero ver arquitectura modernista en el Eixample',
    });
    expect(input.sessionId).toBe('sess-vertical-1');
    expect(input.matrixId).toBe('default');
  });

  it('debe crear un TriageOutcome DISPATCH_READY y convertirlo a DTO', () => {
    const outcome = TriageOutcome.createDispatchReady({
      sessionId: 'sess-vertical-1',
      matrixId: 'default',
      score: 80,
      survivalThreshold: 60,
      payload: {
        time_window: '3 horas',
        vibe: 'modernismo',
        constraints: [],
        districts: [],
      },
      durationMs: 15,
    });

    expect(outcome.status).toBe('DISPATCH_READY');
    expect(outcome.isThresholdSatisfied).toBe(true);
    const dto = outcome.toDto();
    expect(TriageOutcomeDtoSchema.parse(dto)).toBeDefined();
  });

  it('debe crear un TriageOutcome CASUAL_DIALOGUE y convertirlo a DTO', () => {
    const outcome = TriageOutcome.createCasualDialogue({
      sessionId: 'sess-casual-1',
      matrixId: 'default',
      dialogueMessage: 'Descansa un rato en una terraza tranquila de Gràcia.',
      durationMs: 10,
    });

    expect(outcome.status).toBe('CASUAL_DIALOGUE');
    expect(outcome.isThresholdSatisfied).toBe(false);
    expect(outcome.dialogueMessage).toBe('Descansa un rato en una terraza tranquila de Gràcia.');
    const dto = outcome.toDto();
    expect(TriageOutcomeDtoSchema.parse(dto)).toBeDefined();
  });

  it('debe validar y tipar el enum mood en la frontera de entrada de la feature', async () => {
    const { MoodSchema } = await import('./triage.schema');
    expect(MoodSchema.parse('relaxed')).toBe('relaxed');
    expect(MoodSchema.parse('adventurous')).toBe('adventurous');
    expect(MoodSchema.parse('cultural')).toBe('cultural');
    expect(MoodSchema.parse('gastronomic')).toBe('gastronomic');
    expect(() => MoodSchema.parse('chaotic')).toThrow();
  });

  it('debe admitir el campo mood en TriageInputSchema y participar con peso 10 en la Matriz de Densidad', async () => {
    const { calculateMatrixDensity, DefaultDensityPayloadSchema } = await import('@/features/planner');
    const input = TriageInputSchema.parse({
      sessionId: 'sess-mood-vertical',
      prompt: 'Exploración relajada',
      mood: 'relaxed',
    });
    expect(input.mood).toBe('relaxed');

    const payload = DefaultDensityPayloadSchema.parse({
      time_window: '2 horas',
      mood: input.mood,
    });
    const density = calculateMatrixDensity('default', payload);
    expect(density.score).toBe(70);
    expect(density.isThresholdSatisfied).toBe(true);
    expect(density.presentVariables).toContain('mood');
  });

  describe('TriageInputUseCase Flujo de Orquestación Híbrida (CA-1 a CA-4)', () => {
    let mockDecisionEngine: ITypedDecisionEngine;
    let mockConversationalSlm: IConversationalSLMPort;
    let mockMatrixRepo: DensityMatrixRepositoryPort;
    let mockRouteUseCase: GenerateTacticalRouteUseCase;
    let mockItineraryRepo: ItineraryPersistencePort;
    let useCase: TriageInputUseCase;

    beforeEach(() => {
      mockDecisionEngine = {
        evaluateHealth: vi.fn(),
        evaluateNoul: vi.fn().mockResolvedValue({ probability: 0.1, isAffirmative: false }),
        evaluateChoice: vi.fn(),
      };

      mockConversationalSlm = {
        generateBounceMessage: vi.fn().mockResolvedValue('Rebote fuera de perímetro.'),
        generateRepromptMessage: vi.fn().mockResolvedValue('¿Cuántas horas tienes disponibles?'),
        generateEmpatheticDialogue: vi.fn().mockResolvedValue('Barcelona puede agotar; tómate un café.'),
      };

      mockMatrixRepo = {
        getMatrixPayload: vi.fn().mockResolvedValue({}),
        saveMatrixPayload: vi.fn().mockResolvedValue(undefined),
        clearMatrixPayload: vi.fn().mockResolvedValue(undefined),
      };

      const mockRoute = new TacticalRoute('r-1', 'Ruta Sagrada Familia & Tapas', [
        new TacticalWaypoint(
          'wp-1',
          'Sagrada Familia',
          'Templo expiatorio',
          undefined,
          new TimeSpan('10:00', '12:00'),
        ),
      ]);

      mockRouteUseCase = {
        execute: vi.fn().mockResolvedValue(mockRoute),
      } as unknown as GenerateTacticalRouteUseCase;

      mockItineraryRepo = {
        saveItinerary: vi.fn().mockResolvedValue({
          id: 'itin-1',
          sessionId: 's-1',
          summary: 'Ruta',
          status: 'ACTIVE',
          waypoints: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        getItineraryBySessionId: vi.fn(),
        updateNodeSelection: vi.fn(),
        updateNodeTime: vi.fn(),
      };

      useCase = new TriageInputUseCase(
        mockDecisionEngine,
        mockConversationalSlm,
        mockMatrixRepo,
        mockRouteUseCase,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        mockItineraryRepo,
      );
    });

    it('CA-1: debe clasificar un mensaje casual como CASUAL_DIALOGUE y responder con empatía sin alterar la matriz', async () => {
      const result = await useCase.execute({
        sessionId: 'sess-casual-user',
        prompt: 'Uf, estoy agotado',
      });

      expect(result.status).toBe('CASUAL_DIALOGUE');
      expect(result.dialogueMessage).toBe('Barcelona puede agotar; tómate un café.');
      expect(mockConversationalSlm.generateEmpatheticDialogue).toHaveBeenCalledWith(
        'Uf, estoy agotado',
        expect.any(String),
      );
      // No debe haber guardado ni borrado matriz de sesión
      expect(mockMatrixRepo.saveMatrixPayload).not.toHaveBeenCalled();
      expect(mockMatrixRepo.clearMatrixPayload).not.toHaveBeenCalled();
      expect(mockRouteUseCase.execute).not.toHaveBeenCalled();
    });

    it('CA-2: debe requerir repregunta si falta el tiempo y la densidad es inferior al 60%', async () => {
      const result = await useCase.execute({
        sessionId: 'sess-logistics-incomplete',
        prompt: 'Quiero comer tapas con 2 amigos', // vibe (15) + group_size (15) = 30 < 60
      });

      expect(result.status).toBe('INCOMPLETE_REPROMPT');
      expect(result.score).toBe(30);
      expect(result.isThresholdSatisfied).toBe(false);
      expect(result.missingVariable).toBe('time_window');
      expect(mockMatrixRepo.saveMatrixPayload).toHaveBeenCalled();
      expect(mockRouteUseCase.execute).not.toHaveBeenCalled();
    });

    it('CA-3 & CA-4: debe disparar el LLM pesado al superar el 60%, enriquecer con afiliados y persistir en MySQL', async () => {
      const result = await useCase.execute({
        sessionId: 'sess-logistics-complete',
        prompt: 'Tengo 3 horas para ver la Sagrada Familia en pareja', // time_window (60) + group_size (15) = 75 >= 60
      });

      expect(result.status).toBe('DISPATCH_READY');
      expect(result.isThresholdSatisfied).toBe(true);
      expect(mockRouteUseCase.execute).toHaveBeenCalled();
      expect(mockItineraryRepo.saveItinerary).toHaveBeenCalledWith(
        'sess-logistics-complete',
        expect.objectContaining({
          waypoints: expect.arrayContaining([
            expect.objectContaining({
              affiliateProvider: 'CIVITATIS',
            }),
          ]),
        }),
      );
      expect(mockMatrixRepo.clearMatrixPayload).toHaveBeenCalledWith(
        'sess-logistics-complete',
        'default',
      );
    });
  });
});
