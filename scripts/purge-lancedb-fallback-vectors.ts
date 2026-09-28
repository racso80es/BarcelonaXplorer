/**
 * Purga idempotente de vectores de fallback en LanceDB (PBI-STEEL-002 CA-5).
 * Por defecto --dry-run. Ejecutar desde `src/`:
 *   npx --yes tsx ../scripts/purge-lancedb-fallback-vectors.ts
 *   npx --yes tsx ../scripts/purge-lancedb-fallback-vectors.ts --apply
 */
import { purgeFallbackVectors } from '../src/features/cognitive-memory/purge-fallback-vectors';

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const dryRun = !apply;

  const report = await purgeFallbackVectors({ dryRun });
  console.log(JSON.stringify(report, null, 2));

  if (dryRun) {
    console.log('\nModo dry-run (sin borrados). Pase --apply para eliminar coincidencias.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
