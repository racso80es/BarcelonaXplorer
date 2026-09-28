// ═══════════════════════════════════════════════════════════════
// Vertical Slice: Cognitive Memory & LanceDB Vector Store
// Marco Constitucional: Protocolo de Acero — Grado S+
// ═══════════════════════════════════════════════════════════════

export {
  DenseSemanticMatrix,
  type DenseSemanticMatrixProps,
} from './dense-semantic-matrix.vo';

export {
  type ICognitiveMemoryPort,
  type CognitiveMemoryItem,
} from './cognitive-memory.port';

export {
  type ICognitiveMetricsPort,
  type CognitiveMetricsSummary,
} from './cognitive-metrics.port';

export {
  type IVectorStorePort,
  type VectorDocument,
  type VectorSearchResult,
  type VectorStorePingResult,
  type VectorDeleteFilter,
} from './vector-store.port';

export {
  type AuditLanceDbHealthUseCasePort,
  type AuditLanceDbHealthResult,
  type LanceDbHealthState,
} from './audit-lancedb-health.use-case.port';

export {
  type ISemanticCachePort,
  type CachedTriageResult,
  type CachedSemanticTriageResult,
  type SemanticCacheLookup,
  type SemanticCacheStore,
} from './semantic-cache.port';

export {
  CachedSemanticTriageResultSchema,
  TRIAGE_SEMANTIC_CACHE_POLICY,
} from './cached-triage.schema';

export { AuditLanceDbHealthUseCase } from './audit-lancedb-health.use-case';
export { LanceDbCognitiveMemoryAdapter } from './lancedb-cognitive-memory.adapter';
export { LanceDbVectorAdapter } from './lancedb-vector.adapter';
export { LanceDbSemanticCacheAdapter } from './lancedb-semantic-cache.adapter';
export { PrismaCognitiveMetricsRepository } from './prisma-cognitive-metrics.repository';
export {
  getLanceDbConnection,
  resolveLanceDbUri,
  resetLanceDbConnection,
} from './lancedb-client';
