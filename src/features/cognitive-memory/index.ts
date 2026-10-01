// ═══════════════════════════════════════════════════════════════
// Vertical Slice: Cognitive Memory & LanceDB — Superficie de Dominio Puro
// Marco Constitucional: Protocolo de Acero — Grado S+ (PBI-STEEL-022)
// Infraestructura y adaptadores de base de datos en ./server
// ═══════════════════════════════════════════════════════════════

export {
  DenseSemanticMatrix,
  type DenseSemanticMatrixProps,
} from './dense-semantic-matrix.vo';

export type {
  ICognitiveMemoryPort,
  CognitiveMemoryItem,
} from './cognitive-memory.port';

export type {
  ICognitiveMetricsPort,
  CognitiveMetricsSummary,
} from './cognitive-metrics.port';

export type {
  IVectorStorePort,
  VectorDocument,
  VectorSearchResult,
  VectorStorePingResult,
  VectorDeleteFilter,
} from './vector-store.port';

export type {
  AuditLanceDbHealthUseCasePort,
  AuditLanceDbHealthResult,
  LanceDbHealthState,
} from './audit-lancedb-health.use-case.port';

export type {
  ISemanticCachePort,
  CachedTriageResult,
  CachedSemanticTriageResult,
  SemanticCacheLookup,
  SemanticCacheStore,
} from './semantic-cache.port';

export {
  CachedSemanticTriageResultSchema,
  TRIAGE_SEMANTIC_CACHE_POLICY,
} from './cached-triage.schema';

export {
  IndexSessionMemoryService,
  COGNITIVE_MEMORY_INDEXING_POLICY,
  type MemoryIndexingOutcome,
  type MemoryIndexingResult,
} from './index-session-memory.service';

export {
  MEMORY_VARIABLE_DURABILITY,
  CognitiveMemoryMetadataSchema,
  type CognitiveMemoryMetadata,
} from './cognitive-memory-metadata.schema';
