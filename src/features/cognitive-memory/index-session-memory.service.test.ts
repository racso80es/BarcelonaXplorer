import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  IndexSessionMemoryService,
  COGNITIVE_MEMORY_INDEXING_POLICY,
} from './index-session-memory.service';
import { ICognitiveMemoryPort } from './cognitive-memory.port';
import { IEmbeddingPort } from '@/features/ai-engine';
import { TelemetryRepositoryPort, TelemetryEntry } from '@/features/telemetry';
import { DenseSemanticMatrix } from './dense-semantic-matrix.vo';
import { TriageStatus } from '@/features/triage/triage.schema';
import { createSuccessEnvelope, createErrorEnvelope } from '@/shared/operation-envelope';

describe('PBI-MEM-001: IndexSessionMemoryService (Aduana de Fricción)', () => {
  let mockCognitiveMemory: ICognitiveMemoryPort;
  let mockEmbeddingPort: IEmbeddingPort;
  let mockTelemetryRepo: TelemetryRepositoryPort;
  let loggedEntries: TelemetryEntry[];

  beforeEach(() => {
    loggedEntries = [];
    mockCognitiveMemory = {
      persistMemory: vi.fn().mockResolvedValue(undefined),
      getLatestSessionMemory: vi.fn().mockResolvedValue(null),
      searchSimilarMemories: vi.fn().mockResolvedValue([]),
      getRecentMemories: vi.fn().mockResolvedValue([]),
      clearSessionMemory: vi.fn().mockResolvedValue(undefined),
    };

    mockEmbeddingPort = {
      generateEmbedding: vi.fn().mockResolvedValue(
        createSuccessEnvelope(new Array(768).fill(0.05)),
      ),
      getDimensions: vi.fn().mockReturnValue(768),
    };

    mockTelemetryRepo = {
      log: vi.fn().mockImplementation(async (entry: TelemetryEntry) => {
        loggedEntries.push(entry);
      }),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };
  });

  describe('CA-1: Matriz declarativa COGNITIVE_MEMORY_INDEXING_POLICY', () => {
    const table: Array<{ status: TriageStatus; expectedIndexable: boolean }> = [
      { status: 'DISPATCH_READY', expectedIndexable: true },
      { status: 'DISPATCH_CLAUDICATION', expectedIndexable: true },
      { status: 'INCOMPLETE_REPROMPT', expectedIndexable: true },
      { status: 'CASUAL_DIALOGUE', expectedIndexable: false },
      { status: 'REBOUND_OUT_OF_SCOPE', expectedIndexable: false },
    ];

    it.each(table)(
      'debe definir indexable=$expectedIndexable para status=$status',
      ({ status, expectedIndexable }) => {
        expect(COGNITIVE_MEMORY_INDEXING_POLICY[status].indexable).toBe(expectedIndexable);
      },
    );
  });

  describe('CA-2 y CA-9: Cobertura de los seis outcomes', () => {
    it('1. INDEXED: debe indexar con provider embedding y emitir INFO', async () => {
      const service = new IndexSessionMemoryService(
        mockCognitiveMemory,
        mockEmbeddingPort,
        mockTelemetryRepo,
      );

      const matrix = DenseSemanticMatrix.create({
        sessionId: 'sess-1',
        matrixId: 'default',
        payload: {
          group_size: 2,
          vibe: 'gastronomica',
          time_window: 'tarde',
        },
      });

      const envelope = await service.index(matrix, 'DISPATCH_READY');

      expect(envelope.success).toBe(true);
      expect(envelope.result?.outcome).toBe('INDEXED');
      expect(envelope.result?.vector).toHaveLength(768);
      expect(mockEmbeddingPort.generateEmbedding).toHaveBeenCalledTimes(1);
      expect(mockCognitiveMemory.persistMemory).toHaveBeenCalledWith(
        matrix,
        expect.any(Array),
      );

      const infoLog = loggedEntries.find(
        (l) =>
          l.level === 'INFO' &&
          l.payload?.eventType === 'COGNITIVE_MEMORY_INDEXING' &&
          l.payload?.outcome === 'INDEXED',
      );
      expect(infoLog).toBeDefined();
      expect(infoLog?.payload?.sessionId).toBe('sess-1');
    });

    it('2. DISCARDED_FALLBACK: fail-closed de persistencia con WARN ante error de vectorización', async () => {
      mockEmbeddingPort.generateEmbedding = vi.fn().mockResolvedValue(
        createErrorEnvelope<number[]>(['Fallo del proveedor de embeddings'], 503),
      );

      const service = new IndexSessionMemoryService(
        mockCognitiveMemory,
        mockEmbeddingPort,
        mockTelemetryRepo,
      );

      const matrix = DenseSemanticMatrix.create({
        sessionId: 'sess-fallback',
        matrixId: 'default',
        payload: {
          group_size: 4,
          vibe: 'familiar',
        },
      });

      const envelope = await service.index(matrix, 'DISPATCH_READY');

      expect(envelope.success).toBe(true);
      expect(envelope.result?.outcome).toBe('DISCARDED_FALLBACK');
      expect(mockCognitiveMemory.persistMemory).not.toHaveBeenCalled();

      const warnLog = loggedEntries.find(
        (l) =>
          l.level === 'WARN' &&
          l.context === 'LLM_ENGINE' &&
          l.payload?.eventType === 'COGNITIVE_MEMORY_INDEXING' &&
          l.payload?.outcome === 'DISCARDED_FALLBACK',
      );
      expect(warnLog).toBeDefined();
      expect(warnLog?.payload?.sessionId).toBe('sess-fallback');
    });

    it('3. SKIPPED_UNCHANGED: debe deduplicar ante payload previo idéntico sin llamar al embedding', async () => {
      const service = new IndexSessionMemoryService(
        mockCognitiveMemory,
        mockEmbeddingPort,
        mockTelemetryRepo,
      );

      const payload = {
        group_size: 2,
        vibe: 'romántico',
      };

      const matrix = DenseSemanticMatrix.create({
        sessionId: 'sess-unchanged',
        matrixId: 'default',
        payload,
      });

      const envelope = await service.index(matrix, 'INCOMPLETE_REPROMPT', payload);

      expect(envelope.success).toBe(true);
      expect(envelope.result?.outcome).toBe('SKIPPED_UNCHANGED');
      expect(mockEmbeddingPort.generateEmbedding).not.toHaveBeenCalled();
      expect(mockCognitiveMemory.persistMemory).not.toHaveBeenCalled();
    });

    it('4. SKIPPED_POLICY: debe omitir estados no indexables según la matriz declarativa', async () => {
      const service = new IndexSessionMemoryService(
        mockCognitiveMemory,
        mockEmbeddingPort,
        mockTelemetryRepo,
      );

      const matrix = DenseSemanticMatrix.create({
        sessionId: 'sess-casual',
        matrixId: 'default',
        payload: { vibe: 'relax' },
      });

      const envelope = await service.index(matrix, 'CASUAL_DIALOGUE');

      expect(envelope.success).toBe(true);
      expect(envelope.result?.outcome).toBe('SKIPPED_POLICY');
      expect(mockEmbeddingPort.generateEmbedding).not.toHaveBeenCalled();
      expect(mockCognitiveMemory.persistMemory).not.toHaveBeenCalled();
    });

    it('5. SKIPPED_EMPTY: omite si el contexto es Base o si INCOMPLETE_REPROMPT no tiene variables duraderas', async () => {
      const service = new IndexSessionMemoryService(
        mockCognitiveMemory,
        mockEmbeddingPort,
        mockTelemetryRepo,
      );

      // Caso A: Matriz totalmente vacía (Contexto: Base)
      const emptyMatrix = DenseSemanticMatrix.create({
        sessionId: 'sess-empty',
        matrixId: 'default',
        payload: {},
      });
      const envelopeA = await service.index(emptyMatrix, 'DISPATCH_READY');
      expect(envelopeA.result?.outcome).toBe('SKIPPED_EMPTY');
      expect(mockEmbeddingPort.generateEmbedding).not.toHaveBeenCalled();

      // Caso B: INCOMPLETE_REPROMPT con solo variable efímera (time_window)
      const ephemeralOnlyMatrix = DenseSemanticMatrix.create({
        sessionId: 'sess-ephemeral',
        matrixId: 'default',
        payload: { time_window: 'mañana por la mañana' },
      });
      const envelopeB = await service.index(ephemeralOnlyMatrix, 'INCOMPLETE_REPROMPT');
      expect(envelopeB.result?.outcome).toBe('SKIPPED_EMPTY');
      expect(mockEmbeddingPort.generateEmbedding).not.toHaveBeenCalled();
    });

    it('6. FAILED: fail-soft si persistMemory arroja excepción con WARN y sobre fallido', async () => {
      mockCognitiveMemory.persistMemory = vi
        .fn()
        .mockRejectedValue(new Error('LanceDB disk full error'));

      const service = new IndexSessionMemoryService(
        mockCognitiveMemory,
        mockEmbeddingPort,
        mockTelemetryRepo,
      );

      const matrix = DenseSemanticMatrix.create({
        sessionId: 'sess-fail',
        matrixId: 'default',
        payload: { group_size: 3, vibe: 'amigos' },
      });

      const envelope = await service.index(matrix, 'DISPATCH_READY');

      expect(envelope.success).toBe(false);
      expect(envelope.exitCode).toBe(1);
      expect(envelope.result?.outcome).toBe('FAILED');
      expect(envelope.result?.error).toContain('LanceDB disk full error');

      const warnLog = loggedEntries.find(
        (l) =>
          l.level === 'WARN' &&
          l.context === 'SECURITY_PERIMETER' &&
          l.payload?.outcome === 'FAILED' &&
          l.message.includes('[Triage Fail-Soft]'),
      );
      expect(warnLog).toBeDefined();
    });
  });

  describe('CA-3: Indexación de turnos parciales (INCOMPLETE_REPROMPT)', () => {
    it('debe indexar si INCOMPLETE_REPROMPT contiene al menos una variable duradera', async () => {
      const service = new IndexSessionMemoryService(
        mockCognitiveMemory,
        mockEmbeddingPort,
        mockTelemetryRepo,
      );

      const matrix = DenseSemanticMatrix.create({
        sessionId: 'sess-partial',
        matrixId: 'default',
        payload: {
          group_size: 2, // Variable duradera
        },
      });

      const envelope = await service.index(matrix, 'INCOMPLETE_REPROMPT');

      expect(envelope.success).toBe(true);
      expect(envelope.result?.outcome).toBe('INDEXED');
      expect(mockCognitiveMemory.persistMemory).toHaveBeenCalledTimes(1);
    });
  });
});
