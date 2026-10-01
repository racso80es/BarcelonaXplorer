import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { TriageInputUseCase } from './triage-input.use-case';
import {
  LanceDbVectorAdapter,
  LanceDbCognitiveMemoryAdapter,
  resetLanceDbConnection,
} from '@/features/cognitive-memory/server';
import {
  ITypedDecisionEngine,
  IConversationalSLMPort,
  IEmbeddingPort,
  EmbeddingGenerationResult,
} from '@/features/ai-engine';
import {
  TacticalRoute,
  TacticalWaypoint,
  TimeSpan,
} from '@/features/planner';
import {
  InMemoryDensityMatrixRepository,
  GenerateTacticalRouteUseCase,
} from '@/features/planner/server';
import { TelemetryRepositoryPort, TelemetryEntry } from '@/features/telemetry';

/**
 * Stub determinista de EmbeddingPort sin dependencias de red ni claves remotas.
 * Permite alternar la fuente ('provider' vs 'fallback') y generar vectores
 * normalizados L2 predecibles para evaluar la búsqueda K-NN sobre LanceDB real.
 */
class DeterministicEmbeddingStub implements IEmbeddingPort {
  constructor(public source: 'provider' | 'fallback' = 'provider') {}

  async generateEmbedding(text: string): Promise<EmbeddingGenerationResult> {
    const isFoodOrGastro = /tapas|cenar|comer|gastronom/i.test(text);
    // Base 0.05 para contexto gastronómico, 0.01 para otros contextos
    const baseVal = isFoodOrGastro ? 0.05 : 0.01;
    const vector = new Array(768).fill(baseVal);

    // L2 normalization determinista
    const sumSq = vector.reduce((acc, val) => acc + val * val, 0);
    const norm = Math.sqrt(sumSq) || 1;
    const normalized = vector.map((val) => val / norm);

    return {
      vector: normalized,
      source: this.source,
    };
  }

  getDimensions(): number {
    return 768;
  }
}

describe('TriageMemoryIntegrationTest (PBI-MEM-005 · LanceDB Real)', () => {
  let tempDir: string;
  let vectorStore: LanceDbVectorAdapter;
  let cognitiveMemory: LanceDbCognitiveMemoryAdapter;
  let matrixRepo: InMemoryDensityMatrixRepository;
  let embeddingStub: DeterministicEmbeddingStub;
  let loggedEntries: TelemetryEntry[];
  let telemetryRepo: TelemetryRepositoryPort;

  let mockDecisionEngine: ITypedDecisionEngine;
  let mockConversationalSlm: IConversationalSLMPort;
  let mockRouteUseCase: GenerateTacticalRouteUseCase;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `lancedb_triage_integ_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    resetLanceDbConnection();
    InMemoryDensityMatrixRepository.clearAll();

    vectorStore = new LanceDbVectorAdapter(tempDir);
    cognitiveMemory = new LanceDbCognitiveMemoryAdapter(vectorStore, tempDir);
    matrixRepo = new InMemoryDensityMatrixRepository();
    embeddingStub = new DeterministicEmbeddingStub('provider');

    loggedEntries = [];
    telemetryRepo = {
      log: vi.fn().mockImplementation((entry: TelemetryEntry) => {
        loggedEntries.push(entry);
        return Promise.resolve();
      }),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    mockDecisionEngine = {
      evaluateHealth: vi.fn(),
      evaluateNoul: vi.fn().mockResolvedValue({ probability: 0.1, isAffirmative: false }),
      evaluateChoice: vi.fn(),
    };

    mockConversationalSlm = {
      getActiveModelId: vi.fn().mockReturnValue('qwen/qwen3.8-27b'),
      generateBounceMessage: vi.fn().mockResolvedValue('Rebote fuera de perímetro.'),
      generateRepromptMessage: vi.fn().mockResolvedValue('¿Cuántas horas tienes disponibles?'),
      generateEmpatheticDialogue: vi.fn().mockResolvedValue({ message: 'Barcelona puede agotar.' }),
      generateContextualGreeting: vi.fn().mockResolvedValue('¡Buenos días!'),
      detectLanguageIntent: vi.fn().mockResolvedValue('es'),
    };

    const mockRoute = new TacticalRoute('route-integ', 'Ruta Real LanceDB', [
      new TacticalWaypoint('wp-1', 'Gótico', 'Paseo', undefined, new TimeSpan('10:00', '12:00')),
    ]);

    mockRouteUseCase = {
      execute: vi.fn().mockResolvedValue(mockRoute),
    } as unknown as GenerateTacticalRouteUseCase;
  });

  afterEach(async () => {
    resetLanceDbConnection();
    InMemoryDensityMatrixRepository.clearAll();
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {
      // Ignorar fallos de limpieza en OS tmp
    }
  });

  function createUseCase(): TriageInputUseCase {
    return new TriageInputUseCase(
      mockDecisionEngine,
      mockConversationalSlm,
      matrixRepo,
      mockRouteUseCase,
      telemetryRepo,
      undefined,
      cognitiveMemory,
      embeddingStub,
    );
  }

  it('CA-1 (Escenario 1): turno consolidado con embedding provider indexa fila en LanceDB real', async () => {
    const useCase = createUseCase();
    const sessionId = 'sess-ca1-provider';

    const outcome = await useCase.execute({
      sessionId,
      prompt: 'Queremos visitar el Born 3 horas con 4 amigos en plan cultural',
    });

    expect(outcome.status).toBe('DISPATCH_READY');
    expect(outcome.isThresholdSatisfied).toBe(true);

    // Verificación directa en LanceDB sin mocks
    const storedMemory = await cognitiveMemory.getLatestSessionMemory(sessionId, 'default');
    expect(storedMemory).not.toBeNull();
    expect(storedMemory?.propsSnapshot.sessionId).toBe(sessionId);
    expect(storedMemory?.propsSnapshot.matrixId).toBe('default');
    expect(storedMemory?.propsSnapshot.groupSize).toBe(4);
    expect(storedMemory?.propsSnapshot.mood).toBe('cultural');

    // Telemetría de indexación exitosa
    const indexLog = loggedEntries.find(
      (e) => e.payload?.eventType === 'COGNITIVE_MEMORY_INDEXING' && e.payload?.sessionId === sessionId,
    );
    expect(indexLog).toBeDefined();
    expect(indexLog?.payload?.outcome).toBe('INDEXED');
  });

  it('CA-2 (Escenario 3): turno consolidado con embedding fallback aborta indexación (0 filas) con WARN', async () => {
    embeddingStub.source = 'fallback';
    const useCase = createUseCase();
    const sessionId = 'sess-ca2-fallback';

    const outcome = await useCase.execute({
      sessionId,
      prompt: 'Queremos visitar la Sagrada Familia 2 horas con 2 personas',
    });

    // Respuesta al usuario intacta (Fail-Soft operacional)
    expect(outcome.status).toBe('DISPATCH_READY');
    expect(outcome.isThresholdSatisfied).toBe(true);

    // LanceDB real permanece limpio de vectores falsos (0 filas para la sesión)
    const storedMemory = await cognitiveMemory.getLatestSessionMemory(sessionId, 'default');
    expect(storedMemory).toBeNull();

    // Telemetría registra DISCARDED_FALLBACK con nivel WARN
    const skipLog = loggedEntries.find(
      (e) =>
        e.level === 'WARN' &&
        e.payload?.eventType === 'COGNITIVE_MEMORY_INDEXING' &&
        e.payload?.sessionId === sessionId,
    );
    expect(skipLog).toBeDefined();
    expect(skipLog?.payload?.outcome).toBe('DISCARDED_FALLBACK');
  });

  it('CA-3 (Escenario 5): cross-sesión tras purga de RAM rehidrata variables duraderas y acepta nueva ventana temporal', async () => {
    const useCase = createUseCase();
    const sessionId = 'sess-ca3-cross';

    // Turno 1: el usuario revela grupo, vibe cultural y restricciones (sin prisas)
    const firstOutcome = await useCase.execute({
      sessionId,
      prompt: 'Plan de 2 horas para 4 personas sin prisas y ambiente cultural',
    });
    expect(firstOutcome.status).toBe('DISPATCH_READY');

    // Simular reinicio de contenedor / nuevo turno vaciando la memoria RAM efímera
    await matrixRepo.clearMatrixPayload(sessionId);
    const clearedDraft = await matrixRepo.getMatrixPayload(sessionId, 'default');
    expect(clearedDraft).toBeNull();

    // Turno 2: el usuario vuelve indicando solo una nueva ventana temporal
    const secondOutcome = await useCase.execute({
      sessionId,
      prompt: 'algo para mañana por la tarde',
    });

    expect(secondOutcome.status).toBe('DISPATCH_READY');
    expect(secondOutcome.isThresholdSatisfied).toBe(true);
    // Heredó de LanceDB group_size, vibe cultural y restricción sin prisas
    expect(secondOutcome.payload?.group_size).toBe(4);
    expect(secondOutcome.payload?.vibe).toBe('cultural');
    expect(secondOutcome.payload?.constraints).toContain('sin prisas');
    // time_window fue actualizado con el nuevo turno
    expect(secondOutcome.payload?.time_window).toBe('algo para mañana por la tarde');
    expect(mockConversationalSlm.generateRepromptMessage).not.toHaveBeenCalled();
  });

  it('CA-4 (Escenario 2): K-NN acotado recupera memoria consolidada de matriz especializada al cambiar a default', async () => {
    const useCase = createUseCase();
    const sessionId = 'sess-ca4-knn';

    // Turno 1: sesión bajo matriz especializada 'gastronomy'
    const gastroOutcome = await useCase.execute({
      sessionId,
      matrixId: 'gastronomy',
      prompt: 'Cena de tapas para 3 personas en el Born por la noche',
    });
    expect(gastroOutcome.status).toBe('DISPATCH_READY');

    // Limpiar borrador efímero
    await matrixRepo.clearMatrixPayload(sessionId, 'gastronomy');

    // Turno 2: el usuario envía petición sin especificar matriz (entra en 'default')
    // No hay memoria exacta en 'default', pero K-NN acotado a la sesión rescata la de 'gastronomy'
    const defaultOutcome = await useCase.execute({
      sessionId,
      matrixId: 'default',
      prompt: 'algo de comer por la noche',
    });

    expect(defaultOutcome.status).toBe('DISPATCH_READY');
    expect(defaultOutcome.payload?.group_size).toBe(3);
    expect(defaultOutcome.payload?.vibe).toBe('tapas');

    // Telemetría certifica recuperación por K-NN
    const recallLog = loggedEntries.find(
      (e) =>
        e.payload?.eventType === 'COGNITIVE_MEMORY_RECALL' &&
        e.payload?.sessionId === sessionId &&
        e.payload?.strategy === 'knn',
    );
    expect(recallLog).toBeDefined();
    expect(recallLog?.payload?.memoryHit).toBe(true);
    expect(typeof recallLog?.payload?.similarity).toBe('number');
    expect((recallLog?.payload?.similarity as number)).toBeGreaterThanOrEqual(0.75);
  });

  it('CA-5 (No-fuga): sesión B nunca recupera ni por búsqueda exacta ni por K-NN la memoria de sesión A', async () => {
    const useCase = createUseCase();
    const sessionA = 'sess-user-alpha';
    const sessionB = 'sess-user-beta';

    // 1. Sesión A consolida su contexto gastronómico
    await useCase.execute({
      sessionId: sessionA,
      prompt: 'Cena de tapas para 6 personas con amigos por la noche',
    });

    // 2. Sesión B envía exactamente el mismo prompt gastronómico
    loggedEntries = [];
    const outcomeB = await useCase.execute({
      sessionId: sessionB,
      prompt: 'algo de comer esta noche',
    });

    // Sesión B no hereda las 6 personas de A (pide group_size o time_window faltante)
    expect(outcomeB.payload?.group_size).toBeUndefined();

    // Telemetría en Sesión B confirma que no hubo hit de memoria ajena
    const recallB = loggedEntries.find(
      (e) =>
        e.payload?.eventType === 'COGNITIVE_MEMORY_RECALL' &&
        e.payload?.sessionId === sessionB,
    );
    expect(recallB).toBeDefined();
    expect(recallB?.payload?.memoryHit).toBe(false);
    expect(recallB?.payload?.strategy).toBe('none');
  });
});
