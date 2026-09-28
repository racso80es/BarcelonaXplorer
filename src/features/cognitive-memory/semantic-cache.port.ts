/**
 * Puerto de Caché Semántica Vectorial (PBI-COGN-CACHE-001, PBI-STEEL-003)
 */

import type {
  CachedSemanticTriageResult,
  SemanticCacheLookup,
  SemanticCacheStore,
} from './cached-triage.schema';

export interface CachedTriageResult {
  prompt: string;
  result: CachedSemanticTriageResult;
  similarity: number;
  tokensSaved: number;
  createdAt: Date;
}

export interface ISemanticCachePort {
  get(lookup: SemanticCacheLookup): Promise<CachedTriageResult | null>;

  set(entry: SemanticCacheStore): Promise<void>;
}

export type { CachedSemanticTriageResult, SemanticCacheLookup, SemanticCacheStore };
