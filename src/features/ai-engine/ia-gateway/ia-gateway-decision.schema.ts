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

export const IaGatewayHealthResultSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  providers: z.record(z.string(), z.unknown()).optional(),
});

export type IaGatewayHealthResult = z.infer<typeof IaGatewayHealthResultSchema>;
export const IaGatewayHealthEnvelopeSchema = createGatewayEnvelopeSchema(IaGatewayHealthResultSchema);
