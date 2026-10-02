import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '@/shared/persistence/prisma';
import { createErrorEnvelope, createSuccessEnvelope, OperationEnvelope } from '@/shared/operation-envelope';
import {
  ContextSourceSnapshot,
  ContextSourceSnapshotSchema,
  ContextSourceStatus,
} from './context-source.types';
import {
  IContextSourceRepository,
  SeedSourceInput,
  SeedUpsertResult,
} from './context-source.repository.port';

export class PrismaContextSourceRepository implements IContextSourceRepository {
  private readonly db: PrismaClient;

  constructor(customPrisma?: PrismaClient) {
    this.db = customPrisma ?? defaultPrisma;
  }

  async findByStatus(status: ContextSourceStatus): Promise<ContextSourceSnapshot[]> {
    const rows = await this.db.contextSource.findMany({
      where: { status },
      orderBy: { sourceTag: 'asc' },
    });

    return rows.map((r) => ContextSourceSnapshotSchema.parse(r));
  }

  async findByTag(sourceTag: string): Promise<ContextSourceSnapshot | null> {
    const row = await this.db.contextSource.findUnique({
      where: { sourceTag },
    });

    if (!row) return null;
    return ContextSourceSnapshotSchema.parse(row);
  }

  async findAll(): Promise<ContextSourceSnapshot[]> {
    const rows = await this.db.contextSource.findMany({
      orderBy: { sourceTag: 'asc' },
    });

    return rows.map((r) => ContextSourceSnapshotSchema.parse(r));
  }

  async save(source: ContextSourceSnapshot): Promise<OperationEnvelope<ContextSourceSnapshot>> {
    try {
      const updated = await this.db.contextSource.update({
        where: { id: source.id },
        data: {
          displayName: source.displayName,
          endpoint: source.endpoint,
          type: source.type,
          category: source.category,
          status: source.status,
          failedAttempts: source.failedAttempts,
          lastSuccessAt: source.lastSuccessAt,
          lastErrorAt: source.lastErrorAt,
          lastError: source.lastError,
          proposedBy: source.proposedBy,
          supersedesSourceTag: source.supersedesSourceTag,
        },
      });

      return createSuccessEnvelope(
        ContextSourceSnapshotSchema.parse(updated),
        `Fuente '${source.sourceTag}' actualizada con éxito`
      );
    } catch (err) {
      return createErrorEnvelope(
        [err instanceof Error ? err.message : String(err)],
        500,
        `Fallo al guardar fuente '${source.sourceTag}'`
      );
    }
  }

  async create(source: Omit<ContextSourceSnapshot, 'id'>): Promise<OperationEnvelope<ContextSourceSnapshot>> {
    try {
      const created = await this.db.contextSource.create({
        data: {
          sourceTag: source.sourceTag,
          displayName: source.displayName,
          endpoint: source.endpoint,
          type: source.type,
          category: source.category,
          status: source.status,
          failedAttempts: source.failedAttempts,
          lastSuccessAt: source.lastSuccessAt,
          lastErrorAt: source.lastErrorAt,
          lastError: source.lastError,
          proposedBy: source.proposedBy,
          supersedesSourceTag: source.supersedesSourceTag,
        },
      });

      return createSuccessEnvelope(
        ContextSourceSnapshotSchema.parse(created),
        `Fuente '${source.sourceTag}' creada con éxito`
      );
    } catch (err) {
      return createErrorEnvelope(
        [err instanceof Error ? err.message : String(err)],
        500,
        `Fallo al crear fuente '${source.sourceTag}'`
      );
    }
  }

  /**
   * Carga idempotente del seed YAML (CA-6).
   * No sobrescribe status, failedAttempts ni bitácora de errores de filas preexistentes.
   */
  async upsertFromSeed(entries: SeedSourceInput[]): Promise<OperationEnvelope<SeedUpsertResult>> {
    let created = 0;
    let updated = 0;
    let untouched = 0;

    try {
      for (const entry of entries) {
        const existing = await this.db.contextSource.findUnique({
          where: { sourceTag: entry.sourceTag },
        });

        if (!existing) {
          await this.db.contextSource.create({
            data: {
              sourceTag: entry.sourceTag,
              displayName: entry.displayName,
              endpoint: entry.endpoint,
              type: entry.type,
              category: entry.category,
              status: entry.status,
              failedAttempts: 0,
              proposedBy: entry.proposedBy ?? 'SEED',
              supersedesSourceTag: entry.supersedesSourceTag,
            },
          });
          created++;
        } else {
          // Idempotente: solo actualiza metadatos si han cambiado, sin pisar status operativo
          const hasMetadataChanges =
            existing.displayName !== entry.displayName ||
            existing.endpoint !== entry.endpoint ||
            existing.type !== entry.type ||
            existing.category !== entry.category;

          if (hasMetadataChanges) {
            await this.db.contextSource.update({
              where: { sourceTag: entry.sourceTag },
              data: {
                displayName: entry.displayName,
                endpoint: entry.endpoint,
                type: entry.type,
                category: entry.category,
              },
            });
            updated++;
          } else {
            untouched++;
          }
        }
      }

      return createSuccessEnvelope(
        { created, updated, untouched },
        `Seed procesado: ${created} creadas, ${updated} actualizadas, ${untouched} preservadas`
      );
    } catch (err) {
      return createErrorEnvelope(
        [err instanceof Error ? err.message : String(err)],
        500,
        'Fallo durante la sincronización idempotente del seed'
      );
    }
  }
}
