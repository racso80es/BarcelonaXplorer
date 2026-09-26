import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LanceDbSemanticCacheAdapter } from './lancedb-semantic-cache.adapter';
import { IVectorStorePort } from './vector-store.port';

describe('LanceDbSemanticCacheAdapter (Vía del Yunque S+)', () => {
  let mockVectorStore: {
    tableExists: ReturnType<typeof vi.fn>;
    search: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    ping: ReturnType<typeof vi.fn>;
  };
  let adapter: LanceDbSemanticCacheAdapter;

  beforeEach(() => {
    mockVectorStore = {
      tableExists: vi.fn().mockResolvedValue(true),
      search: vi.fn().mockResolvedValue([]),
      upsert: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      ping: vi.fn().mockResolvedValue({ ok: true, latencyMs: 2, path: '', tableCount: 1 }),
    };
    adapter = new LanceDbSemanticCacheAdapter(
      mockVectorStore as unknown as IVectorStorePort,
      0.95,
      24,
    );
  });

  it('CA-1 & CA-2: debe retornar null si la tabla no existe', async () => {
    mockVectorStore.tableExists.mockResolvedValueOnce(false);
    const result = await adapter.get([0.1, 0.2]);
    expect(result).toBeNull();
    expect(mockVectorStore.search).not.toHaveBeenCalled();
  });

  it('CA-1 & CA-2: debe recuperar el resultado cacheado si la similitud es >= 0.95 y no ha expirado', async () => {
    const cachedPayload = {
      status: 'CASUAL_DIALOGUE',
      response: '¡Hola! Veo que estás agotado...',
    };

    mockVectorStore.search.mockResolvedValueOnce([
      {
        document: {
          id: 'hash1',
          vector: [0.1, 0.2],
          text: 'estoy muy cansado',
          metadata: {
            prompt: 'estoy muy cansado',
            cachedResultJson: JSON.stringify(cachedPayload),
            createdAt: new Date().toISOString(),
            tokensSaved: 850,
          },
        },
        score: 0.98, // Supera 0.95
      },
    ]);

    const result = await adapter.get([0.1, 0.2]);
    expect(result).not.toBeNull();
    expect(result?.prompt).toBe('estoy muy cansado');
    expect(result?.similarity).toBe(0.98);
    expect(result?.tokensSaved).toBe(850);
    expect(result?.result).toEqual(cachedPayload);
  });

  it('CA-1 & CA-2: debe descartar el resultado si la similitud es inferior a 0.95', async () => {
    mockVectorStore.search.mockResolvedValueOnce([
      {
        document: {
          id: 'hash2',
          vector: [0.1, 0.2],
          text: 'otra consulta',
          metadata: {
            cachedResultJson: JSON.stringify({ ok: true }),
            createdAt: new Date().toISOString(),
          },
        },
        score: 0.89, // Menor a 0.95
      },
    ]);

    const result = await adapter.get([0.1, 0.2]);
    expect(result).toBeNull();
  });

  it('CA-1 & CA-2: debe descartar el resultado si el TTL supera las 24 horas', async () => {
    const fortyHoursAgo = new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString();

    mockVectorStore.search.mockResolvedValueOnce([
      {
        document: {
          id: 'hash3',
          vector: [0.1, 0.2],
          text: 'consulta antigua',
          metadata: {
            cachedResultJson: JSON.stringify({ ok: true }),
            createdAt: fortyHoursAgo,
          },
        },
        score: 0.99,
      },
    ]);

    const result = await adapter.get([0.1, 0.2]);
    expect(result).toBeNull();
  });

  it('CA-1 & CA-2: debe insertar correctamente un documento en la tabla al hacer set()', async () => {
    await adapter.set('donde comer en el born', [0.3, 0.4], { route: 'born-tapas' }, 900);

    expect(mockVectorStore.upsert).toHaveBeenCalledTimes(1);
    const callArgs = mockVectorStore.upsert.mock.calls[0];
    expect(callArgs[0]).toBe('semantic_prompt_cache');
    expect(callArgs[1][0].text).toBe('donde comer en el born');
    expect(callArgs[1][0].metadata.tokensSaved).toBe(900);
  });

  it('Fail-Soft: no debe propagar excepción si el vector store falla', async () => {
    mockVectorStore.search.mockRejectedValueOnce(new Error('LanceDB lock error'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(adapter.get([0.1])).resolves.toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
