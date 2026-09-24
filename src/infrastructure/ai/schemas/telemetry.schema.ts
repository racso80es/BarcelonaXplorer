import { z } from 'zod';

export const TelemetryLevelEnum = z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']);

export const TelemetryContextEnum = z.enum([
  'CLIENT_UI',
  'SERVER_API',
  'LLM_ENGINE',
  'SYSTEM',
  'SECURITY_PERIMETER',
]);

/**
 * Escudo Zod: Esquema de validación para entradas de telemetría hacia /api/telemetry/log.
 */
export const TelemetryLogInputSchema = z.object({
  level: TelemetryLevelEnum.default('INFO'),
  context: TelemetryContextEnum,
  message: z.string().min(1, 'El mensaje es obligatorio').max(512, 'El mensaje excede los 512 caracteres'),
  payload: z
    .record(z.string(), z.unknown())
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (val === undefined || val === null) {
          return true;
        }
        try {
          return JSON.stringify(val).length <= 65536;
        } catch {
          return false;
        }
      },
      'El payload excede el límite máximo de 64KB o no es serializable'
    ),
  statusCode: z.number().int().optional().nullable(),
  durationMs: z.number().int().nonnegative().optional().nullable(),
  environment: z.string().max(32).optional().default('production'),
});

export type TelemetryLogInput = z.infer<typeof TelemetryLogInputSchema>;
