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

const registry: Record<string, z.ZodTypeAny> = {
  'tactical-route': TacticalRouteSchema,
  'fast-insight': FastInsightSchema,
  'generic-json': GenericJsonSchema,
};

export function getZodSchemaById(schemaId?: string): z.ZodTypeAny {
  if (!schemaId) {
    return GenericJsonSchema;
  }
  const found = registry[schemaId];
  return found ?? GenericJsonSchema;
}
