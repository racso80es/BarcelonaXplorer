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
      0.98,
      24,
    );
  });

  it('debe retornar null si la tabla no existe', async () => {
    mockVectorStore.tableExists.mockResolvedValueOnce(false);
    const result = await adapter.get({
      vector: [0.1, 0.2],
      matrixId: 'default',
      language: 'es',
    });
    expect(result).toBeNull();
    expect(mockVectorStore.search).not.toHaveBeenCalled();
  });

  it('debe recuperar el resultado cacheado si similitud, matrixId e idioma coinciden', async () => {
    const cachedPayload = {
      status: 'CASUAL_DIALOGUE' as const,
      dialogueMessage: '¡Hola! Qué bien que te tomes un descanso.',
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
            cacheMatrixId: 'default',
            cacheLanguage: 'es',
          },
        },
        score: 0.99,
      },
    ]);

    const result = await adapter.get({
      vector: [0.1, 0.2],
      matrixId: 'default',
      language: 'es',
    });
    expect(result).not.toBeNull();
    expect(result?.result).toEqual(cachedPayload);
    expect(result?.similarity).toBe(0.99);
  });

  it('debe ignorar coincidencias de otra matrixId o idioma', async () => {
    mockVectorStore.search.mockResolvedValueOnce([
      {
        document: {
          id: 'hash1',
          vector: [0.1, 0.2],
          text: 'hola',
          metadata: {
            cachedResultJson: JSON.stringify({
              status: 'CASUAL_DIALOGUE',
              dialogueMessage: 'Hi',
            }),
            createdAt: new Date().toISOString(),
            cacheMatrixId: 'nightlife',
            cacheLanguage: 'es',
          },
        },
        score: 0.99,
      },
    ]);

    const result = await adapter.get({
      vector: [0.1, 0.2],
      matrixId: 'default',
      language: 'es',
    });
    expect(result).toBeNull();
  });

  it('debe descartar JSON que no cumple el esquema cacheado', async () => {
    mockVectorStore.search.mockResolvedValueOnce([
      {
        document: {
          id: 'bad',
          vector: [0.1],
          text: 'hola',
          metadata: {
            cachedResultJson: JSON.stringify({
              status: 'DISPATCH_READY',
              sessionId: 'leak',
            }),
            createdAt: new Date().toISOString(),
            cacheMatrixId: 'default',
            cacheLanguage: 'es',
          },
        },
        score: 0.99,
      },
    ]);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await adapter.get({
      vector: [0.1],
      matrixId: 'default',
      language: 'es',
    });
    expect(result).toBeNull();
    warnSpy.mockRestore();
  });

  it('debe insertar documento con matrixId e idioma en metadata', async () => {
    await adapter.set({
      prompt: 'donde comer en el born',
      vector: [0.3, 0.4],
      matrixId: 'default',
      language: 'es',
      payload: {
        status: 'CASUAL_DIALOGUE',
        dialogueMessage: 'Prueba',
      },
      tokensSaved: 900,
    });

    expect(mockVectorStore.upsert).toHaveBeenCalledTimes(1);
    const callArgs = mockVectorStore.upsert.mock.calls[0];
    expect(callArgs[0]).toBe('semantic_prompt_cache');
    expect(callArgs[1][0].metadata.cacheMatrixId).toBe('default');
    expect(callArgs[1][0].metadata.cacheLanguage).toBe('es');
    expect(callArgs[1][0].metadata.cachedResultJson).not.toContain('sessionId');
  });
});
