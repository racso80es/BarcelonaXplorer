import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(REPO_ROOT, 'src');
const MANIFEST_PATH = path.join(SRC_DIR, 'docker-runtime-assets.yml');
const DOCKERFILE_PATH = path.join(SRC_DIR, 'Dockerfile');

let exitCode = 0;
// 1. Load manifest
let definedDestinations: string[] = [];
if (fs.existsSync(MANIFEST_PATH)) {
  try {
    const content = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/destination:\s*['"]([^'"]+)['"]/);
      if (match) definedDestinations.push(match[1]);
    }
  } catch (err) {
    console.error(`[ERROR] Failed to read ${MANIFEST_PATH}:`, err);
    process.exit(1);
  }
}

const definedBasenames = definedDestinations.map((d) => path.basename(d));

// 2. Check Dockerfile COPY directives
const dockerfileContent = fs.existsSync(DOCKERFILE_PATH) ? fs.readFileSync(DOCKERFILE_PATH, 'utf-8') : '';
for (const dest of definedDestinations) {
  // Look for something like "COPY ... ./dest" or "COPY ... /app/dest" or similar
  // Simple check: does the string appear?
  if (!dockerfileContent.includes(dest)) {
    console.error(`[ERROR] Asset destination '${dest}' from manifest is not found in a COPY directive in src/Dockerfile.`);
    exitCode = 1;
  }
}

// 3. Find readFileSync in .ts files
function scanDirectory(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        scanDirectory(fullPath);
      }
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      checkFileForReadFileSync(fullPath);
    }
  }
}

function checkFileForReadFileSync(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('readFileSync')) {
      // Very basic static analysis: look for .yml or .yaml literals
      const match = line.match(/['"]([^'"]+\.ya?ml)['"]/);
      if (match) {
        const literalPath = match[1];
        const basename = path.basename(literalPath);
        if (!definedBasenames.includes(basename)) {
          console.error(`[ERROR] Unregistered runtime asset read in ${filePath}:${i + 1}`);
          console.error(`        Line: ${line.trim()}`);
          console.error(`        Asset '${basename}' is not in src/docker-runtime-assets.yml`);
          exitCode = 1;
        }
      }
    }
  }
}

scanDirectory(SRC_DIR);

if (exitCode === 0) {
  console.log('[OK] Runtime assets validation passed.');
}

process.exit(exitCode);
