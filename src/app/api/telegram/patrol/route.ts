// ═══════════════════════════════════════════════════════════════
// Vertical Slice: Telegram / Reactive Patrol API Route
// Aduana Perimetral y Despacho de Drops Reactivos (HU-11 / EDA)
// Marco Constitucional: Protocolo de Acero — Grado S+
// ═══════════════════════════════════════════════════════════════
//
// Invocación: no hay cron, workflow ni script en este repositorio que llame
// a esta ruta. Se dispara a mano o desde infraestructura externa con la
// cabecera `x-telegram-patrol-token` y el secreto `PATROL_SECRET_TOKEN`.

import { NextRequest, NextResponse } from 'next/server';
import { constantTimeEqual } from '@/features/auth';
import { PrismaUserAnchorRepository } from '@/features/auth/prisma-user-anchor.repository';
import { TelegramBotApiGateway } from '@/features/telegram';
import { OpenMeteoWeatherAdapter } from '@/features/triage';
import {
  ReactivePatrolUseCase,
  PatrolWaypointInput,
} from '@/features/telegram';
import { PrismaItineraryRepository } from '@/features/planner/prisma-itinerary.repository';
import { PrismaTelemetryRepository, TelemetryEntry } from '@/features/telemetry';
import { prisma } from '@/shared/persistence/prisma';
import {
  createErrorEnvelope,
  createSuccessEnvelope,
} from '@/shared/operation-envelope';
import { PatrolRequestSchema } from './patrol.schema';

export const runtime = 'nodejs';

type PatrolStatusKey = 'SKIPPED_NO_ACTIVE_ROUTE' | 'EVALUATED' | 'ERROR';

interface PatrolSummaryResult {
  totalAnchorsChecked: number;
  dropsDispatched: number;
  statusCounts: Record<PatrolStatusKey, number>;
}

function emptyStatusCounts(): Record<PatrolStatusKey, number> {
  return {
    SKIPPED_NO_ACTIVE_ROUTE: 0,
    EVALUATED: 0,
    ERROR: 0,
  };
}

function readPatrolSecret(): string | null {
  const raw = process.env.PATROL_SECRET_TOKEN;
  if (raw === undefined || raw === null) {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function logPatrolPerimeter(
  level: 'ERROR' | 'WARN',
  message: string,
  payload: Record<string, unknown>,
  statusCode: number,
): Promise<void> {
  const telemetryRepo = new PrismaTelemetryRepository();
  await telemetryRepo.log(
    new TelemetryEntry(level, 'SECURITY_PERIMETER', message, payload, statusCode, 0),
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const configuredSecret = readPatrolSecret();

  if (!configuredSecret) {
    await logPatrolPerimeter(
      'ERROR',
      '[Patrulla Telegram] Fail-Closed: PATROL_SECRET_TOKEN ausente o vacío',
      { route: '/api/telegram/patrol' },
      503,
    );
    const envelope = createErrorEnvelope<PatrolSummaryResult>(
      ['PATROL_SECRET_TOKEN no está configurado en el entorno.'],
      1,
      'Servicio de patrulla no disponible.',
    );
    return NextResponse.json(envelope, { status: 503 });
  }

  const secretHeader = request.headers.get('x-telegram-patrol-token');
  const tokenValid =
    secretHeader !== null &&
    secretHeader.length > 0 &&
    (await constantTimeEqual(secretHeader, configuredSecret));

  if (!tokenValid) {
    return NextResponse.json(
      createErrorEnvelope<PatrolSummaryResult>(
        ['Token de patrulla inválido o ausente.'],
        1,
        'No autorizado.',
      ),
      { status: 401 },
    );
  }

  let rawBody: unknown = {};
  try {
    const text = await request.text();
    if (text.trim().length > 0) {
      rawBody = JSON.parse(text) as unknown;
    }
  } catch {
    return NextResponse.json(
      createErrorEnvelope<PatrolSummaryResult>(
        ['El cuerpo debe ser JSON válido.'],
        1,
        'Solicitud inválida.',
      ),
      { status: 400 },
    );
  }

  const parsedBody = PatrolRequestSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      createErrorEnvelope<PatrolSummaryResult>(
        parsedBody.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
        1,
        'Cuerpo de patrulla inválido.',
      ),
      { status: 400 },
    );
  }

  const bodyFilter = parsedBody.data;
  const anchorRepository = new PrismaUserAnchorRepository(prisma);
  const botGateway = new TelegramBotApiGateway();
  const weatherAdapter = new OpenMeteoWeatherAdapter();
  const itineraryRepo = new PrismaItineraryRepository(prisma);
  const patrolUseCase = new ReactivePatrolUseCase(botGateway, weatherAdapter);

  try {
    const anchors = await anchorRepository.findRecentActive({
      limit: 50,
      sessionId: bodyFilter.sessionId,
    });

    const statusCounts = emptyStatusCounts();

    if (anchors.length === 0) {
      const envelope = createSuccessEnvelope<PatrolSummaryResult>({
        totalAnchorsChecked: 0,
        dropsDispatched: 0,
        statusCounts,
      });
      return NextResponse.json(envelope, { status: 200 });
    }

    let dropsDispatched = 0;

    for (const anchor of anchors) {
      try {
        const itinerary = await itineraryRepo.getItineraryBySessionId(anchor.sessionId);

        if (!itinerary?.waypoints || itinerary.waypoints.length === 0) {
          statusCounts.SKIPPED_NO_ACTIVE_ROUTE += 1;
          continue;
        }

        // PBI-STEEL-013: sin registro de progreso real, no se asume avance ni fatiga
        const completedWaypoints: PatrolWaypointInput[] = [];
        const nextWaypoint: PatrolWaypointInput | null = null;

        const patrolOutcome = await patrolUseCase.execute({
          sessionId: anchor.sessionId,
          telegramChatId: anchor.telegramChatId.getValue(),
          completedWaypoints,
          nextWaypoint,
          fatigueThresholdKm: bodyFilter.fatigueThresholdKm,
        });

        statusCounts.EVALUATED += 1;
        if (patrolOutcome.success && patrolOutcome.result?.dispatched === true) {
          dropsDispatched += 1;
        }
      } catch {
        statusCounts.ERROR += 1;
      }
    }

    const envelope = createSuccessEnvelope<PatrolSummaryResult>({
      totalAnchorsChecked: anchors.length,
      dropsDispatched,
      statusCounts,
    });

    return NextResponse.json(envelope, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const envelope = createErrorEnvelope<PatrolSummaryResult>(
      [`Fallo inesperado en el centinela de patrulla reactiva: ${errorMsg}`],
      1,
    );
    return NextResponse.json(envelope, { status: 500 });
  }
}
