import { NextRequest, NextResponse } from 'next/server';
import { TelemetryLogInputSchema } from '@/features/telemetry';
import { PrismaTelemetryRepository } from '@/features/telemetry';
import { TelemetryEntry } from '@/features/telemetry';

export const runtime = 'nodejs';

const telemetryRepository = new PrismaTelemetryRepository();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Cuerpo JSON inválido o malformado.' },
        { status: 400 },
      );
    }

    const validation = TelemetryLogInputSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Fallo de validación en el Escudo Zod de Telemetría.',
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = validation.data;

    // Despacho asíncrono no bloqueante a MySQL mediante el puerto/repositorio
    void telemetryRepository
      .log(
        new TelemetryEntry(
          data.level,
          data.context,
          data.message,
          data.payload,
          data.statusCode,
          data.durationMs,
          data.environment,
        ),
      )
      .catch((err) => {
        console.warn('[Telemetry Route Handler Fallback]', err);
      });

    // Respuesta inmediata 202 Accepted para garantizar latencia cero al emisor
    return NextResponse.json(
      { status: 'accepted', message: 'Evento de telemetría encolado para persistencia.' },
      { status: 202 },
    );
  } catch (error) {
    console.error('[Telemetry Route Handler Error]', error);
    return NextResponse.json(
      { error: 'Error interno en la ingesta de telemetría.' },
      { status: 500 },
    );
  }
}
