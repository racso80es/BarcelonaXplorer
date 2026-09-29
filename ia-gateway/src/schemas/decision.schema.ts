import { z } from 'zod';
import { GatewayMetricsSchema } from './llm.schema.js';

export const DecisionNoulInputSchema = z.object({
  primitive: z.literal('noul'),
  state: z.string(),
  instruction: z.string().min(1, 'La instrucción no puede estar vacía'),
});

export const DecisionChoiceInputSchema = z.object({
  primitive: z.literal('choice'),
  state: z.string(),
  instruction: z.string().min(1, 'La instrucción no puede estar vacía'),
  choices: z.array(z.string().min(1)).min(2, 'Se requieren al menos 2 opciones para evaluar choice'),
});

export const DecisionInputSchema = z.discriminatedUnion('primitive', [
  DecisionNoulInputSchema,
  DecisionChoiceInputSchema,
]);

export type DecisionInput = z.infer<typeof DecisionInputSchema>;

export const DecisionNoulOutputSchema = z.object({
  primitive: z.literal('noul'),
  probability: z.number().min(0).max(1),
  isAffirmative: z.boolean(),
  metrics: GatewayMetricsSchema,
});

export const DecisionChoiceOutputSchema = z.object({
  primitive: z.literal('choice'),
  selectedChoice: z.string(),
  confidence: z.number().min(0).max(1),
  probabilities: z.record(z.string(), z.number()),
  metrics: GatewayMetricsSchema,
});

export const DecisionOutputSchema = z.discriminatedUnion('primitive', [
  DecisionNoulOutputSchema,
  DecisionChoiceOutputSchema,
]);

export type DecisionOutput = z.infer<typeof DecisionOutputSchema>;
