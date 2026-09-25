import {
  ICognitiveMemoryPort,
  CognitiveMemoryItem,
} from '@/application/ports/out/cognitive-memory.port';
import { IVectorStorePort, VectorDocument } from '@/application/ports/out/vector-store.port';
import { DenseSemanticMatrix } from '@/domain/value-objects/dense-semantic-matrix.vo';
import { getLanceDbConnection } from './lancedb-client';
import { LanceDbVectorAdapter } from './lancedb-vector.adapter';

/**
 * Adaptador Hexagonal de Persistencia para Memoria Cognitiva sobre LanceDB (Apache Arrow).
 * 
 * Principios Arquitectónicos S+ Grade:
 * 1. Especialización RAG: Almacenamiento y búsqueda semántica de vectores de alta densidad.
 * 2. Ingesta Acotada Defensiva (Bounded Query Pattern):
 *    getRecentMemories impone un límite estricto inmutable de 100 registros, protegiendo
 *    a Node.js de asfixia térmica y colapsos por Out Of Memory (OOM).
 * 3. Tolerancia Cero a la Inferencia: Reconstruye rigurosamente el Value Object DenseSemanticMatrix.
 */
export class LanceDbCognitiveMemoryAdapter implements ICognitiveMemoryPort {
  public static readonly TABLE_NAME = 'cognitive_memories';
  private readonly vectorStore: IVectorStorePort;

  constructor(
    vectorStore?: IVectorStorePort,
    private readonly customUri?: string,
  ) {
    this.vectorStore = vectorStore ?? new LanceDbVectorAdapter(customUri);
  }

  async persistMemory(matrix: DenseSemanticMatrix, vector: number[]): Promise<void> {
    const snap = matrix.propsSnapshot;
    const documentId = `${snap.sessionId}:${snap.matrixId}`;

    const doc: VectorDocument = {
      id: documentId,
      vector,
      text: matrix.toDensePromptString(),
      metadata: matrix.toMetadata(),
    };

    await this.vectorStore.upsert(LanceDbCognitiveMemoryAdapter.TABLE_NAME, [doc]);
  }

  async getLatestSessionMemory(
    sessionId: string,
    matrixId: string = 'default',
  ): Promise<DenseSemanticMatrix | null> {
    const exists = await this.vectorStore.tableExists(LanceDbCognitiveMemoryAdapter.TABLE_NAME);
    if (!exists) {
      return null;
    }

    try {
      const db = await getLanceDbConnection(this.customUri);
      const table = await db.openTable(LanceDbCognitiveMemoryAdapter.TABLE_NAME);
      const targetId = `${sessionId.trim()}:${matrixId.trim()}`;
      const escapedId = targetId.replace(/'/g, "''");

      const rows = await table
        .query()
        .filter(`id = '${escapedId}'`)
        .limit(1)
        .toArray();

      if (!rows || rows.length === 0) {
        return null;
      }

      const row = rows[0];
      const parsedMeta = this.parseRowMetadata(row.metadata);

      return DenseSemanticMatrix.create({
        sessionId: String(parsedMeta.sessionId || sessionId),
        matrixId: String(parsedMeta.matrixId || matrixId),
        payload: {
          time_window: typeof parsedMeta.timeWindow === 'string' ? parsedMeta.timeWindow : undefined,
          group_size: typeof parsedMeta.groupSize === 'number' ? parsedMeta.groupSize : undefined,
          vibe: typeof parsedMeta.vibe === 'string' ? parsedMeta.vibe : undefined,
          constraints: Array.isArray(parsedMeta.constraints) ? parsedMeta.constraints : [],
          districts: Array.isArray(parsedMeta.districts) ? parsedMeta.districts : [],
        },
        score: typeof parsedMeta.score === 'number' ? parsedMeta.score : 0,
        survivalThreshold: typeof parsedMeta.survivalThreshold === 'number' ? parsedMeta.survivalThreshold : 60,
        updatedAt: parsedMeta.updatedAt ? new Date(String(parsedMeta.updatedAt)) : new Date(),
      });
    } catch (err) {
      console.warn(`[LanceDbCognitiveMemoryAdapter] Error al recuperar memoria de sesión ${sessionId}:`, err);
      return null;
    }
  }

  async searchSimilarMemories(
    queryVector: number[],
    options?: { sessionId?: string; limit?: number },
  ): Promise<Array<{ matrix: DenseSemanticMatrix; score: number }>> {
    const limit = Math.min(Math.max(1, options?.limit ?? 5), 20);
    const searchResults = await this.vectorStore.search(
      LanceDbCognitiveMemoryAdapter.TABLE_NAME,
      queryVector,
      limit,
    );

    const matches: Array<{ matrix: DenseSemanticMatrix; score: number }> = [];

    for (const res of searchResults) {
      const meta = res.document.metadata as Record<string, unknown>;
      if (options?.sessionId && meta.sessionId !== options.sessionId) {
        continue;
      }

      const matrix = DenseSemanticMatrix.create({
        sessionId: String(meta.sessionId || res.document.id.split(':')[0]),
        matrixId: String(meta.matrixId || 'default'),
        payload: {
          time_window: typeof meta.timeWindow === 'string' ? meta.timeWindow : undefined,
          group_size: typeof meta.groupSize === 'number' ? meta.groupSize : undefined,
          vibe: typeof meta.vibe === 'string' ? meta.vibe : undefined,
          constraints: Array.isArray(meta.constraints) ? meta.constraints : [],
          districts: Array.isArray(meta.districts) ? meta.districts : [],
        },
        score: typeof meta.score === 'number' ? meta.score : 0,
        survivalThreshold: typeof meta.survivalThreshold === 'number' ? meta.survivalThreshold : 60,
        updatedAt: meta.updatedAt ? new Date(String(meta.updatedAt)) : new Date(),
      });

      matches.push({ matrix, score: res.score });
    }

    return matches;
  }

  async getRecentMemories(options?: { limit?: number; offset?: number }): Promise<CognitiveMemoryItem[]> {
    const exists = await this.vectorStore.tableExists(LanceDbCognitiveMemoryAdapter.TABLE_NAME);
    if (!exists) {
      return [];
    }

    // Límite duro defensivo: nunca extraer más de 100 registros en una sola consulta
    const boundedLimit = Math.min(Math.max(1, options?.limit ?? 100), 100);
    const boundedOffset = Math.max(0, options?.offset ?? 0);

    try {
      const db = await getLanceDbConnection(this.customUri);
      const table = await db.openTable(LanceDbCognitiveMemoryAdapter.TABLE_NAME);

      const rows = await table
        .query()
        .limit(boundedLimit)
        .offset(boundedOffset)
        .toArray();

      return rows.map((row) => {
        const meta = this.parseRowMetadata(row.metadata);
        const timestamp = meta.updatedAt ? new Date(String(meta.updatedAt)).getTime() : Date.now();

        return {
          id: String(row.id),
          sessionId: String(meta.sessionId || row.id.split(':')[0]),
          matrixId: String(meta.matrixId || 'default'),
          denseText: String(row.text ?? ''),
          payload: (meta as Record<string, unknown>) ?? {},
          score: typeof meta.score === 'number' ? meta.score : 0,
          timestamp,
        };
      });
    } catch (err) {
      console.warn('[LanceDbCognitiveMemoryAdapter] Error consultando memorias recientes:', err);
      return [];
    }
  }

  async clearSessionMemory(sessionId: string): Promise<void> {
    const escaped = sessionId.replace(/'/g, "''");
    await this.vectorStore.delete(
      LanceDbCognitiveMemoryAdapter.TABLE_NAME,
      `id LIKE '${escaped}%'`,
    );
  }

  private parseRowMetadata(raw: unknown): Record<string, unknown> {
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    if (typeof raw === 'object' && raw !== null) {
      return raw as Record<string, unknown>;
    }
    return {};
  }
}
