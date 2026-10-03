import { z } from 'zod';

/**
 * Esquema determinista y estricto para la sonda de presencia logística de Jev (PBI-ARCH-JEV-002).
 * Ceguera conversacional: únicamente cuatro banderas booleanas correspondientes a las variables canónicas.
 */
export const DensityPresenceProbeSchema = z
  .object({
    has_time_window: z.boolean(),
    has_group_size: z.boolean(),
    has_vibe: z.boolean(),
    has_constraints: z.boolean(),
  })
  .strict();

export type DensityPresenceProbe = z.infer<typeof DensityPresenceProbeSchema>;
