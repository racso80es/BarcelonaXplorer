import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { z } from 'zod';
import { createErrorEnvelope, OperationEnvelope } from '@/shared/operation-envelope';
import {
  ContextSourceCategorySchema,
  ContextSourceStatusSchema,
  ContextSourceTypeSchema,
} from './context-source.types';
import {
  IContextSourceRepository,
  SeedSourceInput,
  SeedUpsertResult,
} from './context-source.repository.port';

export const SeedSourceYamlSchema = z.object({
  sourceTag: z.string().min(1).max(64),
  displayName: z.string().min(1).max(191),
  endpoint: z.string().url(),
  type: ContextSourceTypeSchema,
  category: ContextSourceCategorySchema,
  status: ContextSourceStatusSchema,
  proposedBy: z.enum(['SEED', 'HUMAN', 'ARGOS']).default('SEED'),
  supersedesSourceTag: z.string().optional(),
});

export const SeedFileYamlSchema = z.object({
  version: z.string(),
  governance: z.record(z.string(), z.unknown()).optional(),
  sources: z.array(SeedSourceYamlSchema),
});

export class ContextSourceSeedService {
  constructor(private readonly repository: IContextSourceRepository) {}

  /**
   * Carga el seed YAML desde una cadena o desde un archivo físico en disco.
   */
  async loadSeed(yamlContentOrFilePath?: string): Promise<OperationEnvelope<SeedUpsertResult>> {
    try {
      let rawContent = yamlContentOrFilePath;

      if (!rawContent || !rawContent.includes('\n')) {
        let targetPath: string | null = null;

        if (rawContent && rawContent.trim().length > 0) {
          const explicitPath = path.isAbsolute(rawContent)
            ? rawContent
            : path.resolve(process.cwd(), rawContent);
          if (fs.existsSync(explicitPath)) {
            targetPath = explicitPath;
          } else {
            return createErrorEnvelope(
              [`No se encontró el fichero seed YAML en la ruta especificada: ${rawContent}`],
              404,
              'Fichero seed no encontrado'
            );
          }
        } else {
          const defaultPath = path.join(
            process.cwd(),
            'src/features/context-sources/context-sources.seed.yml'
          );
          const fallbackPath = path.join(
            process.cwd(),
            'features/context-sources/context-sources.seed.yml'
          );

          targetPath = fs.existsSync(defaultPath)
            ? defaultPath
            : fs.existsSync(fallbackPath)
              ? fallbackPath
              : null;

          if (!targetPath) {
            return createErrorEnvelope(
              [`No se encontró el fichero seed YAML en las rutas estándar: ${defaultPath}`],
              404,
              'Fichero seed no encontrado'
            );
          }
        }

        rawContent = fs.readFileSync(targetPath, 'utf8');
      }

      // Axioma III y Gobernanza de Formatos: YAML.parse() seguro
      const parsedUnknown = YAML.parse(rawContent);
      const validation = SeedFileYamlSchema.safeParse(parsedUnknown);

      if (!validation.success) {
        const issues = validation.error.issues.map(
          (i) => `${i.path.join('.') || 'root'}: ${i.message}`
        );
        return createErrorEnvelope(
          issues,
          422,
          'El archivo seed YAML no cumple el esquema estructural canónico'
        );
      }

      const seedSources: SeedSourceInput[] = validation.data.sources.map((s) => ({
        sourceTag: s.sourceTag,
        displayName: s.displayName,
        endpoint: s.endpoint,
        type: s.type,
        category: s.category,
        status: s.status,
        proposedBy: s.proposedBy,
        supersedesSourceTag: s.supersedesSourceTag ?? null,
      }));

      return await this.repository.upsertFromSeed(seedSources);
    } catch (err) {
      return createErrorEnvelope(
        [err instanceof Error ? err.message : String(err)],
        500,
        'Error inesperado al procesar el seed de fuentes de contexto'
      );
    }
  }
}
