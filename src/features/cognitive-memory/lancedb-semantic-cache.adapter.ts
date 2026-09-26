import { ISemanticCachePort, CachedTriageResult } from './semantic-cache.port';
import { IVectorStorePort, VectorDocument } from './vector-store.port';
import { LanceDbVectorAdapter } from './lancedb-vector.adapter';

/**
 * Adaptador de Caché Semántica Vectorial sobre LanceDB (Apache Arrow).
 * Protocolo de Acero — Grado S+
 * Axioma I: Localidad de Comportamiento
 * Axioma II: Tolerancia Cero a la Inferencia
 * Axioma V: Ejecución Encapsulada con Fail-Soft ante indisponibilidad del motor vectorial
 */
export class LanceDbSemanticCacheAdapter implements ISemanticCachePort {
  public static readonly TABLE_NAME = 'semantic_prompt_cache';

  constructor(
    private readonly vectorStore: IVectorStorePort = new LanceDbVectorAdapter(),
    private readonly similarityThreshold: number = 0.95,
    private readonly maxAgeHours: number = 24,
  ) {}

  async get(vector: number[]): Promise<CachedTriageResult | null> {
    try {
      const exists = await this.vectorStore.tableExists(LanceDbSemanticCacheAdapter.TABLE_NAME);
      if (!exists) {
        return null;
      }

      const results = await this.vectorStore.search(
        LanceDbSemanticCacheAdapter.TABLE_NAME,
        vector,
        1,
      );

      if (results.length === 0) {
        return null;
      }

      const top = results[0];
      if (top.score < this.similarityThreshold) {
        return null;
      }

      const metadata = top.document.metadata as {
        prompt?: string;
        cachedResultJson?: string;
        createdAt?: string;
        tokensSaved?: number;
      };

      if (!metadata || typeof metadata.cachedResultJson !== 'string') {
        return null;
      }

      const createdAt = metadata.createdAt ? new Date(metadata.createdAt) : new Date(0);
      const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
      if (ageHours > this.maxAgeHours) {
        return null; // TTL caducado
      }

      const result = JSON.parse(metadata.cachedResultJson) as Record<string, unknown>;

      return {
        prompt: metadata.prompt ?? top.document.text,
        result,
        similarity: top.score,
        tokensSaved: metadata.tokensSaved ?? 850,
        createdAt,
      };
    } catch (err) {
      // Fail-soft: la falla de caché nunca debe detener la inferencia principal
      console.warn('[LanceDbSemanticCacheAdapter get Fallback Error]:', err);
      return null;
    }
  }

  async set(
    prompt: string,
    vector: number[],
    result: Record<string, unknown>,
    tokensSaved: number = 850,
  ): Promise<void> {
    try {
      // Generar ID determinista basado en el prompt
      const id = Buffer.from(prompt.trim().toLowerCase()).toString('base64').slice(0, 32);

      const doc: VectorDocument = {
        id,
        vector,
        text: prompt.trim(),
        metadata: {
          prompt: prompt.trim(),
          cachedResultJson: JSON.stringify(result),
          createdAt: new Date().toISOString(),
          tokensSaved,
        },
      };

      await this.vectorStore.upsert(LanceDbSemanticCacheAdapter.TABLE_NAME, [doc]);
    } catch (err) {
      // Fail-soft
      console.warn('[LanceDbSemanticCacheAdapter set Fallback Error]:', err);
    }
  }
}
