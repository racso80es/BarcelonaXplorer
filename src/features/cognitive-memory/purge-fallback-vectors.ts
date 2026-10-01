import * as lancedb from '@lancedb/lancedb';
import path from 'path';
import { vectorMatchesDeterministicFallback } from '@/features/ai-engine/deterministic-embedding-fallback';

export const PURGE_TARGET_TABLES = [
  'cognitive_memories',
  'semantic_prompt_cache',
] as const;


function resolveUriForPurge(customUri?: string): string {
  if (customUri && customUri.trim().length > 0) {
    return customUri.trim();
  }
  if (process.env.LANCEDB_URI && process.env.LANCEDB_URI.trim().length > 0) {
    return process.env.LANCEDB_URI.trim();
  }
  return path.resolve(process.cwd(), 'data', 'lancedb');
}

export interface PurgeTableReport {
  tableName: string;
  scanned: number;
  matches: number;
  deleted: number;
}

export interface PurgeFallbackVectorsReport {
  dryRun: boolean;
  uri: string;
  tables: PurgeTableReport[];
}

const PAGE_SIZE = 500;

function rowVector(row: Record<string, unknown>): number[] | null {
  const raw = row.vector;
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return raw.map((v) => Number(v));
  }
  if (typeof raw === 'object' && raw !== null && 'toArray' in raw) {
    const asArray = raw as { toArray: () => ArrayLike<number> };
    return Array.from(asArray.toArray()).map((v) => Number(v));
  }
  return null;
}

async function scanTable(
  db: lancedb.Connection,
  tableName: string,
  dryRun: boolean,
): Promise<PurgeTableReport> {
  const exists = (await db.tableNames()).includes(tableName);
  if (!exists) {
    return { tableName, scanned: 0, matches: 0, deleted: 0 };
  }

  const table = await db.openTable(tableName);
  let offset = 0;
  let scanned = 0;
  let matches = 0;
  let deleted = 0;
  const idsToDelete: string[] = [];

  for (;;) {
    const rows = await table.query().limit(PAGE_SIZE).offset(offset).toArray();
    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      scanned += 1;
      const record = row as Record<string, unknown>;
      const text = String(record.text ?? '');
      const vector = rowVector(record);
      if (!vector || text.length === 0) {
        continue;
      }
      if (vectorMatchesDeterministicFallback(vector, text)) {
        matches += 1;
        idsToDelete.push(String(record.id));
      }
    }

    if (rows.length < PAGE_SIZE) {
      break;
    }
    offset += PAGE_SIZE;
  }

  if (!dryRun && idsToDelete.length > 0) {
    const escaped = idsToDelete.map((id) => `'${id.replace(/'/g, "''")}'`).join(', ');
    await table.delete(`id IN (${escaped})`);
    deleted = idsToDelete.length;
  }

  return { tableName, scanned, matches, deleted: dryRun ? 0 : deleted };
}

export async function purgeFallbackVectors(options?: {
  dryRun?: boolean;
  uri?: string;
}): Promise<PurgeFallbackVectorsReport> {
  const dryRun = options?.dryRun !== false;
  const uri = resolveUriForPurge(options?.uri);
  const db = await lancedb.connect(uri);

  const tables = [...PURGE_TARGET_TABLES];

  const reports: PurgeTableReport[] = [];
  for (const tableName of tables) {
    reports.push(await scanTable(db, tableName, dryRun));
  }

  return { dryRun, uri, tables: reports };
}
