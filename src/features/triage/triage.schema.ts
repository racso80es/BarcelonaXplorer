import { z } from 'zod';
import { DefaultDensityPayloadSchema } from '@/domain/schemas/matrix';

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
 * Coordenadas GPS del explorador para anclaje perimetral.
 */
export const UserGpsLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type UserGpsLocation = z.infer<typeof UserGpsLocationSchema>;

/**
 * Enum y esquema de estado anímico del explorador (mood) para triaje adaptativo.
 */
export const MoodSchema = z.enum([
  'relaxed',
  'adventurous',
  'cultural',
  'gastronomic',
]);

export type Mood = z.infer<typeof MoodSchema>;

/**
 * DTO de entrada para la evaluación de triaje (Laudo 2: Gobernanza del Estado).
 * Acepta prompt, sessionId, opcionalmente matrixId, coordenadas GPS y estado anímico.
 */
export const TriageInputSchema = z.object({
  sessionId: z.string().min(1, 'sessionId es requerido'),
  prompt: z.string().min(1, 'El prompt no puede estar vacío'),
  matrixId: z.string().default('default'),
  userLocation: UserGpsLocationSchema.optional(),
  mood: MoodSchema.optional(),
});

export type TriageInputDto = z.infer<typeof TriageInputSchema>;

/**
 * DTO de salida estructurada del resultado de la Aduana (Laudo 1: Endpoint Único).
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
  detectedDistricts: z.array(z.string()).optional(),
  payload: DefaultDensityPayloadSchema.optional(),
  route: z.unknown().optional(),
  durationMs: z.number(),
});

export type TriageOutcomeDto = z.infer<typeof TriageOutcomeDtoSchema>;
