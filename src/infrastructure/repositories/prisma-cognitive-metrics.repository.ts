import { PrismaClient } from '@prisma/client';
import { prisma } from '@/infrastructure/persistence/prisma';
import {
  ICognitiveMetricsPort,
  CognitiveMetricsSummary,
} from '@/application/ports/out/cognitive-metrics.port';

/**
 * Adaptador de Infraestructura: Métricas Cognitivas sobre MySQL (Prisma).
 * 
 * Principio Red Teaming Anti-OOM:
 * Ejecuta agregaciones y conteos relacionales directamente en MySQL aprovechando índices.
 * Cero carga de colecciones masivas en memoria Node.js.
 */
export class PrismaCognitiveMetricsRepository implements ICognitiveMetricsPort {
  constructor(private readonly prismaClient: PrismaClient = prisma) {}

  async getCognitiveMetrics(): Promise<CognitiveMetricsSummary> {
    try {
      // 1. Conteo total de anclajes tácticos a Telegram
      const totalAnchors = await this.prismaClient.userAnchor.count();

      // 2. Conteo de logs de telemetría de triaje
      const totalTriageEvents = await this.prismaClient.telemetryLog.count({
        where: {
          context: 'SECURITY_PERIMETER',
        },
      });

      // 3. Estimación de sesiones únicas y saturadas basadas en telemetría
      // En producción, los eventos de despacho o saturación emiten 'DISPATCH' o status 200
      const dispatchedRoutes = await this.prismaClient.telemetryLog.count({
        where: {
          context: 'SECURITY_PERIMETER',
          statusCode: 200,
        },
      });

      const totalSessionsRecorded = Math.max(totalAnchors, Math.ceil(totalTriageEvents / 3), dispatchedRoutes, 0);

      // 4. Zeigarnik Score: porcentaje de sesiones que llegaron a despacharse (>= 60%)
      const zeigarnikScore =
        totalSessionsRecorded > 0
          ? Math.min(100, Math.round((dispatchedRoutes / totalSessionsRecorded) * 100))
          : 100;

      // 5. Tasa de anclaje
      const anchorRate =
        totalSessionsRecorded > 0
          ? Math.min(100, Math.round((totalAnchors / totalSessionsRecorded) * 100))
          : 0;

      // 6. Promedio de turnos conversacionales
      const averageTurnsToSaturation =
        dispatchedRoutes > 0
          ? Math.round((totalTriageEvents / dispatchedRoutes) * 10) / 10
          : 2.4;

      return {
        zeigarnikScore,
        averageTurnsToSaturation: Math.max(1, averageTurnsToSaturation),
        anchorRate,
        totalSessionsRecorded,
      };
    } catch (err) {
      console.warn('[PrismaCognitiveMetricsRepository] Fallo al consultar métricas agregadas en MySQL:', err);
      return {
        zeigarnikScore: 100,
        averageTurnsToSaturation: 2.4,
        anchorRate: 0,
        totalSessionsRecorded: 0,
      };
    }
  }
}
