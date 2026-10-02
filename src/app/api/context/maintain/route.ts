import { NextRequest, NextResponse } from 'next/server';
import { constantTimeEqual } from '@/features/auth';
import { PrismaTelemetryRepository } from '@/features/telemetry/server';
import { IaGatewayClient } from '@/features/ai-engine/ia-gateway/ia-gateway.client';
import { PrismaContextSourceRepository } from '@/features/context-sources/prisma-context-source.repository';
import { MaintainContextUseCase } from '@/features/context-sources/maintain-context.use-case';

export const runtime = 'nodejs';

export function createMaintainUseCase(): MaintainContextUseCase {
  const sourceRepo = new PrismaContextSourceRepository();
  const telemetryRepo = new PrismaTelemetryRepository();
  const iaGatewayClient = new IaGatewayClient({}, telemetryRepo);
  return new MaintainContextUseCase(sourceRepo, iaGatewayClient, telemetryRepo);
}

let activeUseCase: MaintainContextUseCase | null = null;

export function getMaintainUseCase(): MaintainContextUseCase {
  if (!activeUseCase) {
    activeUseCase = createMaintainUseCase();
  }
  return activeUseCase;
}

export function setMaintainUseCaseForTesting(useCase: MaintainContextUseCase | null): void {
  activeUseCase = useCase;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret) {
    const authHeader = request.headers.get('authorization');
    const cronSecretHeader = request.headers.get('x-cron-secret');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const providedSecret = bearerToken || cronSecretHeader;

    if (!providedSecret || !(await constantTimeEqual(providedSecret, expectedSecret))) {
      return NextResponse.json(
        { error: 'No autorizado: Token de mantenimiento inválido o ausente.' },
        { status: 401 }
      );
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seguridad Fail-Closed: CRON_SECRET no está configurada en producción.' },
      { status: 401 }
    );
  }

  const useCase = getMaintainUseCase();
  const envelope = await useCase.execute();

  const httpStatus = envelope.success
    ? 200
    : envelope.exitCode >= 400 && envelope.exitCode <= 599
      ? envelope.exitCode
      : 500;

  return NextResponse.json(envelope, {
    status: httpStatus,
  });
}
