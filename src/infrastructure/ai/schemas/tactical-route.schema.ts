import { z } from 'zod';

export const GeoCoordinatesZodSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const TimeSpanZodSchema = z.object({
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
});

export const TacticalWaypointZodSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  coordinates: GeoCoordinatesZodSchema.optional(),
  timeSpan: TimeSpanZodSchema.optional(),
  recommendations: z.array(z.string()).optional(),
});

export const TacticalRouteZodSchema = z.object({
  id: z.string(),
  summary: z.string(),
  waypoints: z.array(TacticalWaypointZodSchema),
});
