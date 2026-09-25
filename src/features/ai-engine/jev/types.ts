import { z } from 'zod';

/**
 * Esquema para un modelo individual devuelto por /api/v1/models.
 */
export const JevModelItemSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export type JevModelItem = z.infer<typeof JevModelItemSchema>;

/**
 * Esquema de respuesta para el endpoint de discovery /api/v1/models.
 */
export const JevModelsResponseSchema = z.object({
  models: z.array(JevModelItemSchema),
});

export type JevModelsResponse = z.infer<typeof JevModelsResponseSchema>;

/**
 * Esquema de respuesta de una pregunta Noul (probabilidad yes/no).
 */
export const JevNoulAnswerSchema = z.object({
  type: z.literal('noul'),
  noul: z.number().min(0).max(1),
});

export type JevNoulAnswer = z.infer<typeof JevNoulAnswerSchema>;

/**
 * Esquema de respuesta de una pregunta Choice.
 */
export const JevChoiceAnswerSchema = z.object({
  type: z.literal('choice'),
  choice: z.string(),
  probabilities: z.record(z.string(), z.number()),
  confidence: z.number().min(0).max(1).optional().default(1),
});

export type JevChoiceAnswer = z.infer<typeof JevChoiceAnswerSchema>;

/**
 * Esquema unión discriminada de respuestas Jev.
 */
export const JevAnswerItemSchema = z.discriminatedUnion('type', [
  JevNoulAnswerSchema,
  JevChoiceAnswerSchema,
]);

export type JevAnswerItem = z.infer<typeof JevAnswerItemSchema>;

/**
 * Esquema de respuesta completo de POST /api/v1/systemone.
 */
export const JevSystemOneResponseSchema = z.object({
  model: z.string(),
  answers: z.record(z.string(), z.union([JevNoulAnswerSchema, JevChoiceAnswerSchema, z.record(z.string(), z.unknown())])),
  usage: z
    .object({
      input_tokens: z.number().optional(),
      output_tokens: z.number().optional(),
    })
    .optional(),
});

export type JevSystemOneResponse = z.infer<typeof JevSystemOneResponseSchema>;
