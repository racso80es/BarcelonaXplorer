import { z } from 'zod';

export const ContextSourceTypeSchema = z.enum([
  'API_REST',
  'SOCRATA',
  'JSON_LD',
  'ICAL',
  'RSS',
  'SPARQL',
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
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export type ContextSourceSnapshot = z.infer<typeof ContextSourceSnapshotSchema>;

export interface TransitionMetadata {
  now?: Date;
  error?: string;
  supersedesSourceTag?: string;
}
