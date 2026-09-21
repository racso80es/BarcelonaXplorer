import { z } from 'zod';

export const FastInsightZodSchema = z.object({
  category: z.enum(['environmental', 'security', 'transit']),
  observation: z.string().min(5),
  severityLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});
