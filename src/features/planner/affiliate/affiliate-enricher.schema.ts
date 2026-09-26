import { z } from 'zod';
import { GeoCoordinatesZodSchema, TimeSpanZodSchema } from '../tactical-route.schema';

export const AffiliateProviderSchema = z.enum(['THEFORK', 'CIVITATIS', 'NONE']);
export type AffiliateProvider = z.infer<typeof AffiliateProviderSchema>;

export const WaypointOptionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  provider: AffiliateProviderSchema,
  affiliateUrl: z.string().url().optional(),
  priceEstimate: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  isSelected: z.boolean().default(false),
});

export type WaypointOption = z.infer<typeof WaypointOptionSchema>;

export const EnrichedWaypointSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(['GASTRONOMY', 'CULTURE', 'ACTIVITY', 'TRANSIT', 'GENERAL']).default('GENERAL'),
  coordinates: GeoCoordinatesZodSchema.optional(),
  timeSpan: TimeSpanZodSchema.optional(),
  recommendations: z.array(z.string()).default([]),
  affiliateProvider: AffiliateProviderSchema.default('NONE'),
  affiliateUrl: z.string().url().optional(),
  options: z.array(WaypointOptionSchema).default([]),
});

export type EnrichedWaypoint = z.infer<typeof EnrichedWaypointSchema>;

export const EnrichedRouteSchema = z.object({
  id: z.string(),
  summary: z.string(),
  waypoints: z.array(EnrichedWaypointSchema),
});

export type EnrichedRoute = z.infer<typeof EnrichedRouteSchema>;
