import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IVectorStorePort, VectorSearchResult } from '@/features/cognitive-memory/vector-store.port';
import { LanceDbContextRetrievalAdapter } from './lancedb-context-retrieval.adapter';
import { ContextEntry } from './context-entry.schema';

describe('LanceDbContextRetrievalAdapter', () => {
  let mockVectorStore: IVectorStorePort;

  const validEntry1: ContextEntry = {
    id: 'socrata:1',
    sourceTag: 'socrata',
    category: 'EVENT',
    title: 'Concierto en Gràcia',
    summary: 'Música en vivo al aire libre en la plaza del Sol.',
    startsAt: '2026-10-10T19:00:00.000Z',
    expiresAt: '2026-10-15T00:00:00.000Z',
    location: { name: 'Plaça del Sol' },
    contentHash: 'a'.repeat(64),
    tags: ['música'],
  };

  const expiredEntry: ContextEntry = {
    id: 'socrata:2',
    sourceTag: 'socrata',
    category: 'EVENT',
    title: 'Evento Ya Terminado',
    summary: 'Evento de la semana pasada que ya expiró.',
    startsAt: '2026-09-01T10:00:00.000Z',
    expiresAt: '2026-09-02T00:00:00.000Z', // Expirado antes de 2026-10-02
    contentHash: 'b'.repeat(64),
    tags: [],
  };

  const venueEntry: ContextEntry = {
    id: 'timeout:1',
    sourceTag: 'timeout',
    category: 'VENUE',
    title: 'Restaurante Bar El Born',
    summary: 'Excelente comida catalana y tapas tradicionales.',
    expiresAt: '2026-12-31T00:00:00.000Z',
    location: { name: 'El Born' },
    contentHash: 'c'.repeat(64),
    tags: ['gastronomía'],
  };

  beforeEach(() => {
    mockVectorStore = {
      tableExists: vi.fn().mockResolvedValue(true),
      upsert: vi.fn(),
      ping: vi.fn().mockResolvedValue({
        ok: true,
        latencyMs: 5,
        path: '/tmp/test',
        tableCount: 1,
      }),
      search: vi.fn().mockResolvedValue([
        {
          document: {
            id: validEntry1.id,
            vector: [0.1, 0.2],
            text: validEntry1.summary,
            metadata: validEntry1,
          },
          score: 0.95,
        },
        {
          document: {
            id: expiredEntry.id,
            vector: [0.1, 0.3],
            text: expiredEntry.summary,
            metadata: expiredEntry,
          },
          score: 0.9,
        },
        {
          document: {
            id: venueEntry.id,
            vector: [0.2, 0.4],
            text: venueEntry.summary,
            metadata: venueEntry,
          },
          score: 0.85,
        },
      ] as VectorSearchResult[]),
      getByIds: vi.fn(),
      delete: vi.fn(),
    };
  });

  it('filtra automáticamente entradas expiradas por defecto (CA-1)', async () => {
    const adapter = new LanceDbContextRetrievalAdapter(mockVectorStore);
    const envelope = await adapter.search([0.1, 0.2], {
      now: new Date('2026-10-02T12:00:00Z'),
    });

    expect(envelope.success).toBe(true);
    expect(envelope.result).toHaveLength(2);
    const ids = envelope.result?.map((e) => e.id);
    expect(ids).toContain('socrata:1');
    expect(ids).toContain('timeout:1');
    expect(ids).not.toContain('socrata:2'); // Expirada
  });

  it('permite filtrar por categoría específica', async () => {
    const adapter = new LanceDbContextRetrievalAdapter(mockVectorStore);
    const envelope = await adapter.search([0.1, 0.2], {
      category: 'VENUE',
      now: new Date('2026-10-02T12:00:00Z'),
    });

    expect(envelope.success).toBe(true);
    expect(envelope.result).toHaveLength(1);
    expect(envelope.result?.[0].id).toBe('timeout:1');
  });

  it('retorna lista vacía con success: true si la tabla no existe en LanceDB', async () => {
    vi.mocked(mockVectorStore.tableExists).mockResolvedValue(false);
    const adapter = new LanceDbContextRetrievalAdapter(mockVectorStore);
    const envelope = await adapter.search([0.1, 0.2]);

    expect(envelope.success).toBe(true);
    expect(envelope.result).toEqual([]);
    expect(mockVectorStore.search).not.toHaveBeenCalled();
  });

  it('gestiona excepciones capturándolas en sobre de error determinista (CA-4)', async () => {
    vi.mocked(mockVectorStore.search).mockRejectedValue(new Error('LanceDB Disk I/O Error'));
    const adapter = new LanceDbContextRetrievalAdapter(mockVectorStore);
    const envelope = await adapter.search([0.1, 0.2]);

    expect(envelope.success).toBe(false);
    expect(envelope.exitCode).toBe(500);
    expect(envelope.errors?.[0]).toContain('Disk I/O');
  });
});
