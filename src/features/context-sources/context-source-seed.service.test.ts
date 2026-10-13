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
    expect(calledWith.length).toBeGreaterThanOrEqual(7);
    expect(calledWith.map((s) => s.sourceTag)).toContain('gencat-agenda-cultural');
    expect(calledWith.map((s) => s.sourceTag)).toContain('bcn-agenda-cultural');

    const agendaSource = calledWith.find((s) => s.sourceTag === 'bcn-agenda-cultural');
    expect(agendaSource?.type).toBe('CKAN_DATASTORE');
    expect(agendaSource?.status).toBe('PENDING_APPROVAL');
    expect(agendaSource?.proposedBy).toBe('HUMAN');
    expect(agendaSource?.extraction).toBeDefined();
    expect(agendaSource?.extraction?.strategy).toBe('CKAN_DATASTORE');
    expect(agendaSource?.extraction?.timeoutMs).toBe(90000);

    // Validación de las 5 fuentes CKAN del Ajuntament preparadas para APPROVE soberano (PBI-CTX-029 CA-4)
    const sovereignTags = [
      'bcn-agenda-cultural',
      'bcn-agenda-diaria',
      'bcn-agenda-esportiva',
      'bcn-mercats-municipals',
      'bcn-espais-verds',
    ];
    for (const tag of sovereignTags) {
      const source = calledWith.find((s) => s.sourceTag === tag);
      expect(source, `Fuente ${tag} debe existir en el seed`).toBeDefined();
      expect(source?.status, `Fuente ${tag} debe permanecer en PENDING_APPROVAL antes de APPROVE`).toBe('PENDING_APPROVAL');
      expect(source?.proposedBy, `Fuente ${tag} debe indicar proposedBy HUMAN`).toBe('HUMAN');
      expect(source?.extraction?.strategy, `Fuente ${tag} debe usar estrategia CKAN_DATASTORE`).toBe('CKAN_DATASTORE');
      expect(source?.extraction?.timeoutMs, `Fuente ${tag} debe tener timeoutMs de 90000 ms`).toBe(90000);
    }
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

  it('CA-2 & CA-3: acepta bloque extraction CKAN_DATASTORE válido conforme al contrato canónico', async () => {
    const repo = createMockRepo();
    const service = new ContextSourceSeedService(repo);

    const validCkanYaml = `
version: "1.0.0"
sources:
  - sourceTag: "bcn-agenda-cultural"
    displayName: "Agenda Cultural de Barcelona (CKAN Datastore)"
    endpoint: "https://opendata-ajuntament.barcelona.cat/data/api/3/action/package_show?id=agenda-cultural"
    type: "API_REST"
    category: "EVENT"
    status: "PENDING_APPROVAL"
    extraction:
      strategy: "CKAN_DATASTORE"
      dataset: "agenda-cultural"
      resourceSelector:
        format: "CSV"
        datastoreActive: true
      fieldMap:
        externalId: "register_id"
        title: "name"
        summary: ["name", "institution_name"]
        startsAt: "start_date"
        endsAt: "end_date"
      pageSize: 100
      maxRecords: 500
      timeoutMs: 30000
      groupBy: "register_id"
`;

    const result = await service.loadSeed(validCkanYaml);

    expect(result.success).toBe(true);
    expect(repo.upsertFromSeed).toHaveBeenCalledTimes(1);
    const calledEntries = vi.mocked(repo.upsertFromSeed).mock.calls[0][0];
    expect(calledEntries).toHaveLength(1);
    expect(calledEntries[0].extraction).toEqual(
      expect.objectContaining({
        strategy: 'CKAN_DATASTORE',
        dataset: 'agenda-cultural',
        pageSize: 100,
        maxRecords: 500,
        timeoutMs: 30000,
        groupBy: 'register_id',
      })
    );
  });

  it('CA-2 & CA-4: rechaza estrategias no permitidas (RSS_ENRICHED, SPARQL_CUSTOM, SOCRATA_WINDOW) con 422', async () => {
    const repo = createMockRepo();
    const service = new ContextSourceSeedService(repo);

    const invalidStrategyYaml = `
version: "1.0.0"
sources:
  - sourceTag: "bcn-invalid-strat"
    displayName: "Invalid Strategy"
    endpoint: "https://example.com/api"
    type: "API_REST"
    category: "EVENT"
    status: "ACTIVE"
    extraction:
      strategy: "RSS_ENRICHED"
      dataset: "test"
      resourceSelector:
        format: "CSV"
        datastoreActive: true
      fieldMap:
        externalId: "id"
        title: "title"
        summary: "desc"
      pageSize: 50
      maxRecords: 100
      timeoutMs: 10000
`;

    const result = await service.loadSeed(invalidStrategyYaml);

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(422);
    expect(repo.upsertFromSeed).not.toHaveBeenCalled();
  });

  it('CA-3 & CA-4: rechaza bloque extraction con fieldMap incompleto (falta externalId) con 422', async () => {
    const repo = createMockRepo();
    const service = new ContextSourceSeedService(repo);

    const incompleteMapYaml = `
version: "1.0.0"
sources:
  - sourceTag: "bcn-incomplete"
    displayName: "Incomplete Map"
    endpoint: "https://example.com/api"
    type: "API_REST"
    category: "EVENT"
    status: "ACTIVE"
    extraction:
      strategy: "CKAN_DATASTORE"
      dataset: "test"
      resourceSelector:
        format: "CSV"
        datastoreActive: true
      fieldMap:
        title: "title"
        summary: "desc"
      pageSize: 50
      maxRecords: 100
      timeoutMs: 10000
`;

    const result = await service.loadSeed(incompleteMapYaml);

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(422);
    expect(repo.upsertFromSeed).not.toHaveBeenCalled();
  });

  it('CA-3 & CA-4: rechaza bloque extraction si incluye resource_id con 422', async () => {
    const repo = createMockRepo();
    const service = new ContextSourceSeedService(repo);

    const withResourceIdYaml = `
version: "1.0.0"
sources:
  - sourceTag: "bcn-resource-id"
    displayName: "With Resource ID"
    endpoint: "https://example.com/api"
    type: "API_REST"
    category: "EVENT"
    status: "ACTIVE"
    extraction:
      strategy: "CKAN_DATASTORE"
      dataset: "test"
      resource_id: "res-1234"
      resourceSelector:
        format: "CSV"
        datastoreActive: true
      fieldMap:
        externalId: "id"
        title: "title"
        summary: "desc"
      pageSize: 50
      maxRecords: 100
      timeoutMs: 10000
`;

    const result = await service.loadSeed(withResourceIdYaml);

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(422);
    expect(repo.upsertFromSeed).not.toHaveBeenCalled();
  });
});
