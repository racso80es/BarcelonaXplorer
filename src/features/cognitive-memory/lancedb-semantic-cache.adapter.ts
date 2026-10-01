import { createHash } from 'node:crypto';
import {
  CachedSemanticTriageResultSchema,
  SemanticCacheLookupSchema,
  SemanticCacheStoreSchema,
  type SemanticCacheLookup,
  type SemanticCacheStore,
} from './cached-triage.schema';
import { ISemanticCachePort, CachedTriageResult } from './semantic-cache.port';
import { IVectorStorePort, VectorDocument } from './vector-store.port';
import { LanceDbVectorAdapter } from './lancedb-vector.adapter';

function buildCacheDocumentId(matrixId: string, language: string, prompt: string): string {
  const normalized = `${matrixId}\0${language}\0${prompt.trim().toLowerCase()}`;
  return createHash('sha256').update(normalized).digest('hex').slice(0, 32);
}

/**
 * Adaptador de Caché Semántica Vectorial sobre LanceDB (Apache Arrow).
 */
export class LanceDbSemanticCacheAdapter implements ISemanticCachePort {
  public static readonly TABLE_NAME = 'semantic_prompt_cache';

  constructor(
    private readonly vectorStore: IVectorStorePort = new LanceDbVectorAdapter(),
    private readonly similarityThreshold: number = 0.98,
    private readonly maxAgeHours: number = 24,
  ) {}

  async get(lookup: SemanticCacheLookup): Promise<CachedTriageResult | null> {
    const parsedLookup = SemanticCacheLookupSchema.safeParse(lookup);
    if (!parsedLookup.success) {
      return null;
    }

    const { vector, matrixId, language } = parsedLookup.data;

    try {
      const exists = await this.vectorStore.tableExists(LanceDbSemanticCacheAdapter.TABLE_NAME);
      if (!exists) {
        return null;
      }

      const results = await this.vectorStore.search(
        LanceDbSemanticCacheAdapter.TABLE_NAME,
        vector,
        { limit: 8 },
      );

      for (const top of results) {
        if (top.score < this.similarityThreshold) {
          continue;
        }

        const metadata = top.document.metadata as {
          prompt?: string;
          cachedResultJson?: string;
          createdAt?: string;
          tokensSaved?: number;
          cacheMatrixId?: string;
          cacheLanguage?: string;
        };

        if (metadata.cacheMatrixId !== matrixId || metadata.cacheLanguage !== language) {
          continue;
        }

        if (!metadata || typeof metadata.cachedResultJson !== 'string') {
          continue;
        }

        const createdAt = metadata.createdAt ? new Date(metadata.createdAt) : new Date(0);
        const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        if (ageHours > this.maxAgeHours) {
          continue;
        }

        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(metadata.cachedResultJson);
        } catch {
          continue;
        }

        const payload = CachedSemanticTriageResultSchema.safeParse(parsedJson);
        if (!payload.success) {
          console.warn(
            '[LanceDbSemanticCacheAdapter] Entrada cacheada inválida descartada:',
            payload.error.message,
          );
          continue;
        }

        return {
          prompt: metadata.prompt ?? top.document.text,
          result: payload.data,
          similarity: top.score,
          tokensSaved:
            typeof metadata.tokensSaved === 'number'
              ? metadata.tokensSaved
              : undefined,
          createdAt,
        };
      }

      return null;
    } catch (err) {
      console.warn('[LanceDbSemanticCacheAdapter get Fallback Error]:', err);
      return null;
    }
  }

  async set(entry: SemanticCacheStore): Promise<void> {
    const parsed = SemanticCacheStoreSchema.safeParse(entry);
    if (!parsed.success) {
      console.warn('[LanceDbSemanticCacheAdapter set] Entrada rechazada:', parsed.error.message);
      return;
    }

    const { prompt, vector, matrixId, language, payload, tokensSaved } = parsed.data;

    try {
      const id = buildCacheDocumentId(matrixId, language, prompt);

      const doc: VectorDocument = {
        id,
        vector,
        text: prompt.trim(),
        metadata: {
          prompt: prompt.trim(),
          cachedResultJson: JSON.stringify(payload),
          createdAt: new Date().toISOString(),
          ...(tokensSaved !== undefined ? { tokensSaved } : {}),
          cacheMatrixId: matrixId,
          cacheLanguage: language,
        },
      };

      await this.vectorStore.upsert(LanceDbSemanticCacheAdapter.TABLE_NAME, [doc]);
    } catch (err) {
      console.warn('[LanceDbSemanticCacheAdapter set Fallback Error]:', err);
    }
  }
}
