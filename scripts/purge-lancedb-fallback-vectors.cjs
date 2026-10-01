/**
 * Purga autónoma de vectores de fallback en LanceDB (PBI-MEM-004 / PBI-STEEL-002).
 * Formato CommonJS puro sin dependencias de compilador, ejecutable directamente con:
 *   node scripts/purge-lancedb-fallback-vectors.cjs [--apply] [--uri /ruta/lancedb]
 */
const path = require('path');

function loadLanceDb() {
  try {
    return require('@lancedb/lancedb');
  } catch {
    const cwdModulePath = path.resolve(process.cwd(), 'node_modules', '@lancedb', 'lancedb');
    return require(cwdModulePath);
  }
}
const lancedb = loadLanceDb();


const EMBEDDING_DIMENSIONS = 768;
const FALLBACK_VECTOR_FLOAT_TOLERANCE = 1e-6;
const PAGE_SIZE = 500;
const PURGE_TARGET_TABLES = ['cognitive_memories', 'semantic_prompt_cache'];

function buildDeterministicFallbackVector(seedText, dimensions = EMBEDDING_DIMENSIONS) {
  const vector = new Array(dimensions);
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = (hash << 5) - hash + seedText.charCodeAt(i);
    hash |= 0;
  }

  let sumSq = 0;
  for (let i = 0; i < dimensions; i++) {
    hash = (hash * 1664525 + 1013904223) | 0;
    const val = hash / 0x7fffffff;
    vector[i] = val;
    sumSq += val * val;
  }

  const norm = Math.sqrt(sumSq) || 1;
  for (let i = 0; i < dimensions; i++) {
    vector[i] = vector[i] / norm;
  }

  return vector;
}

function vectorMatchesDeterministicFallback(stored, text, dimensions = EMBEDDING_DIMENSIONS) {
  if (!stored || stored.length !== dimensions) {
    return false;
  }
  const expected = buildDeterministicFallbackVector(text, dimensions);
  for (let i = 0; i < dimensions; i++) {
    if (Math.abs(stored[i] - expected[i]) >= FALLBACK_VECTOR_FLOAT_TOLERANCE) {
      return false;
    }
  }
  return true;
}

function resolveUri(customUri) {
  if (customUri && customUri.trim().length > 0) {
    return customUri.trim();
  }
  const uriArgIndex = process.argv.indexOf('--uri');
  if (uriArgIndex !== -1 && process.argv[uriArgIndex + 1]) {
    return process.argv[uriArgIndex + 1].trim();
  }
  if (process.env.LANCEDB_URI && process.env.LANCEDB_URI.trim().length > 0) {
    return process.env.LANCEDB_URI.trim();
  }
  return path.resolve(process.cwd(), 'data', 'lancedb');
}

function rowVector(row) {
  const raw = row.vector;
  if (!raw) return null;
  if (Array.isArray(raw)) return raw.map(Number);
  if (typeof raw === 'object' && raw !== null && 'toArray' in raw) {
    return Array.from(raw.toArray()).map(Number);
  }
  return null;
}

async function scanTable(db, tableName, dryRun) {
  const tableNames = await db.tableNames();
  if (!tableNames.includes(tableName)) {
    return { tableName, scanned: 0, matches: 0, deleted: 0 };
  }

  const table = await db.openTable(tableName);
  let offset = 0;
  let scanned = 0;
  let matches = 0;
  let deleted = 0;
  const idsToDelete = [];

  for (;;) {
    const rows = await table.query().limit(PAGE_SIZE).offset(offset).toArray();
    if (rows.length === 0) break;

    for (const row of rows) {
      scanned += 1;
      const text = String(row.text ?? '');
      const vector = rowVector(row);
      if (!vector || text.length === 0) continue;

      if (vectorMatchesDeterministicFallback(vector, text)) {
        matches += 1;
        idsToDelete.push(String(row.id));
      }
    }

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  if (!dryRun && idsToDelete.length > 0) {
    const escaped = idsToDelete.map((id) => `'${id.replace(/'/g, "''")}'`).join(', ');
    await table.delete(`id IN (${escaped})`);
    deleted = idsToDelete.length;
  }

  return { tableName, scanned, matches, deleted: dryRun ? 0 : deleted };
}

async function purgeFallbackVectors(options = {}) {
  const dryRun = options.dryRun !== false;
  const uri = resolveUri(options.uri);
  const db = await lancedb.connect(uri);

  const reports = [];
  for (const tableName of PURGE_TARGET_TABLES) {
    reports.push(await scanTable(db, tableName, dryRun));
  }

  return { dryRun, uri, tables: reports };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const dryRun = !apply;
  const report = await purgeFallbackVectors({ dryRun });
  console.log(JSON.stringify(report, null, 2));

  if (dryRun) {
    console.log('\nModo dry-run (sin borrados). Pase --apply para eliminar coincidencias.');
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  purgeFallbackVectors,
  buildDeterministicFallbackVector,
  vectorMatchesDeterministicFallback,
};
