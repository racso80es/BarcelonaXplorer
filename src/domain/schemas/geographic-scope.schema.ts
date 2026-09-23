import { z } from 'zod';

/**
 * Esquema Zod perimetral para el triaje y normalización geográfica.
 *
 * Cumple con el dogma de cero tolerancia al tipo 'any' en la aduana de datos.
 */
export const GeographicScopeResultSchema = z.object({
  is_barcelona_scope: z.boolean(),
  canonical_city: z.string().default('Barcelona'),
  detected_districts: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  out_of_scope_entity: z.string().optional(),
});

export type GeographicScopeResultDto = z.infer<typeof GeographicScopeResultSchema>;

/**
 * Esquema para la entrada del caso de uso de validación geográfica.
 */
export const ValidateGeographicScopeInputSchema = z.object({
  prompt: z.string().min(1, 'El prompt no puede estar vacío'),
  userLocation: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});

export type ValidateGeographicScopeInputDto = z.infer<
  typeof ValidateGeographicScopeInputSchema
>;
