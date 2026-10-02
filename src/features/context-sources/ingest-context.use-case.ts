import {
  createErrorEnvelope,
  createSuccessEnvelope,
  OperationEnvelope,
} from '@/shared/operation-envelope';
import { IVectorStorePort, VectorDocument } from '@/features/cognitive-memory/vector-store.port';
import { IEmbeddingPort } from '@/features/ai-engine/embedding.port';
import { TelemetryRepositoryPort, TelemetryEntry } from '@/features/telemetry';
import { IContextSourceRepository } from './context-source.repository.port';
import { ContextAdapterRegistry } from './context-source-adapter.port';
import { applyIngestionResult } from './context-source-state-machine';
import { ContextEntry, ContextEntrySchema } from './context-entry.schema';

export const CONTEXT_MEMORY_TABLE = 'context_memory';

export interface IngestionExecutionReport {
  sourcesProcessed: number;
  sourcesDegraded: number;
  fetched: number;
  deduplicated: number;
  persisted: number;
  discardedFallback: number;
  durationMs: number;
}

export class IngestContextUseCase {
  constructor(
    private readonly sourceRepository: IContextSourceRepository,
    private readonly adapterRegistry: ContextAdapterRegistry,
    private readonly vectorStore: IVectorStorePort,
    private readonly embeddingPort: IEmbeddingPort,
    private readonly telemetryRepo?: TelemetryRepositoryPort,
  ) {}

  async execute(): Promise<OperationEnvelope<IngestionExecutionReport>> {
    const startTime = Date.now();
    let sourcesProcessed = 0;
    let sourcesDegraded = 0;
    let totalFetched = 0;
    let totalDeduplicated = 0;
    let totalPersisted = 0;
    let totalDiscardedFallback = 0;

    try {
      // 1. Obtener todas las fuentes actualmente en estado ACTIVE
      const activeSources = await this.sourceRepository.findByStatus('ACTIVE');

      for (const source of activeSources) {
        sourcesProcessed += 1;
        const adapter = this.adapterRegistry[source.type];

        let fetchSuccess = false;
        let fetchedEntries: ContextEntry[] = [];

        try {
          if (!adapter) {
            fetchSuccess = false;
          } else {
            const fetchEnvelope = await adapter.fetch(source);
            fetchSuccess = fetchEnvelope.success;
            if (fetchEnvelope.success && Array.isArray(fetchEnvelope.result)) {
              fetchedEntries = fetchEnvelope.result;
            }
          }
        } catch {
          fetchSuccess = false;
        }

        // 2. Circuit Breaker puro: aplicar resultado a la máquina de estados (CA-3)
        const transitionEnv = applyIngestionResult(source, { success: fetchSuccess });
        if (transitionEnv.success && transitionEnv.result) {
          const updatedSource = transitionEnv.result;
          if (updatedSource.status === 'DEGRADED' && source.status !== 'DEGRADED') {
            sourcesDegraded += 1;
          }

          await this.sourceRepository.save(updatedSource);
        }

        // Si la fuente falló o no retornó entradas, aislar y continuar con la siguiente (CA-4)
        if (!fetchSuccess || fetchedEntries.length === 0) {
          continue;
        }

        // 3. Validación en frontera de cada entrada (Zod)
        const validEntries: ContextEntry[] = [];
        for (const rawEntry of fetchedEntries) {
          const parsed = ContextEntrySchema.safeParse(rawEntry);
          if (parsed.success) {
            validEntries.push(parsed.data);
          }
        }

        totalFetched += validEntries.length;
        if (validEntries.length === 0) {
          continue;
        }

        // 4. Deduplicación térmica con context_memory (CA-5)
        const candidateIds = validEntries.map((e) => e.id);
        const existingDocs = await this.vectorStore.getByIds(CONTEXT_MEMORY_TABLE, candidateIds);
        const existingHashMap = new Map<string, string>();
        for (const doc of existingDocs) {
          const meta = doc.metadata as { contentHash?: string };
          if (meta && typeof meta.contentHash === 'string') {
            existingHashMap.set(doc.id, meta.contentHash);
          }
        }

        const entriesToEmbed: ContextEntry[] = [];
        for (const entry of validEntries) {
          if (existingHashMap.get(entry.id) === entry.contentHash) {
            totalDeduplicated += 1;
          } else {
            entriesToEmbed.push(entry);
          }
        }

        // 5. Vectorización verificada fail-closed (CA-6)
        const docsToPersist: VectorDocument[] = [];
        for (const entry of entriesToEmbed) {
          try {
            const emb = await this.embeddingPort.generateEmbedding(entry.summary);
            if (emb.source === 'fallback') {
              totalDiscardedFallback += 1;
              if (this.telemetryRepo) {
                await this.telemetryRepo.log(
                  new TelemetryEntry(
                    'WARN',
                    'LLM_ENGINE',
                    `[Context Ingestion] Vector descartado por origen fallback para entrada ${entry.id}`,
                    {
                      eventType: 'CONTEXT_FALLBACK_VECTOR_DISCARDED',
                      entryId: entry.id,
                      sourceTag: entry.sourceTag,
                    },
                    422
                  )
                );
              }
              continue;
            }

            docsToPersist.push({
              id: entry.id,
              vector: emb.vector,
              text: entry.summary,
              metadata: entry,
            });
          } catch {
            totalDiscardedFallback += 1;
          }
        }

        // 6. Persistencia hexagonal en context_memory (CA-7)
        if (docsToPersist.length > 0) {
          await this.vectorStore.upsert(CONTEXT_MEMORY_TABLE, docsToPersist);
          totalPersisted += docsToPersist.length;
        }
      }

      // 7. Caducidad higiénica al final de la ejecución (CA-8)
      const nowIso = new Date().toISOString();
      await this.vectorStore.delete(CONTEXT_MEMORY_TABLE, { expiredBefore: nowIso });

      const durationMs = Date.now() - startTime;
      const report: IngestionExecutionReport = {
        sourcesProcessed,
        sourcesDegraded,
        fetched: totalFetched,
        deduplicated: totalDeduplicated,
        persisted: totalPersisted,
        discardedFallback: totalDiscardedFallback,
        durationMs,
      };

      // 8. Telemetría de resumen de ejecución (CA-10)
      if (this.telemetryRepo) {
        await this.telemetryRepo.log(
          new TelemetryEntry(
            'INFO',
            'SYSTEM',
            `[Context Ingestion] Ingesta completada: ${totalPersisted} persistidos, ${totalDeduplicated} deduplicados, ${totalDiscardedFallback} descartados fallback, ${sourcesDegraded} fuentes degradadas.`,
            {
              eventType: 'CONTEXT_INGESTION_SUMMARY',
              ...report,
            },
            200,
            durationMs
          )
        );
      }

      return createSuccessEnvelope(report);
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);

      if (this.telemetryRepo) {
        await this.telemetryRepo.log(
          new TelemetryEntry(
            'ERROR',
            'SYSTEM',
            `[Context Ingestion] Fallo crítico durante la ingesta: ${errorMsg}`,
            { error: errorMsg },
            500,
            durationMs
          )
        );
      }

      return createErrorEnvelope([errorMsg], 500, 'Error crítico en el pipeline de ingesta');
    }
  }
}
