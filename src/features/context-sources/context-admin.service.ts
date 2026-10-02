import {
  createErrorEnvelope,
  OperationEnvelope,
} from '@/shared/operation-envelope';
import { getLanceDbConnection } from '@/features/cognitive-memory/lancedb-client';
import { IContextSourceRepository } from './context-source.repository.port';
import { PrismaContextSourceRepository } from './prisma-context-source.repository';
import {
  applyTransition,
  canTransition,
} from './context-source-state-machine';
import {
  ContextSourceSnapshot,
  StateMachineActor,
  StateMachineEvent,
  StateMachineEventSchema,
} from './context-source.types';

export interface ContextMemoryEntryItem {
  id: string;
  sourceTag: string;
  category: string;
  title: string;
  summary: string;
  startsAt?: string;
  endsAt?: string;
  expiresAt: string;
  contentHash: string;
  rawMetadata: Record<string, unknown>;
}

export class ContextAdminService {
  constructor(
    private readonly sourceRepository: IContextSourceRepository = new PrismaContextSourceRepository()
  ) {}

  async listSources(): Promise<ContextSourceSnapshot[]> {
    return this.sourceRepository.findAll();
  }

  async listMemoryEntries(limit = 100): Promise<{
    entries: ContextMemoryEntryItem[];
    isAvailable: boolean;
  }> {
    try {
      const db = await getLanceDbConnection();
      const tables = await db.tableNames();
      if (!tables.includes('context_memory')) {
        return { entries: [], isAvailable: true };
      }

      const table = await db.openTable('context_memory');
      const rows = await table.query().limit(limit).toArray();

      const entries: ContextMemoryEntryItem[] = rows.map((row) => {
        let meta: Record<string, unknown> = {};
        try {
          if (typeof row.metadata === 'string') {
            meta = JSON.parse(row.metadata);
          } else if (typeof row.metadata === 'object' && row.metadata !== null) {
            meta = row.metadata as Record<string, unknown>;
          }
        } catch {
          meta = {};
        }

        return {
          id: String(row.id),
          sourceTag: String(meta.sourceTag ?? 'unknown'),
          category: String(meta.category ?? 'EVENT'),
          title: String(meta.title ?? 'Sin título'),
          summary: String(meta.summary ?? row.text ?? ''),
          startsAt: typeof meta.startsAt === 'string' ? meta.startsAt : undefined,
          endsAt: typeof meta.endsAt === 'string' ? meta.endsAt : undefined,
          expiresAt: String(meta.expiresAt ?? ''),
          contentHash: String(meta.contentHash ?? ''),
          rawMetadata: meta,
        };
      });

      return { entries, isAvailable: true };
    } catch (err) {
      console.warn('[ContextAdminService] LanceDB no disponible para context_memory:', err);
      return { entries: [], isAvailable: false };
    }
  }

  async transitionSource(
    sourceId: string,
    event: StateMachineEvent,
    actor: StateMachineActor = 'HUMAN',
    metadata?: { endpoint?: string }
  ): Promise<OperationEnvelope<ContextSourceSnapshot>> {
    const parseEvent = StateMachineEventSchema.safeParse(event);
    if (!parseEvent.success) {
      return createErrorEnvelope([`Evento de transición inválido: ${event}`], 400);
    }

    const all = await this.sourceRepository.findAll();
    const source = all.find((s) => s.id === sourceId);
    if (!source) {
      return createErrorEnvelope([`Fuente no encontrada con id: ${sourceId}`], 404);
    }

    if (!canTransition(source.status, event, actor)) {
      return createErrorEnvelope(
        [
          `Transición ilegal: el estado '${source.status}' no admite el evento '${event}' para el actor '${actor}'`,
        ],
        422,
        'Violación de la máquina de estados'
      );
    }

    try {
      const nextSource = applyTransition(source, event, actor, {
        now: new Date(),
      });

      if (event === 'PROPOSE_CORRECTION' && metadata?.endpoint) {
        nextSource.endpoint = metadata.endpoint;
      }

      const saved = await this.sourceRepository.save(nextSource);
      return saved;
    } catch (err) {
      return createErrorEnvelope(
        [err instanceof Error ? err.message : String(err)],
        500,
        'Fallo al guardar la transición'
      );
    }
  }
}
