import { describe, it, expect, vi } from 'vitest';
import { purgeCkanCorpus } from './purge-ckan-corpus';
import { IVectorStorePort, VectorDocument } from '@/features/cognitive-memory/vector-store.port';

describe('purgeCkanCorpus (PBI-CTX-012)', () => {
  const createMockDoc = (id: string, sourceTag?: string): VectorDocument => ({
    id,
    vector: [0.1, 0.2, 0.3],
    text: `Contenido de ${id}`,
    metadata: sourceTag ? { sourceTag } : {},
  });

  it('CA-3 & CA-4: dry-run por defecto detecta documentos bcn-opendata sin llamar a delete', async () => {
    const docs: VectorDocument[] = [
      createMockDoc('bcn-opendata:agenda-cultural', 'bcn-opendata-ckan'),
      createMockDoc('bcn-opendata:mercats-municipals'),
      createMockDoc('doc-sin-prefijo', 'bcn-opendata-ckan'),
      createMockDoc('gencat-agenda:12345', 'gencat-agenda-cultural'),
    ];

    const mockVectorStore: IVectorStorePort = {
      upsert: vi.fn(),
      search: vi.fn(),
      getByIds: vi.fn(),
      tableExists: vi.fn().mockResolvedValue(true),
      ping: vi.fn(),
      list: vi.fn().mockResolvedValueOnce(docs).mockResolvedValueOnce([]),
      delete: vi.fn(),
    };

    const report = await purgeCkanCorpus(mockVectorStore);

    expect(report.dryRun).toBe(true);
    expect(report.scanned).toBe(4);
    expect(report.matches).toBe(3);
    expect(report.deleted).toBe(0);
    expect(report.matchedIds).toEqual([
      'bcn-opendata:agenda-cultural',
      'bcn-opendata:mercats-municipals',
      'doc-sin-prefijo',
    ]);
    expect(mockVectorStore.delete).not.toHaveBeenCalled();
  });

  it('CA-4: con dryRun: false (apply), borra los IDs identificados y una fuente ajena sobrevive', async () => {
    let storage: VectorDocument[] = [
      createMockDoc('bcn-opendata:dataset-1', 'bcn-opendata-ckan'),
      createMockDoc('bcn-opendata:dataset-2'),
      createMockDoc('gencat-agenda:999', 'gencat-agenda-cultural'),
      createMockDoc('wikidata:Q123', 'wikidata-barcelona-monuments'),
    ];

    const mockVectorStore: IVectorStorePort = {
      upsert: vi.fn(),
      search: vi.fn(),
      getByIds: vi.fn(),
      tableExists: vi.fn().mockResolvedValue(true),
      ping: vi.fn(),
      list: vi.fn().mockImplementation(async (_tableName, options) => {
        const offset = options?.offset ?? 0;
        const limit = options?.limit ?? 500;
        return storage.slice(offset, offset + limit);
      }),
      delete: vi.fn().mockImplementation(async (_tableName, filter) => {
        if (typeof filter === 'object' && filter !== null && 'ids' in filter) {
          const idsSet = new Set(filter.ids);
          storage = storage.filter((d) => !idsSet.has(d.id));
        }
      }),
    };

    // 1. Ejecución apply
    const applyReport = await purgeCkanCorpus(mockVectorStore, { dryRun: false });
    expect(applyReport.dryRun).toBe(false);
    expect(applyReport.matches).toBe(2);
    expect(applyReport.deleted).toBe(2);
    expect(mockVectorStore.delete).toHaveBeenCalledWith('context_memory', {
      ids: ['bcn-opendata:dataset-1', 'bcn-opendata:dataset-2'],
    });

    // Certificar que las fuentes de Generalitat y Wikidata sobreviven
    expect(storage.map((d) => d.id)).toEqual(['gencat-agenda:999', 'wikidata:Q123']);

    // 2. Dry-run posterior devuelve 0 IDs
    const subsequentDryRun = await purgeCkanCorpus(mockVectorStore, { dryRun: true });
    expect(subsequentDryRun.matches).toBe(0);
    expect(subsequentDryRun.deleted).toBe(0);
    expect(subsequentDryRun.matchedIds).toEqual([]);
  });

  it('debe paginar correctamente a través de múltiples páginas', async () => {
    const page1 = [
      createMockDoc('bcn-opendata:1'),
      createMockDoc('other:1'),
    ];
    const page2 = [
      createMockDoc('bcn-opendata:2'),
    ];

    const mockVectorStore: IVectorStorePort = {
      upsert: vi.fn(),
      search: vi.fn(),
      getByIds: vi.fn(),
      tableExists: vi.fn().mockResolvedValue(true),
      ping: vi.fn(),
      list: vi.fn()
        .mockResolvedValueOnce(page1)
        .mockResolvedValueOnce(page2)
        .mockResolvedValueOnce([]),
      delete: vi.fn(),
    };

    const report = await purgeCkanCorpus(mockVectorStore, { pageSize: 2 });
    expect(report.scanned).toBe(3);
    expect(report.matches).toBe(2);
    expect(report.matchedIds).toEqual(['bcn-opendata:1', 'bcn-opendata:2']);
  });
});
