import { z } from 'zod';
import { TriageStatusSchema } from '@/features/triage/triage.schema';
import { SupportedLanguageSchema } from '@/features/i18n';

/**
 * Payload mínimo almacenado en caché semántica (PBI-STEEL-003 CA-2).
 * Sin sessionId, payload de matriz, itinerario ni rutas.
 */
export const CachedSemanticTriageResultSchema = z.object({
  status: z.enum(['CASUAL_DIALOGUE', 'REBOUND_OUT_OF_SCOPE']),
  dialogueMessage: z.string().optional(),
  bounceMessage: z.string().optional(),
  rejectedEntity: z.string().optional(),
});

export type CachedSemanticTriageResult = z.infer<typeof CachedSemanticTriageResultSchema>;

/** Matriz declarativa de estados cacheables (PBI-STEEL-003 CA-1). */
export const TRIAGE_SEMANTIC_CACHE_POLICY: Record<
  z.infer<typeof TriageStatusSchema>,
  { cacheable: boolean }
> = {
  CASUAL_DIALOGUE: { cacheable: true },
  REBOUND_OUT_OF_SCOPE: { cacheable: true },
  INCOMPLETE_REPROMPT: { cacheable: false },
  DISPATCH_READY: { cacheable: false },
};

export const SemanticCacheLookupSchema = z.object({
  vector: z.array(z.number()).min(1),
  matrixId: z.string().min(1),
  language: SupportedLanguageSchema,
});

export type SemanticCacheLookup = z.infer<typeof SemanticCacheLookupSchema>;

export const SemanticCacheStoreSchema = SemanticCacheLookupSchema.extend({
  prompt: z.string().min(1),
  payload: CachedSemanticTriageResultSchema,
  tokensSaved: z.number().int().positive().optional(),
});

export type SemanticCacheStore = z.infer<typeof SemanticCacheStoreSchema>;
