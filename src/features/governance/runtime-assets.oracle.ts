import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import { z } from 'zod';

import {
  createErrorEnvelope,
  createSuccessEnvelope,
  OperationEnvelope,
} from '../../shared/operation-envelope';

export const RuntimeAssetSchema = z.object({
  source: z
    .string()
    .min(1, 'El campo source no puede estar vacío')
    .refine((s) => !s.startsWith('/') && !s.includes('..'), {
      message: 'source debe ser una ruta relativa sin parent dirs (..)',
    }),
  destination: z
    .string()
    .min(1, 'El campo destination no puede estar vacío')
    .refine((d) => !d.startsWith('/') && !d.includes('..'), {
      message: 'destination debe ser una ruta relativa sin parent dirs (..)',
    }),
});

export const RuntimeAssetsManifestSchema = z
  .object({
    assets: z.array(RuntimeAssetSchema).min(1, 'El manifiesto debe contener al menos un activo'),
    ignore: z.array(z.string()).optional().default([]),
  })
  .refine(
    (data) => {
      const sources = data.assets.map((a) => a.source);
      return new Set(sources).size === sources.length;
    },
    {
      message: 'No se permiten activos con source duplicado en el manifiesto',
    }
  );

export type RuntimeAssetsManifest = z.infer<typeof RuntimeAssetsManifestSchema>;

export interface RuntimeAssetsOracleResult {
  verifiedAssets: number;
  scannedFiles: number;
}

export interface ValidateRuntimeAssetsOptions {
  manifestPath?: string;
  dockerfilePath?: string;
  sourceDir?: string;
  manifestContent?: string;
  dockerfileContent?: string;
  filesContent?: Array<{ path: string; content: string }>;
}

/**
 * Oráculo determinista para la verificación de activos de runtime en Next.js Standalone (PBI-OPS-028).
 * Axioma I: Localidad de comportamiento.
 * Axioma II: Fronteras deterministas con parseo estricto Zod.
 * Axioma V: Retorno en sobre determinista OperationEnvelope.
 */
export function validateRuntimeAssets(
  options: ValidateRuntimeAssetsOptions = {}
): OperationEnvelope<RuntimeAssetsOracleResult> {
  const errors: string[] = [];

  // 1. Cargar y parsear manifiesto deterministamente
  let rawManifestYaml = options.manifestContent;
  if (!rawManifestYaml) {
    const manifestPath =
      options.manifestPath || path.resolve(process.cwd(), 'docker-runtime-assets.yml');
    if (!fs.existsSync(manifestPath)) {
      return createErrorEnvelope(
        [`No se localizó el manifiesto de activos de runtime en ${manifestPath}`],
        404,
        'Manifiesto de activos ausente'
      );
    }
    rawManifestYaml = fs.readFileSync(manifestPath, 'utf-8');
  }

  let parsedYamlUnknown: unknown;
  try {
    parsedYamlUnknown = YAML.parse(rawManifestYaml);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return createErrorEnvelope(
      [`Error de parseo sintáctico YAML en manifiesto: ${msg}`],
      422,
      'Sintaxis YAML inválida en docker-runtime-assets.yml'
    );
  }

  const manifestParseResult = RuntimeAssetsManifestSchema.safeParse(parsedYamlUnknown);
  if (!manifestParseResult.success) {
    const formattedErrors = manifestParseResult.error.issues.map(
      (issue) => `[Manifest Schema Error] ${issue.path.join('.')}: ${issue.message}`
    );
    return createErrorEnvelope(
      formattedErrors,
      422,
      'El manifiesto docker-runtime-assets.yml no cumple el esquema canónico'
    );
  }

  const manifest = manifestParseResult.data;

  // 2. Cargar y analizar Dockerfile en el stage runner
  let rawDockerfile = options.dockerfileContent;
  if (!rawDockerfile) {
    const dockerfilePath = options.dockerfilePath || path.resolve(process.cwd(), 'Dockerfile');
    if (!fs.existsSync(dockerfilePath)) {
      return createErrorEnvelope(
        [`No se localizó Dockerfile en ${dockerfilePath}`],
        404,
        'Dockerfile ausente'
      );
    }
    rawDockerfile = fs.readFileSync(dockerfilePath, 'utf-8');
  }

  // Extraer únicamente las directivas del stage 'runner' delimitado por FROM de inicio de línea
  const runnerStageMatch = rawDockerfile.match(
    /(?:^|\n)\s*FROM\s+\S+\s+AS\s+runner([\s\S]*?)(?=(?:\n\s*FROM\s)|$)/i
  );
  if (!runnerStageMatch) {
    errors.push("No se encontró el stage 'runner' (FROM ... AS runner) en Dockerfile");
  } else {
    const runnerContent = runnerStageMatch[1];
    const runnerLines = runnerContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    const copyDirectives = runnerLines.filter((l) => l.startsWith('COPY '));

    for (const asset of manifest.assets) {
      // Debe existir un COPY con --from=builder que contenga origen /app/<source> y destino ./<dest> o /app/<dest>
      const hasValidCopy = copyDirectives.some((directive) => {
        if (!directive.includes('--from=builder')) return false;

        const tokens = directive.split(/\s+/);
        // Descartar tokens flags como --from=builder o --chown=...
        const pathTokens = tokens.filter((t) => !t.startsWith('--') && t !== 'COPY');
        if (pathTokens.length < 2) return false;

        const srcToken = pathTokens[pathTokens.length - 2];
        const destToken = pathTokens[pathTokens.length - 1];

        const srcMatches =
          srcToken === `/app/${asset.source}` ||
          srcToken === `./${asset.source}` ||
          srcToken === asset.source;

        const destMatches =
          destToken === `./${asset.destination}` ||
          destToken === `/app/${asset.destination}` ||
          destToken === asset.destination;

        return srcMatches && destMatches;
      });

      if (!hasValidCopy) {
        errors.push(
          `Activo '${asset.source}' declarado en manifiesto no cuenta con directiva COPY válida en stage 'runner' de Dockerfile.`
        );
      }
    }
  }

  // 3. Inspeccionar archivos fuente .ts/.tsx en busca de literales YAML no declarados
  let scannedFiles = 0;

  if (options.filesContent) {
    scannedFiles = options.filesContent.length;
    for (const file of options.filesContent) {
      scanFileContentForYamlLiterals(file.path, file.content, manifest, errors);
    }
  } else {
    const sourceDir = options.sourceDir || process.cwd();
    const tsFiles = collectProductionTypeScriptFiles(sourceDir);
    scannedFiles = tsFiles.length;

    for (const filePath of tsFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      scanFileContentForYamlLiterals(filePath, content, manifest, errors);
    }
  }

  if (errors.length > 0) {
    return createErrorEnvelope(
      errors,
      422,
      `Oráculo de activos de runtime falló con ${errors.length} violaciones detectadas.`
    );
  }

  return createSuccessEnvelope(
    {
      verifiedAssets: manifest.assets.length,
      scannedFiles,
    },
    'Validación de activos de runtime del standalone superada con 0 errores.'
  );
}

function scanFileContentForYamlLiterals(
  filePath: string,
  content: string,
  manifest: RuntimeAssetsManifest,
  errors: string[]
) {
  const lines = content.split('\n');
  const yamlLiteralRegex = /['"`]([^'"`\s]+\.ya?ml)['"`]/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Ignorar líneas de comentarios en el código TypeScript
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }

    let match: RegExpExecArray | null;
    while ((match = yamlLiteralRegex.exec(line)) !== null) {
      const literal = match[1];

      // Comprobar si está en lista ignore
      if (manifest.ignore && manifest.ignore.includes(literal)) {
        continue;
      }

      // Comprobar si coincide con algún activo declarado en el manifiesto
      const isDeclared = manifest.assets.some((asset) => {
        return (
          asset.source === literal ||
          literal.endsWith(asset.source) ||
          asset.source.endsWith(literal)
        );
      });

      if (!isDeclared) {
        errors.push(
          `Literal de archivo YAML no declarado en manifiesto: '${literal}' en ${filePath}:${i + 1}`
        );
      }
    }
  }
}

function collectProductionTypeScriptFiles(dir: string): string[] {
  const results: string[] = [];

  function recurse(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const name = entry.name;
      // Exclusiones de directorios
      if (
        entry.isDirectory() &&
        (name === 'node_modules' ||
          name === '.next' ||
          name === 'ia-gateway' ||
          name === 'dist' ||
          name === 'coverage' ||
          name === 'playwright-e2e')
      ) {
        continue;
      }

      const fullPath = path.join(currentDir, name);

      if (entry.isDirectory()) {
        recurse(fullPath);
      } else if (entry.isFile()) {
        // Excluir archivos de test
        if (
          (name.endsWith('.ts') || name.endsWith('.tsx')) &&
          !name.endsWith('.test.ts') &&
          !name.endsWith('.test.tsx') &&
          !name.endsWith('.spec.ts') &&
          !name.endsWith('.spec.tsx') &&
          !name.endsWith('.d.ts')
        ) {
          results.push(fullPath);
        }
      }
    }
  }

  recurse(dir);
  return results;
}
