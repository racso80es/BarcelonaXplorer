import * as lancedb from '@lancedb/lancedb';
import fs from 'fs';
import path from 'path';

/**
 * Cliente Centralizado LanceDB con Patrón Singleton blindado sobre globalThis.
 * 
 * Principio de Resiliencia:
 * En entornos Next.js (Fast Refresh en desarrollo y concurrencia de workers en producción),
 * las recargas de módulos no deben crear conexiones duplicadas ni saturar descriptores de archivos.
 */

const globalForLance = globalThis as unknown as {
  lancedbConnectionPromise: Promise<lancedb.Connection> | undefined;
  lancedbUri: string | undefined;
};

export function resolveLanceDbUri(): string {
  if (process.env.LANCEDB_URI && process.env.LANCEDB_URI.trim().length > 0) {
    return process.env.LANCEDB_URI.trim();
  }

  // Fallback para desarrollo local
  return path.resolve(process.cwd(), 'data', 'lancedb');
}

export async function getLanceDbConnection(customUri?: string): Promise<lancedb.Connection> {
  const uri = customUri || resolveLanceDbUri();

  // Si se provee una URI personalizada o no hay conexión cacheada para la URI actual
  if (globalForLance.lancedbConnectionPromise && globalForLance.lancedbUri === uri) {
    return globalForLance.lancedbConnectionPromise;
  }

  // Si la URI es una ruta de sistema de archivos local, asegurar que la carpeta base exista
  if (!uri.startsWith('s3://') && !uri.startsWith('gs://')) {
    try {
      if (!fs.existsSync(uri)) {
        fs.mkdirSync(uri, { recursive: true });
      }
    } catch (err) {
      console.warn(`[LanceDbClient] No se pudo asegurar el directorio base ${uri}:`, err);
    }
  }

  globalForLance.lancedbUri = uri;
  globalForLance.lancedbConnectionPromise = lancedb.connect(uri);

  return globalForLance.lancedbConnectionPromise;
}

/**
 * Cierra o resetea la conexión activa (útil para pruebas unitarias de aislamiento térmico).
 */
export function resetLanceDbConnection(): void {
  globalForLance.lancedbConnectionPromise = undefined;
  globalForLance.lancedbUri = undefined;
}
