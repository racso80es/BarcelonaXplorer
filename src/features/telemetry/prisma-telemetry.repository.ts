import { PrismaClient, Prisma } from '@prisma/client';
import { TelemetryRepositoryPort } from './telemetry-repository.port';
import {
  TelemetryEntry,
  TelemetryFilter,
  RetentionRules,
  TelemetryLevel,
  TelemetryContext,
  TelemetryPayload,
} from './telemetry-entry.entity';

// Prisma singleton para reutilización en entornos serverless/Next.js
const globalForPrisma = globalThis as unknown as {
  prismaTelemetryClient?: PrismaClient;
};

const defaultPrisma = globalForPrisma.prismaTelemetryClient ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaTelemetryClient = defaultPrisma;
}

export class PrismaTelemetryRepository implements TelemetryRepositoryPort {
  private readonly prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? defaultPrisma;
  }

  /**
   * Persiste un registro de telemetría de forma asíncrona y con aislamiento Fail-Safe.
   * La saturación o caída de MySQL jamás debe tumbar el hilo principal de la aplicación.
   */
  async log(entry: TelemetryEntry): Promise<void> {
    try {
      const sanitizedPayload = TelemetryEntry.sanitizePayload(entry.payload);

      await this.prisma.telemetryLog.create({
        data: {
          level: entry.level,
          context: entry.context,
          message: entry.message.slice(0, 512),
          payload: (sanitizedPayload as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          statusCode: entry.statusCode ?? null,
          durationMs: entry.durationMs ?? null,
          environment: entry.environment || 'production',
        },
      });
    } catch (error) {
      // Principio Fail-Safe de la Vía del Yunque:
      // Se emite un aviso secundario sin propagar la excepción hacia el usuario.
      console.warn(
        '[Telemetry Fallback Error] Error al persistir en MySQL (Nodo 11):',
        error instanceof Error ? error.message : error,
      );
    }
  }

  /**
   * Obtiene los registros más recientes para el panel de control de administración.
   */
  async getRecentLogs(filter?: TelemetryFilter): Promise<TelemetryEntry[]> {
    try {
      const where: Prisma.TelemetryLogWhereInput = {};

      if (filter?.level) {
        where.level = filter.level;
      }
      if (filter?.context) {
        where.context = filter.context;
      }
      if (filter?.since) {
        where.createdAt = { gte: filter.since };
      }

      const rows = await this.prisma.telemetryLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filter?.limit ?? 50,
      });

      return rows.map(
        (row) =>
          new TelemetryEntry(
            row.level as TelemetryLevel,
            row.context as TelemetryContext,
            row.message,
            (row.payload as TelemetryPayload) ?? null,
            row.statusCode,
            row.durationMs,
            row.environment,
            row.id,
            row.createdAt,
          ),
      );
    } catch (error) {
      console.warn(
        '[Telemetry Repository] Error al consultar registros:',
        error instanceof Error ? error.message : error,
      );
      return [];
    }
  }

  /**
   * Ejecuta la Poda Ontológica mediante eliminación en lote por fecha y severidad.
   */
  async prune(rules: RetentionRules): Promise<{ deletedCount: number }> {
    const debugInfoDays = rules.debugInfoMaxAgeDays ?? 7;
    const warnErrorDays = rules.warnErrorMaxAgeDays ?? 30;

    const now = Date.now();
    const debugInfoCutoff = new Date(now - debugInfoDays * 24 * 60 * 60 * 1000);
    const warnErrorCutoff = new Date(now - warnErrorDays * 24 * 60 * 60 * 1000);

    try {
      const result = await this.prisma.telemetryLog.deleteMany({
        where: {
          OR: [
            {
              level: { in: ['DEBUG', 'INFO'] },
              createdAt: { lt: debugInfoCutoff },
            },
            {
              level: { in: ['WARN', 'ERROR'] },
              createdAt: { lt: warnErrorCutoff },
            },
          ],
        },
      });

      return { deletedCount: result.count };
    } catch (error) {
      console.warn(
        '[Telemetry Prune Error] Falló la poda ontológica en MySQL:',
        error instanceof Error ? error.message : error,
      );
      return { deletedCount: 0 };
    }
  }
}
