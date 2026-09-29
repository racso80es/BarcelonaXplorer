import { z } from 'zod';

export const IaGatewayMetricsSchema = z.object({
  engineType: z.enum(['FAST_LLM', 'REASONING_LLM', 'TYPED_DECISION']),
  provider: z.enum(['GOOGLE', 'GROQ', 'JEV']),
  modelId: z.string(),
  promptTokens: z.number().int().nonnegative().nullable(),
  completionTokens: z.number().int().nonnegative().nullable(),
  totalTokens: z.number().int().nonnegative().nullable(),
  fallbackTriggered: z.boolean(),
  attemptedProviders: z.array(z.string()),
  attemptedModels: z.array(z.string()).default([]),
  durationMs: z.number().nonnegative(),
});

export type IaGatewayMetrics = z.infer<typeof IaGatewayMetricsSchema>;

export const createGatewayEnvelopeSchema = <T extends z.ZodTypeAny>(resultSchema: T) =>
  z.object({
    success: z.boolean(),
    exitCode: z.number().int(),
    result: resultSchema.optional(),
    feedback: z.string().optional(),
    errors: z.array(z.string()).optional(),
  });
