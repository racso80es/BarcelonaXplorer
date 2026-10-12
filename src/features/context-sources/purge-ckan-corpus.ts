import { IVectorStorePort } from '@/features/cognitive-memory/vector-store.port';
import { CONTEXT_MEMORY_TABLE } from './lancedb-context-retrieval.adapter';

export interface PurgeCkanCorpusReport {
  readonly dryRun: boolean;
  readonly scanned: number;
  readonly matches: number;
  readonly deleted: number;
  readonly matchedIds: string[];
}

export interface PurgeCkanCorpusOptions {
  readonly dryRun?: boolean;
  readonly pageSize?: number;
  readonly tableName?: string;
}

const DEFAULT_PAGE_SIZE = 500;

/**
 * Purga de documentos de catálogo CKAN (bcn-opendata-ckan) en context_memory.
 * 
 * Regla de filtrado de negocio (PBI-CTX-012 CA-3):
 * Entra una fila si su `id` empieza por `bcn-opendata:` o `metadata.sourceTag === 'bcn-opendata-ckan'`.
 * 
 * Comportamiento (CA-4):
 * - Dry-run por defecto: retorna matchedIds sin llamar a delete.
 * - Con dryRun: false (apply): borra exclusivamente esos IDs mediante { ids }.
 */
export async function purgeCkanCorpus(
  vectorStore: IVectorStorePort,
  options?: PurgeCkanCorpusOptions,
): Promise<PurgeCkanCorpusReport> {
  const dryRun = options?.dryRun !== false;
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const tableName = options?.tableName ?? CONTEXT_MEMORY_TABLE;

  let offset = 0;
  let scanned = 0;
  const matchedIds: string[] = [];

  while (true) {
    const docs = await vectorStore.list(tableName, { limit: pageSize, offset });
    if (docs.length === 0) {
      break;
    }

    for (const doc of docs) {
      scanned += 1;
      const meta = (typeof doc.metadata === 'object' && doc.metadata !== null)
        ? (doc.metadata as Record<string, unknown>)
        : {};

      const isCkanPackage =
        doc.id.startsWith('bcn-opendata:') ||
        meta.sourceTag === 'bcn-opendata-ckan';

      if (isCkanPackage) {
        matchedIds.push(doc.id);
      }
    }

    if (docs.length < pageSize) {
      break;
    }
    offset += pageSize;
  }

  let deleted = 0;
  if (!dryRun && matchedIds.length > 0) {
    await vectorStore.delete(tableName, { ids: matchedIds });
    deleted = matchedIds.length;
  }

  return {
    dryRun,
    scanned,
    matches: matchedIds.length,
    deleted,
    matchedIds,
  };
}
