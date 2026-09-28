import { z } from 'zod';

export const PatrolRequestSchema = z
  .object({
    sessionId: z.string().uuid().optional(),
    fatigueThresholdKm: z.number().positive().max(500).optional(),
  })
  .strict();

export type PatrolRequestDto = z.infer<typeof PatrolRequestSchema>;
