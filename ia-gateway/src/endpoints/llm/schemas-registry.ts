import { z } from 'zod';

export const TacticalRouteSchema = z.object({
  id: z.string(),
  summary: z.string(),
  waypoints: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
      coordinates: z
        .object({
          lat: z.number(),
          lng: z.number(),
        })
        .optional(),
      timeSpan: z
        .object({
          start: z.string(),
          end: z.string(),
        })
        .optional(),
      recommendations: z.array(z.string()).optional(),
    })
  ),
});

export const FastInsightSchema = z.object({
  category: z.string(),
  observation: z.string(),
  severityLevel: z.number().optional(),
});

export const GenericJsonSchema = z.record(z.string(), z.unknown());

export const ContextEntryItemSchema = z.object({
  id: z.string().min(1),
  sourceTag: z.string().min(1),
  category: z.enum(['EVENT', 'VENUE', 'POI', 'NEWS']),
  title: z.string().min(3).max(200),
  summary: z.string().min(10).max(1200),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  location: z
    .object({
      name: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .optional(),
  url: z.string().url().optional(),
  price: z.string().optional(),
  tags: z.array(z.string()).default([]),
  expiresAt: z.string().datetime().optional(),
});

export const ContextEntriesSchema = z.object({
  entries: z.array(ContextEntryItemSchema),
});

const registry: Record<string, z.ZodTypeAny> = {
  'tactical-route': TacticalRouteSchema,
  'fast-insight': FastInsightSchema,
  'generic-json': GenericJsonSchema,
  'context-entries': ContextEntriesSchema,
};

export function getZodSchemaById(schemaId?: string): z.ZodTypeAny {
  if (!schemaId) {
    return GenericJsonSchema;
  }
  const found = registry[schemaId];
  return found ?? GenericJsonSchema;
}
