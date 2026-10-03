import { NextRequest, NextResponse } from 'next/server';
import {
  UpdateItineraryNodeUseCase,
  PrismaItineraryRepository,
} from '@/features/planner/server';
import { PrismaTelemetryRepository } from '@/features/telemetry/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const rawBody: unknown = await req.json().catch(() => ({}));
    const itineraryRepo = new PrismaItineraryRepository();
    const telemetryRepo = new PrismaTelemetryRepository();
    const useCase = new UpdateItineraryNodeUseCase(itineraryRepo, telemetryRepo);

    const envelope = await useCase.shiftTimes(rawBody);
    const status = envelope.success
      ? 200
      : envelope.exitCode >= 400 && envelope.exitCode < 600
        ? envelope.exitCode
        : 400;

    return NextResponse.json(envelope, { status });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        exitCode: 500,
        errors: [errorMsg],
        feedback: 'Fallo interno al procesar actualización horaria',
      },
      { status: 500 },
    );
  }
}
