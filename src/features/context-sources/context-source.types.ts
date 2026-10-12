import { z } from 'zod';

export const ContextSourceTypeSchema = z.enum([
  'API_REST',
  'SOCRATA',
  'JSON_LD',
  'ICAL',
  'RSS',
  'SPARQL',
  'CKAN_DATASTORE',
]);
export type ContextSourceType = z.infer<typeof ContextSourceTypeSchema>;

export const ContextSourceStatusSchema = z.enum([
  'ACTIVE',
  'DEGRADED',
  'PENDING_APPROVAL',
  'INACTIVE',
]);
export type ContextSourceStatus = z.infer<typeof ContextSourceStatusSchema>;

export const ContextSourceCategorySchema = z.enum(['EVENT', 'VENUE', 'POI', 'NEWS']);
export type ContextSourceCategory = z.infer<typeof ContextSourceCategorySchema>;

export const StateMachineActorSchema = z.enum(['HUMAN', 'CRON', 'ARGOS']);
export type StateMachineActor = z.infer<typeof StateMachineActorSchema>;

export const StateMachineEventSchema = z.enum([
  'APPROVE',
  'REJECT',
  'INGEST_OK',
  'INGEST_FAIL',
  'REACTIVATE',
  'PROPOSE_CORRECTION',
  'DEACTIVATE',
]);
export type StateMachineEvent = z.infer<typeof StateMachineEventSchema>;

export const CkanResourceSelectorSchema = z
  .object({
    format: z.string().min(1),
    datastoreActive: z.boolean(),
  })
  .strict();
export type CkanResourceSelector = z.infer<typeof CkanResourceSelectorSchema>;

export const CkanFieldMapSchema = z
  .object({
    externalId: z.string().min(1),
    title: z.string().min(1),
    summary: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
    startsAt: z.string().min(1).optional(),
    endsAt: z.string().min(1).optional(),
    locationName: z.string().min(1).optional(),
    lat: z.string().min(1).optional(),
    lng: z.string().min(1).optional(),
    tags: z.union([z.string().min(1), z.array(z.string().min(1))]).optional(),
    price: z.string().min(1).optional(),
    url: z.string().min(1).optional(),
    htmlFields: z.array(z.string().min(1)).optional(),
  })
  .strict();
export type CkanFieldMap = z.infer<typeof CkanFieldMapSchema>;

export const CkanDatastoreExtractionConfigSchema = z
  .object({
    strategy: z.literal('CKAN_DATASTORE'),
    dataset: z.string().min(1),
    resourceSelector: CkanResourceSelectorSchema,
    fieldMap: CkanFieldMapSchema,
    pageSize: z.number().int().positive(),
    maxRecords: z.number().int().positive(),
    timeoutMs: z.number().int().positive(),
    groupBy: z.string().min(1).optional(),
  })
  .strict();
export type CkanDatastoreExtractionConfig = z.infer<typeof CkanDatastoreExtractionConfigSchema>;

export const ExtractionConfigSchema = z.discriminatedUnion('strategy', [
  CkanDatastoreExtractionConfigSchema,
]);
export type ExtractionConfig = z.infer<typeof ExtractionConfigSchema>;

export const ContextSourceSnapshotSchema = z.object({
  id: z.string().min(1),
  sourceTag: z.string().min(1).max(64),
  displayName: z.string().min(1).max(191),
  endpoint: z.string().min(1).max(2048),
  type: ContextSourceTypeSchema,
  category: ContextSourceCategorySchema,
  status: ContextSourceStatusSchema,
  failedAttempts: z.number().int().nonnegative().default(0),
  lastSuccessAt: z.date().nullable().optional(),
  lastErrorAt: z.date().nullable().optional(),
  lastError: z.string().max(512).nullable().optional(),
  proposedBy: z.enum(['SEED', 'HUMAN', 'ARGOS']).default('SEED'),
  supersedesSourceTag: z.string().max(64).nullable().optional(),
  extractionConfig: ExtractionConfigSchema.nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export type ContextSourceSnapshot = z.infer<typeof ContextSourceSnapshotSchema>;

export interface TransitionMetadata {
  now?: Date;
  error?: string;
  supersedesSourceTag?: string;
}

