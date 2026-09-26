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

/**
 * Eventos Sensorizados de Orquestación Híbrida (PBI-OPS-TELEM-002)
 */

export const TriageRoutedEventSchema = z.object({
  eventType: z.literal('TRIAGE_ROUTED'),
  sessionId: z.string(),
  intent: z.enum(['dialogue', 'logistics', 'rebound']),
  decisionEngine: z.string().default('jev-ai'),
  model: z.string().optional(),
  promptLength: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  statusCode: z.number().int().default(200),
  tokenEstimate: z.number().int().nonnegative().optional(),
  tokensSaved: z.number().int().nonnegative().optional(),
});

export type TriageRoutedEvent = z.infer<typeof TriageRoutedEventSchema>;

export const DensityThresholdCheckEventSchema = z.object({
  eventType: z.literal('DENSITY_THRESHOLD_CHECK'),
  sessionId: z.string(),
  score: z.number().min(0).max(100),
  survivalThreshold: z.number().min(0).max(100),
  isSatisfied: z.boolean(),
  missingVariable: z.string().optional(),
  durationMs: z.number().int().nonnegative(),
  statusCode: z.number().int().default(200),
});

export type DensityThresholdCheckEvent = z.infer<typeof DensityThresholdCheckEventSchema>;

export const ProviderAffiliateFetchEventSchema = z.object({
  eventType: z.literal('PROVIDER_AFFILIATE_FETCH'),
  sessionId: z.string(),
  provider: z.enum(['THEFORK', 'CIVITATIS', 'NONE']),
  query: z.string(),
  optionsGenerated: z.number().int().nonnegative(),
  durationMs: z.number().int().nonnegative(),
  statusCode: z.number().int().default(200),
});

export type ProviderAffiliateFetchEvent = z.infer<typeof ProviderAffiliateFetchEventSchema>;

export const HybridOrchestrationEventSchema = z.discriminatedUnion('eventType', [
  TriageRoutedEventSchema,
  DensityThresholdCheckEventSchema,
  ProviderAffiliateFetchEventSchema,
]);

export type HybridOrchestrationEvent = z.infer<typeof HybridOrchestrationEventSchema>;
