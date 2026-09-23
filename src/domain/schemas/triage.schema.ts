import { z } from 'zod';
import { DefaultDensityPayloadSchema } from './matrix';

/**
 * Estados posibles del triaje entrópico en la Aduana Universal.
 */
export const TriageStatusSchema = z.enum([
  'REBOUND_OUT_OF_SCOPE',
  'INCOMPLETE_REPROMPT',
  'DISPATCH_READY',
]);

export type TriageStatus = z.infer<typeof TriageStatusSchema>;

/**
 * DTO de entrada para la evaluación de triaje (Laudo 2: Gobernanza del Estado).
 * Queda estrictamente prohibido recibir el estado acumulado desde el cliente.
 * El DTO de entrada solo contiene prompt, sessionId y opcionalmente matrixId.
 */
export const TriageInputSchema = z.object({
  sessionId: z.string().min(1, 'sessionId es requerido'),
  prompt: z.string().min(1, 'El prompt no puede estar vacío'),
  matrixId: z.string().default('default'),
});

export type TriageInputDto = z.infer<typeof TriageInputSchema>;

/**
 * DTO de salida estructurada del resultado de la Aduana (Laudo 1: Endpoint Único).
 * Cuando el umbral de la matriz se satisface (DISPATCH_READY), incluye internamente
 * la ruta táctica forjada por el orquestador pesado (Gemini).
 */
export const TriageOutcomeDtoSchema = z.object({
  status: TriageStatusSchema,
  sessionId: z.string(),
  matrixId: z.string(),
  score: z.number().min(0).max(100),
  survivalThreshold: z.number().min(0).max(100),
  isThresholdSatisfied: z.boolean(),
  bounceMessage: z.string().optional(),
  repromptMessage: z.string().optional(),
  missingVariable: z.string().optional(),
  rejectedEntity: z.string().optional(),
  payload: DefaultDensityPayloadSchema.optional(),
  route: z.unknown().optional(),
  durationMs: z.number(),
});

export type TriageOutcomeDto = z.infer<typeof TriageOutcomeDtoSchema>;
