// ═══════════════════════════════════════════════════════════════
// Vertical Slice: Telegram / Reactive Patrol API Route
// Aduana Perimetral y Despacho de Drops Reactivos (HU-11 / EDA)
// Marco Constitucional: Protocolo de Acero — Grado S+
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { TelegramBotApiGateway } from '@/features/telegram';
import { OpenMeteoWeatherAdapter } from '@/features/triage';
import {
  ReactivePatrolUseCase,
  PatrolWaypointInput,
} from '@/features/telegram';
import { PrismaItineraryRepository } from '@/features/planner/prisma-itinerary.repository';

const globalForPrisma = globalThis as unknown as {
  prismaPatrolClient?: PrismaClient;
};

const prisma = globalForPrisma.prismaPatrolClient ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaPatrolClient = prisma;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Verificación Perimetral Fail-Closed del Token Secreto
  const secretHeader =
    request.headers.get('x-telegram-patrol-token') ||
    request.headers.get('x-telegram-bot-api-secret-token');

  const configuredSecret =
    process.env.PATROL_SECRET_TOKEN ||
    process.env.TELEGRAM_BOT_WEBHOOK_SECRET ||
    'bcn_patrol_secret_default';

  if (!secretHeader || secretHeader !== configuredSecret) {
    return new NextResponse('Unauthorized: Invalid patrol secret token', {
      status: 401,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // 2. Parseo de Parámetros Opcionales de Entrada
  let bodyFilter: { sessionId?: string; fatigueThresholdKm?: number } = {};
  try {
    const rawBody = await request.json();
    if (rawBody && typeof rawBody === 'object') {
      bodyFilter = rawBody;
    }
  } catch {
    // Si no se envía JSON en el body, se asume patrulla global sobre todas las sesiones
    bodyFilter = {};
  }

  const botGateway = new TelegramBotApiGateway();
  const weatherAdapter = new OpenMeteoWeatherAdapter();
  const itineraryRepo = new PrismaItineraryRepository(prisma);
  const patrolUseCase = new ReactivePatrolUseCase(botGateway, weatherAdapter);

  try {
    // 3. Consulta de Sesiones Ancladas con Telegram Activo
    const anchors = await prisma.userAnchor.findMany({
      where: bodyFilter.sessionId ? { sessionId: bodyFilter.sessionId } : undefined,
      orderBy: { lastInteractionAt: 'desc' },
      take: 50,
    });

    if (anchors.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No se encontraron sesiones ancladas activas para patrullar.',
        totalAnchorsChecked: 0,
        dropsDispatched: 0,
        details: [],
      });
    }

    const executionResults = [];

    // 4. Bucle Resiliente de Patrulla por Sesión (Bulkhead Pattern)
    for (const anchor of anchors) {
      try {
        const itinerary = await itineraryRepo.getItineraryBySessionId(anchor.sessionId);

        if (!itinerary || !itinerary.waypoints || itinerary.waypoints.length === 0) {
          executionResults.push({
            sessionId: anchor.sessionId,
            telegramChatId: anchor.telegramChatId,
            status: 'SKIPPED_NO_ACTIVE_ROUTE',
          });
          continue;
        }

        const waypoints = itinerary.waypoints;
        const mappedWaypoints: PatrolWaypointInput[] = waypoints.map((wp) => ({
          title: wp.title,
          lat: wp.coordinates?.lat ?? null,
          lng: wp.coordinates?.lng ?? null,
          isOutdoor:
            wp.tacticalMetadata?.environmentalConditions?.rainFriendly === false ||
            wp.category === 'ACTIVITY' ||
            wp.category === 'GENERAL',
        }));

        let completedWaypoints: PatrolWaypointInput[];
        let nextWaypoint: PatrolWaypointInput | null = null;

        if (mappedWaypoints.length >= 2) {
          completedWaypoints = mappedWaypoints.slice(0, mappedWaypoints.length - 1);
          nextWaypoint = mappedWaypoints[mappedWaypoints.length - 1];
        } else {
          completedWaypoints = mappedWaypoints;
        }

        const patrolOutcome = await patrolUseCase.execute({
          sessionId: anchor.sessionId,
          telegramChatId: anchor.telegramChatId,
          completedWaypoints,
          nextWaypoint,
          fatigueThresholdKm: bodyFilter.fatigueThresholdKm,
        });

        executionResults.push({
          sessionId: anchor.sessionId,
          telegramChatId: anchor.telegramChatId,
          status: 'EVALUATED',
          outcome: patrolOutcome,
        });
      } catch (userPatrolError) {
        executionResults.push({
          sessionId: anchor.sessionId,
          telegramChatId: anchor.telegramChatId,
          status: 'ERROR',
          error:
            userPatrolError instanceof Error
              ? userPatrolError.message
              : String(userPatrolError),
        });
      }
    }

    const dropsCount = executionResults.filter(
      (r) => r.status === 'EVALUATED' && r.outcome?.result?.dispatched === true
    ).length;

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      totalAnchorsChecked: anchors.length,
      dropsDispatched: dropsCount,
      details: executionResults,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: `Fallo inesperado en el centinela de patrulla reactiva: ${errorMsg}`,
      },
      { status: 500 }
    );
  }
}
