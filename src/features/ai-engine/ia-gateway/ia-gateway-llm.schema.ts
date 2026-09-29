import { z } from 'zod';
import {
  createGatewayEnvelopeSchema,
  IaGatewayMetricsSchema,
} from './ia-gateway-common.schema';

export const IaGatewayLlmResultSchema = z.object({
  text: z.string(),
  json: z.record(z.string(), z.unknown()).optional(),
  metrics: IaGatewayMetricsSchema,
});

export type IaGatewayLlmResult = z.infer<typeof IaGatewayLlmResultSchema>;
export const IaGatewayLlmEnvelopeSchema = createGatewayEnvelopeSchema(IaGatewayLlmResultSchema);
