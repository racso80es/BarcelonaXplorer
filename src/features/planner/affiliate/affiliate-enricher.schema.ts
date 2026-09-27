import { z } from 'zod';
import { GeoCoordinatesZodSchema, TimeSpanZodSchema } from '../tactical-route.schema';

export const AffiliateProviderSchema = z.enum(['THEFORK', 'CIVITATIS', 'NONE']);
export type AffiliateProvider = z.infer<typeof AffiliateProviderSchema>;

export const PickpocketAlertLevelEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'EXTREME']);
export type PickpocketAlertLevel = z.infer<typeof PickpocketAlertLevelEnum>;

export const TacticalMetadataSchema = z.object({
  antiTrapShield: z.object({
    warnings: z.array(z.string().max(250)).default([]),
    recommendedAlternatives: z.array(z.string().max(250)).default([]),
  }).optional(),
  microLogistics: z.object({
    pickpocketAlertLevel: PickpocketAlertLevelEnum.default('LOW'),
    transitTips: z.string().max(300).optional(),
    realWalkingTimeMinutes: z.number().int().nonnegative().optional(),
  }).optional(),
  environmentalConditions: z.object({
    rainFriendly: z.boolean().default(true),
    requiresDaylight: z.boolean().default(false),
  }).optional(),
});

export type TacticalMetadata = z.infer<typeof TacticalMetadataSchema>;

export const PlacementTriggerEnum = z.enum([
  'POST_WARNING',
  'ROUTE_END',
  'HIGH_QUEUE_MONUMENT',
  'MEAL_TIME',
]);
export type PlacementTrigger = z.infer<typeof PlacementTriggerEnum>;

export const WaypointOptionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  provider: AffiliateProviderSchema,
  affiliateUrl: z.string().url().optional(),
  priceEstimate: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  isSelected: z.boolean().default(false),
  placementTrigger: PlacementTriggerEnum.optional(),
  isPriorityAccess: z.boolean().optional(),
  ctaLabel: z.string().optional(),
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
  tacticalMetadata: TacticalMetadataSchema.optional(),
});

export type EnrichedWaypoint = z.infer<typeof EnrichedWaypointSchema>;

export const EnrichedRouteSchema = z.object({
  id: z.string(),
  summary: z.string(),
  thermalState: z.enum(['operational', 'saturated']).optional(),
  waypoints: z.array(EnrichedWaypointSchema),
});



export type EnrichedRoute = z.infer<typeof EnrichedRouteSchema>;

