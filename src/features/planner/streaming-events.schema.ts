import { z } from 'zod';
import {
  EnrichedRouteSchema,
  EnrichedWaypointSchema,
  WaypointOptionSchema,
  AffiliateProviderSchema,
} from './affiliate/affiliate-enricher.schema';

export const MetaInitDataSchema = z.object({
  id: z.string(),
  summary: z.string(),
  totalEstimatedWaypoints: z.number().int().nonnegative().optional(),
  timestamp: z.string(),
});
export type MetaInitData = z.infer<typeof MetaInitDataSchema>;

export const MetaInitEventSchema = z.object({
  type: z.literal('meta_init'),
  data: MetaInitDataSchema,
});
export type MetaInitEvent = z.infer<typeof MetaInitEventSchema>;

export const StopEmittedEventSchema = z.object({
  type: z.literal('stop_emitted'),
  data: EnrichedWaypointSchema,
});
export type StopEmittedEvent = z.infer<typeof StopEmittedEventSchema>;

export const AffiliateInjectedDataSchema = z.object({
  waypointId: z.string(),
  affiliateProvider: AffiliateProviderSchema.default('NONE'),
  affiliateUrl: z.string().url().optional(),
  options: z.array(WaypointOptionSchema).default([]),
});
export type AffiliateInjectedData = z.infer<typeof AffiliateInjectedDataSchema>;

export const AffiliateInjectedEventSchema = z.object({
  type: z.literal('affiliate_injected'),
  data: AffiliateInjectedDataSchema,
});
export type AffiliateInjectedEvent = z.infer<typeof AffiliateInjectedEventSchema>;

export const StreamCompleteEventSchema = z.object({
  type: z.literal('stream_complete'),
  data: EnrichedRouteSchema,
});
export type StreamCompleteEvent = z.infer<typeof StreamCompleteEventSchema>;

export const StreamErrorDataSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
});
export type StreamErrorData = z.infer<typeof StreamErrorDataSchema>;

export const StreamErrorEventSchema = z.object({
  type: z.literal('stream_error'),
  data: StreamErrorDataSchema,
});
export type StreamErrorEvent = z.infer<typeof StreamErrorEventSchema>;

export const OrchestratorStreamEventSchema = z.discriminatedUnion('type', [
  MetaInitEventSchema,
  StopEmittedEventSchema,
  AffiliateInjectedEventSchema,
  StreamCompleteEventSchema,
  StreamErrorEventSchema,
]);

export type OrchestratorStreamEvent = z.infer<typeof OrchestratorStreamEventSchema>;

/**
 * Helper determinista para codificar un evento de streaming en formato SSE estándar
 */
export function formatSseMessage(event: OrchestratorStreamEvent): string {
  const validated = OrchestratorStreamEventSchema.parse(event);
  return `data: ${JSON.stringify(validated)}\n\n`;
}
