import { describe, expect, it, vi } from 'vitest';

import {
  ContextSourceSeedService,
  SeedFileYamlSchema,
} from './context-source-seed.service';
import { IContextSourceRepository, SeedUpsertResult } from './context-source.repository.port';
import { createSuccessEnvelope } from '@/shared/operation-envelope';

describe('ContextSourceSeedService', () => {
  const mockUpsertResult: SeedUpsertResult = {
    created: 6,
    updated: 0,
    untouched: 0,
  };

  const createMockRepo = (): IContextSourceRepository => ({
    findByTag: vi.fn(),
    findByStatus: vi.fn(),
    findAll: vi.fn(),
    save: vi.fn(),
    create: vi.fn(),
    upsertFromSeed: vi.fn().mockResolvedValue(createSuccessEnvelope(mockUpsertResult)),
  });

  it('debe validar y cargar exitosamente el fichero canónico context-sources.seed.yml de disco', async () => {
    const repo = createMockRepo();
    const service = new ContextSourceSeedService(repo);

    const result = await service.loadSeed();

    expect(result.success).toBe(true);
    expect(result.result).toEqual(mockUpsertResult);
    expect(repo.upsertFromSeed).toHaveBeenCalledTimes(1);

    const calledWith = vi.mocked(repo.upsertFromSeed).mock.calls[0][0];
    expect(calledWith.length).toBeGreaterThanOrEqual(6);
    expect(calledWith.map((s) => s.sourceTag)).toContain('gencat-agenda-cultural');
  });

  it('debe rechazar YAML con esquema inválido retornando 422 en el sobre determinista', async () => {
    const repo = createMockRepo();
    const service = new ContextSourceSeedService(repo);

    const invalidYaml = `
version: "1.0.0"
sources:
  - sourceTag: "bad-source"
    displayName: "Bad Source"
    endpoint: "not-a-valid-url"
    type: "INVALID_TYPE"
    category: "AGENDA"
    status: "ACTIVE"
`;

    const result = await service.loadSeed(invalidYaml);

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(422);
    expect(result.feedback).toContain('no cumple el esquema estructural canónico');
    expect(repo.upsertFromSeed).not.toHaveBeenCalled();
  });

  it('debe retornar 404 si el archivo físico no existe', async () => {
    const repo = createMockRepo();
    const service = new ContextSourceSeedService(repo);

    const nonExistentPath = '/tmp/non-existent-seed-file.yml';
    const result = await service.loadSeed(nonExistentPath);

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(404);
    expect(repo.upsertFromSeed).not.toHaveBeenCalled();
  });

  it('valida que el esquema Zod rechaza campos requeridos faltantes', () => {
    const invalidData = {
      version: '1.0.0',
      sources: [
        {
          sourceTag: 'test',
          // missing displayName, endpoint, etc.
        },
      ],
    };

    const parseResult = SeedFileYamlSchema.safeParse(invalidData);
    expect(parseResult.success).toBe(false);
  });
});
