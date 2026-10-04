import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IVectorStorePort, VectorDocument } from '@/features/cognitive-memory/vector-store.port';
import { IEmbeddingPort } from '@/features/ai-engine/embedding.port';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { createSuccessEnvelope, createErrorEnvelope } from '@/shared/operation-envelope';
import { IContextSourceRepository } from './context-source.repository.port';
import { IContextSourceAdapter } from './context-source-adapter.port';
import { IngestContextUseCase, CONTEXT_MEMORY_TABLE } from './ingest-context.use-case';
import { ContextSourceSnapshot } from './context-source.types';
import { ContextEntry } from './context-entry.schema';

describe('IngestContextUseCase', () => {
  let mockSourceRepo: IContextSourceRepository;
  let mockVectorStore: IVectorStorePort;
  let mockEmbeddingPort: IEmbeddingPort;
  let mockTelemetryRepo: TelemetryRepositoryPort;
  let mockAdapter: IContextSourceAdapter;

  const sampleSource1: ContextSourceSnapshot = {
    id: 'src-1',
    sourceTag: 'gencat-agenda-cultural',
    displayName: 'Agenda Cultural',
    endpoint: 'https://agenda.cat/api',
    type: 'SOCRATA',
    category: 'EVENT',
    status: 'ACTIVE',
    failedAttempts: 0,
    lastSuccessAt: null,
    proposedBy: 'SEED',
    supersedesSourceTag: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleEntry1: ContextEntry = {
    id: 'gencat-agenda-cultural:ev-1',
    sourceTag: 'gencat-agenda-cultural',
    category: 'EVENT',
    title: 'Exposición de Arte Moderno',
    summary: 'Muestra retrospectiva en el barrio gótico sobre arte contemporáneo barcelonés.',
    startsAt: '2026-10-10T10:00:00.000Z',
    endsAt: '2026-10-10T18:00:00.000Z',
    location: {
      name: 'Museu Picasso',
      lat: 41.3853,
      lng: 2.1812,
    },
    url: 'https://museupicasso.bcn.cat',
    price: '12€',
    tags: ['arte', 'exposicion'],
    expiresAt: '2026-10-11T18:00:00.000Z',
    contentHash: '1111111111111111111111111111111111111111111111111111111111111111',
  };

  beforeEach(() => {
    mockSourceRepo = {
      findByStatus: vi.fn().mockResolvedValue([sampleSource1]),
      findByTag: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn().mockResolvedValue(createSuccessEnvelope(sampleSource1)),
      create: vi.fn(),
      upsertFromSeed: vi.fn(),
    };

    mockVectorStore = {
      upsert: vi.fn().mockResolvedValue(undefined),
      search: vi.fn().mockResolvedValue([]),
      getByIds: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
      tableExists: vi.fn().mockResolvedValue(true),
      ping: vi.fn().mockResolvedValue({ ok: true, latencyMs: 1, path: '/tmp', tableCount: 1 }),
    };

    mockEmbeddingPort = {
      generateEmbedding: vi.fn().mockResolvedValue(
        createSuccessEnvelope(new Array(768).fill(0.1)),
      ),
      getDimensions: vi.fn().mockReturnValue(768),
    };

    mockTelemetryRepo = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    mockAdapter = {
      type: 'SOCRATA',
      fetch: vi.fn().mockResolvedValue(createSuccessEnvelope([sampleEntry1])),
    };
  });

  it('CA-3 / Escenario 2: ingesta exitosa resetea failedAttempts de 2 a 0 y actualiza lastSuccessAt', async () => {
    const degradedNearSource: ContextSourceSnapshot = {
      ...sampleSource1,
      failedAttempts: 2,
    };
    vi.mocked(mockSourceRepo.findByStatus).mockResolvedValue([degradedNearSource]);

    const useCase = new IngestContextUseCase(
      mockSourceRepo,
      { SOCRATA: mockAdapter },
      mockVectorStore,
      mockEmbeddingPort,
      mockTelemetryRepo
    );

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    expect(mockSourceRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'src-1',
        status: 'ACTIVE',
        failedAttempts: 0,
        lastSuccessAt: expect.any(Date),
      })
    );
    expect(result.result?.persisted).toBe(1);
  });

  it('CA-3 / Escenario 1: tres fallos consecutivos degradan la fuente a DEGRADED y registran telemetría', async () => {
    const twiceFailedSource: ContextSourceSnapshot = {
      ...sampleSource1,
      failedAttempts: 2,
    };
    vi.mocked(mockSourceRepo.findByStatus).mockResolvedValue([twiceFailedSource]);
    vi.mocked(mockAdapter.fetch).mockResolvedValue(
      createErrorEnvelope(['HTTP 500 Internal Server Error'], 500)
    );

    const useCase = new IngestContextUseCase(
      mockSourceRepo,
      { SOCRATA: mockAdapter },
      mockVectorStore,
      mockEmbeddingPort,
      mockTelemetryRepo
    );

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    expect(mockSourceRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'src-1',
        status: 'DEGRADED',
        failedAttempts: 3,
      })
    );
    expect(result.result?.sourcesDegraded).toBe(1);
    expect(result.result?.persisted).toBe(0);
  });

  it('CA-4: el fallo de una fuente no interrumpe la ingesta de las fuentes subsiguientes', async () => {
    const source2: ContextSourceSnapshot = {
      ...sampleSource1,
      id: 'src-2',
      sourceTag: 'source-healthy',
      type: 'SOCRATA',
    };
    vi.mocked(mockSourceRepo.findByStatus).mockResolvedValue([sampleSource1, source2]);

    vi.mocked(mockAdapter.fetch)
      .mockResolvedValueOnce(createErrorEnvelope(['Network timeout'], 504))
      .mockResolvedValueOnce(createSuccessEnvelope([sampleEntry1]));

    const useCase = new IngestContextUseCase(
      mockSourceRepo,
      { SOCRATA: mockAdapter },
      mockVectorStore,
      mockEmbeddingPort,
      mockTelemetryRepo
    );

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    expect(result.result?.sourcesProcessed).toBe(2);
    expect(result.result?.persisted).toBe(1);
    expect(mockSourceRepo.save).toHaveBeenCalledTimes(2);
  });

  it('CA-5 / Escenario 6: deduplicación térmica omite vectorización si id y contentHash coinciden', async () => {
    const existingDoc: VectorDocument = {
      id: sampleEntry1.id,
      vector: new Array(768).fill(0.1),
      text: sampleEntry1.summary,
      metadata: { contentHash: sampleEntry1.contentHash },
    };

    vi.mocked(mockVectorStore.getByIds).mockResolvedValue([existingDoc]);

    const useCase = new IngestContextUseCase(
      mockSourceRepo,
      { SOCRATA: mockAdapter },
      mockVectorStore,
      mockEmbeddingPort,
      mockTelemetryRepo
    );

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    expect(result.result?.deduplicated).toBe(1);
    expect(result.result?.persisted).toBe(0);
    expect(mockEmbeddingPort.generateEmbedding).not.toHaveBeenCalled();
    expect(mockVectorStore.upsert).not.toHaveBeenCalled();
  });

  it('CA-6 / Escenario 5: vectorización fallida se descarta fail-closed y emite WARN en LLM_ENGINE', async () => {
    vi.mocked(mockEmbeddingPort.generateEmbedding).mockResolvedValue(
      createErrorEnvelope<number[]>(['Fallo transitorio de vectorización'], 422),
    );

    const useCase = new IngestContextUseCase(
      mockSourceRepo,
      { SOCRATA: mockAdapter },
      mockVectorStore,
      mockEmbeddingPort,
      mockTelemetryRepo
    );

    const result = await useCase.execute();

    expect(result.success).toBe(true);
    expect(result.result?.discardedFallback).toBe(1);
    expect(result.result?.persisted).toBe(0);
    expect(mockVectorStore.upsert).not.toHaveBeenCalled();

    expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'WARN',
        context: 'LLM_ENGINE',
        message: expect.stringContaining('Vector no disponible o descartado'),
      })
    );
  });

  it('CA-8: al final de la ejecución se ejecuta poda de entradas caducadas en context_memory', async () => {
    const useCase = new IngestContextUseCase(
      mockSourceRepo,
      { SOCRATA: mockAdapter },
      mockVectorStore,
      mockEmbeddingPort,
      mockTelemetryRepo
    );

    await useCase.execute();

    expect(mockVectorStore.delete).toHaveBeenCalledWith(
      CONTEXT_MEMORY_TABLE,
      expect.objectContaining({
        expiredBefore: expect.any(String),
      })
    );
  });

  it('CA-10: registra telemetría de resumen al completar la ejecución', async () => {
    const useCase = new IngestContextUseCase(
      mockSourceRepo,
      { SOCRATA: mockAdapter },
      mockVectorStore,
      mockEmbeddingPort,
      mockTelemetryRepo
    );

    const result = await useCase.execute();
    expect(result.success).toBe(true);

    expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'INFO',
        context: 'SYSTEM',
        message: expect.stringContaining('Ingesta completada'),
        payload: expect.objectContaining({
          eventType: 'CONTEXT_INGESTION_SUMMARY',
          persisted: 1,
        }),
      })
    );
  });
});
