import { NextRequest, NextResponse } from 'next/server';
import { PrismaTelemetryRepository } from '@/features/telemetry';
import { PruneTelemetryUseCase } from '@/features/telemetry';
import { constantTimeEqual } from '@/infrastructure/security/crypto.utils';

export const runtime = 'nodejs';

const telemetryRepository = new PrismaTelemetryRepository();
const pruneUseCase = new PruneTelemetryUseCase(telemetryRepository);

export async function POST(request: NextRequest): Promise<NextResponse> {
  const expectedSecret = process.env.CRON_SECRET;

  // Si CRON_SECRET está definido en el servidor, exigir coincidencia estricta (Principio Fail-Closed)
  if (expectedSecret) {
    const authHeader = request.headers.get('authorization');
    const cronSecretHeader = request.headers.get('x-cron-secret');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const providedSecret = bearerToken || cronSecretHeader;

    if (!providedSecret || !(await constantTimeEqual(providedSecret, expectedSecret))) {
      return NextResponse.json(
        { error: 'No autorizado: Token de mantenimiento inválido o ausente.' },
        { status: 401 },
      );
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seguridad Fail-Closed: CRON_SECRET no está configurada en producción.' },
      { status: 401 },
    );
  }

  try {
    let customRules;
    try {
      const body = await request.json();
      if (body && typeof body === 'object') {
        customRules = {
          debugInfoMaxAgeDays: typeof body.debugInfoMaxAgeDays === 'number' ? body.debugInfoMaxAgeDays : undefined,
          warnErrorMaxAgeDays: typeof body.warnErrorMaxAgeDays === 'number' ? body.warnErrorMaxAgeDays : undefined,
        };
      }
    } catch {
      // Cuerpo vacío o no JSON: usa reglas predeterminadas (7d / 30d)
    }

    const result = await pruneUseCase.execute(customRules);

    return NextResponse.json({
      success: true,
      message: 'Poda ontológica ejecutada con éxito.',
      ...result,
    });
  } catch (error) {
    console.error('[Prune Route Handler Error]', error);
    return NextResponse.json(
      { error: 'Error interno al ejecutar la poda ontológica.' },
      { status: 500 },
    );
  }
}
