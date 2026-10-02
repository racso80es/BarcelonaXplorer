import 'server-only';
import type {
  IVectorStorePort,
  VectorDocument,
  VectorSearchResult,
  VectorStorePingResult,
  VectorDeleteFilter,
  VectorSearchOptions,
} from './vector-store.port';
import { getLanceDbConnection, resolveLanceDbUri } from './lancedb-client';
import * as lancedb from '@lancedb/lancedb';
import fs from 'fs';

/**
 * Adaptador Hexagonal de Persistencia Vectorial sobre LanceDB (Apache Arrow).
 * 
 * Principios Arquitectónicos (La Vía del Yunque):
 * 1. Cero Contenedores Paralelos: Ejecuta in-process en el espacio de direcciones de Node.js.
 * 2. Cero Latencia TCP interna: Consultas resueltas directamente contra el sistema de ficheros.
 * 3. Resiliencia y Tolerancia a Fallos: Captura controlada de errores de permisos POSIX (EACCES)
 *    para señalización reactiva en la Sala de Control.
 */
export class LanceDbVectorAdapter implements IVectorStorePort {
  constructor(private readonly customUri?: string) {}

  private async getDb(): Promise<lancedb.Connection> {
    return getLanceDbConnection(this.customUri);
  }

  async tableExists(tableName: string): Promise<boolean> {
    const db = await this.getDb();
    const tables = await db.tableNames();
    return tables.includes(tableName);
  }

  async upsert(tableName: string, documents: VectorDocument[]): Promise<void> {
    if (!documents || documents.length === 0) {
      return;
    }

    const db = await this.getDb();
    const exists = await this.tableExists(tableName);

    const records = documents.map((doc) => ({
      id: doc.id,
      vector: doc.vector,
      text: doc.text,
      metadata: typeof doc.metadata === 'string' ? doc.metadata : JSON.stringify(doc.metadata ?? {}),
    }));

    if (!exists) {
      await db.createTable(tableName, records);
      return;
    }

    const table = await db.openTable(tableName);
    await table
      .mergeInsert('id')
      .whenMatchedUpdateAll()
      .whenNotMatchedInsertAll()
      .execute(records);
  }

  async search(
    tableName: string,
    queryVector: number[],
    limitOrOptions: number | VectorSearchOptions = 5,
  ): Promise<VectorSearchResult[]> {
    const exists = await this.tableExists(tableName);
    if (!exists) {
      return [];
    }

    const limit =
      typeof limitOrOptions === 'number'
        ? limitOrOptions
        : (limitOrOptions.limit ?? 5);

    const whereClause =
      typeof limitOrOptions === 'object' && limitOrOptions !== null
        ? limitOrOptions.where
        : undefined;

    const db = await this.getDb();
    const table = await db.openTable(tableName);

    let query = table
      .vectorSearch(queryVector)
      .distanceType('cosine');

    if (whereClause && whereClause.trim().length > 0) {
      query = query.where(whereClause);
    }

    const rows = await query.limit(limit).toArray();

    return rows.map((row) => {
      let parsedMetadata: Record<string, unknown> = {};
      try {
        if (typeof row.metadata === 'string') {
          parsedMetadata = JSON.parse(row.metadata);
        } else if (typeof row.metadata === 'object' && row.metadata !== null) {
          parsedMetadata = row.metadata as Record<string, unknown>;
        }
      } catch {
        parsedMetadata = {};
      }

      const distance = typeof row._distance === 'number' ? row._distance : 0;
      // Distancia coseno LanceDB ∈ [0, 2]; similitud = 1 - distancia (PBI-STEEL-002 CA-7)
      const score = 1 - distance;

      return {
        document: {
          id: String(row.id),
          vector: Array.from(row.vector as ArrayLike<number>),
          text: String(row.text ?? ''),
          metadata: parsedMetadata,
        },
        score,
      };
    });
  }

  async getByIds(tableName: string, ids: string[]): Promise<VectorDocument[]> {
    if (!ids || ids.length === 0) {
      return [];
    }
    const exists = await this.tableExists(tableName);
    if (!exists) {
      return [];
    }

    const db = await this.getDb();
    const table = await db.openTable(tableName);
    const escaped = ids.map((id) => `'${id.replace(/'/g, "''")}'`).join(', ');
    const rows = await table.query().where(`id IN (${escaped})`).toArray();

    return rows.map((row) => {
      let parsedMetadata: Record<string, unknown> = {};
      try {
        if (typeof row.metadata === 'string') {
          parsedMetadata = JSON.parse(row.metadata);
        } else if (typeof row.metadata === 'object' && row.metadata !== null) {
          parsedMetadata = row.metadata as Record<string, unknown>;
        }
      } catch {
        parsedMetadata = {};
      }

      return {
        id: String(row.id),
        vector: Array.from(row.vector as ArrayLike<number>),
        text: String(row.text ?? ''),
        metadata: parsedMetadata,
      };
    });
  }

  async delete(tableName: string, filter: VectorDeleteFilter): Promise<void> {
    const exists = await this.tableExists(tableName);
    if (!exists) {
      return;
    }

    const db = await this.getDb();
    const table = await db.openTable(tableName);

    if (typeof filter === 'string') {
      if (filter.trim().length > 0) {
        const expiresAtMatch = filter.match(/expiresAt\s*<\s*['"]?([^'"]+)['"]?/);
        if (expiresAtMatch) {
          const expirationIso = expiresAtMatch[1];
          await this.deleteExpiredRows(table, expirationIso);
          return;
        }
        await table.delete(filter);
      }
      return;
    }

    if (typeof filter === 'object' && filter !== null) {
      if ('expiredBefore' in filter) {
        await this.deleteExpiredRows(table, filter.expiredBefore);
        return;
      }

      if ('ids' in filter && Array.isArray(filter.ids)) {
        if (filter.ids.length === 0) {
          return;
        }
        const escaped = filter.ids.map((id) => `'${id.replace(/'/g, "''")}'`).join(', ');
        await table.delete(`id IN (${escaped})`);
      }
    }
  }

  private async deleteExpiredRows(table: import('@lancedb/lancedb').Table, expirationIso: string): Promise<void> {
    const rows = await table.query().toArray();
    const expiredIds: string[] = [];
    for (const row of rows) {
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
      if (typeof meta.expiresAt === 'string' && meta.expiresAt < expirationIso) {
        expiredIds.push(String(row.id));
      }
    }
    if (expiredIds.length > 0) {
      const escaped = expiredIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(', ');
      await table.delete(`id IN (${escaped})`);
    }
  }

  async ping(): Promise<VectorStorePingResult> {
    const startTime = Date.now();
    const targetPath = this.customUri || resolveLanceDbUri();

    try {
      // Auditoría proactiva de permisos POSIX sobre volumen local
      if (!targetPath.startsWith('s3://') && !targetPath.startsWith('gs://')) {
        if (!fs.existsSync(targetPath)) {
          fs.mkdirSync(targetPath, { recursive: true });
        }
        fs.accessSync(targetPath, fs.constants.R_OK | fs.constants.W_OK);
      }

      const db = await this.getDb();
      const tables = await db.tableNames();
      const latencyMs = Date.now() - startTime;

      return {
        ok: true,
        latencyMs,
        path: targetPath,
        tableCount: tables.length,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      return {
        ok: false,
        latencyMs,
        path: targetPath,
        tableCount: 0,
        error: errorMsg,
      };
    }
  }
}
