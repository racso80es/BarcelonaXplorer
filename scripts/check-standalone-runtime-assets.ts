import path from 'node:path';
import { validateRuntimeAssets } from '../src/features/governance/runtime-assets.oracle';

const REPO_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(REPO_ROOT, 'src');

const result = validateRuntimeAssets({
  manifestPath: path.join(SRC_DIR, 'docker-runtime-assets.yml'),
  dockerfilePath: path.join(SRC_DIR, 'Dockerfile'),
  sourceDir: SRC_DIR,
});

if (result.success) {
  console.log(`[OK] ${result.feedback || 'Runtime assets validation passed.'}`);
  console.log(
    `     Activos verificados: ${result.result?.verifiedAssets}, archivos analizados: ${result.result?.scannedFiles}`
  );
  process.exit(0);
} else {
  console.error(`[ERROR] ${result.feedback || 'Falló la validación de activos de runtime.'}`);
  if (result.errors) {
    for (const err of result.errors) {
      console.error(`        - ${err}`);
    }
  }
  process.exit(result.exitCode || 1);
}
