import {
  createErrorEnvelope,
  createSuccessEnvelope,
  OperationEnvelope,
} from '@/shared/operation-envelope';
import { IVectorStorePort } from '@/features/cognitive-memory/vector-store.port';
import { LanceDbVectorAdapter } from '@/features/cognitive-memory/lancedb-vector.adapter';
import { ContextEntry, ContextEntrySchema } from './context-entry.schema';
import {
  ContextRetrievalOptions,
  IContextRetrievalPort,
} from './context-retrieval.port';

export const CONTEXT_MEMORY_TABLE = 'context_memory';

export class LanceDbContextRetrievalAdapter implements IContextRetrievalPort {
  constructor(
    private readonly vectorStore: IVectorStorePort = new LanceDbVectorAdapter()
  ) {}

  async search(
    queryVector: number[],
    options?: ContextRetrievalOptions
  ): Promise<OperationEnvelope<ContextEntry[]>> {
    const limit = options?.limit ?? 5;
    const notExpired = options?.notExpired ?? true;
    const now = options?.now ?? new Date();

    try {
      const exists = await this.vectorStore.tableExists(CONTEXT_MEMORY_TABLE);
      if (!exists) {
        return createSuccessEnvelope([]);
      }

      // Solicitamos un margen ampliado (limit * 3) para compensar entradas caducadas o filtradas por categoría
      const results = await this.vectorStore.search(
        CONTEXT_MEMORY_TABLE,
        queryVector,
        Math.max(limit * 3, 10)
      );

      const validEntries: ContextEntry[] = [];

      for (const res of results) {
        if (validEntries.length >= limit) break;

        const candidatePayload = res.document.metadata;
        const parseRes = ContextEntrySchema.safeParse(candidatePayload);

        if (!parseRes.success) {
          continue;
        }

        const entry = parseRes.data;

        // Filtro de caducidad (Filtro A / CA-1)
        if (notExpired) {
          const expirationTime = new Date(entry.expiresAt).getTime();
          if (!isNaN(expirationTime) && expirationTime <= now.getTime()) {
            continue;
          }
        }

        // Filtro opcional de categoría
        if (options?.category && entry.category !== options.category) {
          continue;
        }

        validEntries.push(entry);
      }

      return createSuccessEnvelope(validEntries);
    } catch (err) {
      return createErrorEnvelope(
        [err instanceof Error ? err.message : String(err)],
        500,
        'Fallo en búsqueda vectorial sobre context_memory'
      );
    }
  }
}
