import { z } from 'zod';
import {
  createGatewayEnvelopeSchema,
  IaGatewayMetricsSchema,
} from './ia-gateway-common.schema';

export const IaGatewayNoulResultSchema = z.object({
  primitive: z.literal('noul'),
  probability: z.number().min(0).max(1),
  isAffirmative: z.boolean(),
  metrics: IaGatewayMetricsSchema,
});

export type IaGatewayNoulResult = z.infer<typeof IaGatewayNoulResultSchema>;
export const IaGatewayNoulEnvelopeSchema = createGatewayEnvelopeSchema(IaGatewayNoulResultSchema);

export const IaGatewayChoiceResultSchema = z.object({
  primitive: z.literal('choice'),
  selectedChoice: z.string(),
  confidence: z.number().min(0).max(1),
  probabilities: z.record(z.string(), z.number()),
  metrics: IaGatewayMetricsSchema,
});

export type IaGatewayChoiceResult = z.infer<typeof IaGatewayChoiceResultSchema>;
export const IaGatewayChoiceEnvelopeSchema = createGatewayEnvelopeSchema(IaGatewayChoiceResultSchema);

export const IaGatewayProviderHealthSchema = z.object({
  provider: z.string(),
  circuitState: z.enum(['CLOSED', 'OPEN', 'HALF_OPEN']).optional(),
  operationalStatus: z.enum(['HEALTHY', 'DEGRADED', 'UNHEALTHY']).optional(),
  consecutiveFailures: z.number().optional(),
  lastFailureTime: z.number().nullable().optional(),
  lastSuccessTime: z.number().nullable().optional(),
  recentSampleCount: z.number().optional(),
  averageLatencyMs: z.number().optional(),
  errorRate: z.number().optional(),
  activeProbeSuccess: z.boolean().optional(),
  hasCredential: z.boolean().optional(),
  configuredModel: z.string().optional(),
});

export type IaGatewayProviderHealth = z.infer<typeof IaGatewayProviderHealthSchema>;

export const IaGatewayHealthResultSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  providers: z.record(z.string(), IaGatewayProviderHealthSchema.passthrough()).optional(),
});

export type IaGatewayHealthResult = z.infer<typeof IaGatewayHealthResultSchema>;
export const IaGatewayHealthEnvelopeSchema = createGatewayEnvelopeSchema(IaGatewayHealthResultSchema);
