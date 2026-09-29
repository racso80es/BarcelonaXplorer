import { NextResponse } from 'next/server';
import { IaGatewayClient } from '@/features/ai-engine/server';
import {
  createSuccessEnvelope,
  createErrorEnvelope,
  OperationEnvelope,
} from '@/shared/operation-envelope';

export const dynamic = 'force-dynamic';

export interface IaGatewayHealthStatus {
  status: 'healthy' | 'degraded';
  latencyMs: number;
}

export function createHealthHandler(
  clientFactory: () => { evaluateHealth: () => ReturnType<IaGatewayClient['evaluateHealth']> } = () =>
    new IaGatewayClient()
) {
  return async function GET(): Promise<NextResponse<OperationEnvelope<IaGatewayHealthStatus>>> {
    try {
      const client = clientFactory();
      const probe = await client.evaluateHealth();

      if (probe.isHealthy) {
        return NextResponse.json(
          createSuccessEnvelope(
            { status: 'healthy', latencyMs: probe.latencyMs },
            'IA Gateway operacional'
          ),
          { status: 200 }
        );
      }

      const errorMessage =
        probe.error ?? `IA Gateway no saludable (código HTTP ${probe.statusCode ?? 'desconocido'})`;

      return NextResponse.json(
        createErrorEnvelope<IaGatewayHealthStatus>(
          [errorMessage],
          1,
          'IA Gateway degradado o inalcanzable'
        ),
        { status: 503 }
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error inesperado al sondear IA Gateway';
      return NextResponse.json(
        createErrorEnvelope<IaGatewayHealthStatus>(
          [message],
          1,
          'Fallo crítico en sonda IA Gateway'
        ),
        { status: 503 }
      );
    }
  };
}

export const GET = createHealthHandler();
