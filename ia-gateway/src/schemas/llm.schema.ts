import { z } from 'zod';

export const GatewayMetricsSchema = z.object({
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
  grounded: z.boolean().default(false),
});

export type GatewayMetrics = z.infer<typeof GatewayMetricsSchema>;

export const LlmGenerateInputSchema = z
  .object({
    prompt: z.string().min(1, 'El prompt no puede estar vacío'),
    engineType: z.enum(['FAST_LLM', 'REASONING_LLM']),
    responseFormat: z.enum(['text', 'json']).default('text'),
    schemaId: z.string().optional(),
    systemInstruction: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    grounding: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.responseFormat === 'json' && !data.schemaId) {
        return false;
      }
      return true;
    },
    {
      message: 'schemaId es obligatorio cuando responseFormat es "json"',
      path: ['schemaId'],
    }
  )
  .refine(
    (data) => {
      if (data.grounding && data.engineType === 'FAST_LLM') {
        return false;
      }
      return true;
    },
    {
      message: 'grounding solo se admite con engineType REASONING_LLM',
      path: ['grounding'],
    }
  );

export type LlmGenerateInput = z.infer<typeof LlmGenerateInputSchema>;

export const LlmGenerateOutputSchema = z.object({
  text: z.string(),
  json: z.record(z.string(), z.unknown()).optional(),
  metrics: GatewayMetricsSchema,
});

export type LlmGenerateOutput = z.infer<typeof LlmGenerateOutputSchema>;
