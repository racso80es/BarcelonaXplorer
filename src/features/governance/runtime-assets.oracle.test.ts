import path from 'path';
import { describe, expect, it } from 'vitest';

import { validateRuntimeAssets } from './runtime-assets.oracle';

describe('Runtime Assets Oracle (PBI-OPS-028)', () => {
  const validManifestYaml = `
assets:
  - source: "features/context-sources/context-sources.seed.yml"
    destination: "features/context-sources/context-sources.seed.yml"
ignore:
  - "docker-runtime-assets.yml"
`;

  const validDockerfile = `
FROM base AS builder
WORKDIR /app
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/features/context-sources/context-sources.seed.yml ./features/context-sources/context-sources.seed.yml
CMD ["node", "server.js"]
`;

  it('debe certificar en verde el estado real del repositorio (CA-8 Caso 1)', () => {
    const srcDir = path.resolve(__dirname, '../..');
    const result = validateRuntimeAssets({
      manifestPath: path.join(srcDir, 'docker-runtime-assets.yml'),
      dockerfilePath: path.join(srcDir, 'Dockerfile'),
      sourceDir: srcDir,
    });

    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.result?.verifiedAssets).toBeGreaterThanOrEqual(1);
    expect(result.errors).toBeUndefined();
  });

  it('debe fallar (rojo) si el manifiesto omite una entrada cuya directiva COPY no está en Dockerfile (CA-8 Caso 2)', () => {
    const manifestWithMissingCopy = `
assets:
  - source: "features/context-sources/context-sources.seed.yml"
    destination: "features/context-sources/context-sources.seed.yml"
  - source: "features/catalog/catalogo-nuevo.yml"
    destination: "features/catalog/catalogo-nuevo.yml"
`;

    const result = validateRuntimeAssets({
      manifestContent: manifestWithMissingCopy,
      dockerfileContent: validDockerfile,
      filesContent: [],
    });

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(422);
    expect(result.errors?.some((e) => e.includes('catalogo-nuevo.yml'))).toBe(true);
  });

  it('debe fallar (rojo) si COPY solo aparece comentado o en el stage builder y no en runner (CA-8 Caso 3)', () => {
    const dockerfileWithCopyOnlyInBuilderOrCommented = `
FROM base AS builder
WORKDIR /app
# COPY --from=builder /app/features/context-sources/context-sources.seed.yml ./features/context-sources/context-sources.seed.yml
COPY --from=deps /app/features/context-sources/context-sources.seed.yml ./features/context-sources/context-sources.seed.yml

FROM base AS runner
WORKDIR /app
# COPY --from=builder /app/features/context-sources/context-sources.seed.yml ./features/context-sources/context-sources.seed.yml
COPY --from=builder /app/public ./public
CMD ["node", "server.js"]
`;

    const result = validateRuntimeAssets({
      manifestContent: validManifestYaml,
      dockerfileContent: dockerfileWithCopyOnlyInBuilderOrCommented,
      filesContent: [],
    });

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(422);
    expect(
      result.errors?.some((e) => e.includes('no cuenta con directiva COPY válida en stage \'runner\''))
    ).toBe(true);
  });

  it('debe fallar (rojo) si un fichero de producción lee un .yml no declarado en manifiesto (CA-8 Caso 4)', () => {
    const result = validateRuntimeAssets({
      manifestContent: validManifestYaml,
      dockerfileContent: validDockerfile,
      filesContent: [
        {
          path: '/app/src/features/catalog/catalog.service.ts',
          content: `
            import path from 'path';
            const seed = path.join(process.cwd(), 'features/catalog/catalogo-no-declarado.seed.yml');
          `,
        },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(422);
    expect(
      result.errors?.some((e) => e.includes('catalogo-no-declarado.seed.yml'))
    ).toBe(true);
  });

  it('debe fallar (rojo) si el manifiesto no cumple el esquema canónico Zod (CA-8 Caso 5)', () => {
    const invalidManifest = `
assets:
  - source: "/absolute/path/not/allowed.yml"
    destination: "../parent/dir/not/allowed.yml"
`;

    const result = validateRuntimeAssets({
      manifestContent: invalidManifest,
      dockerfileContent: validDockerfile,
      filesContent: [],
    });

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(422);
    expect(result.feedback).toContain('no cumple el esquema canónico');
    expect(result.errors?.length).toBeGreaterThanOrEqual(1);
  });
});
