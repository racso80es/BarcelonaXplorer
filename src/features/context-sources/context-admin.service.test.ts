import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContextAdminService } from './context-admin.service';
import { IContextSourceRepository } from './context-source.repository.port';
import { ContextSourceSnapshot } from './context-source.types';
import { createSuccessEnvelope } from '@/shared/operation-envelope';

vi.mock('@/features/cognitive-memory/lancedb-client', () => ({
  getLanceDbConnection: vi.fn(),
}));

describe('ContextAdminService', () => {
  let mockSourceRepo: IContextSourceRepository;
  const dummySource: ContextSourceSnapshot = {
    id: 'src-123',
    sourceTag: 'test-source',
    displayName: 'Fuente de Prueba',
    endpoint: 'https://test.bcn/events',
    type: 'JSON_LD',
    category: 'EVENT',
    status: 'PENDING_APPROVAL',
    failedAttempts: 0,
    proposedBy: 'ARGOS',
  };

  beforeEach(() => {
    mockSourceRepo = {
      findAll: vi.fn().mockResolvedValue([dummySource]),
      findByStatus: vi.fn().mockResolvedValue([dummySource]),
      findByTag: vi.fn().mockResolvedValue(dummySource),
      save: vi.fn().mockImplementation((s) => Promise.resolve(createSuccessEnvelope(s))),
      create: vi.fn(),
      upsertFromSeed: vi.fn(),
    };
  });

  it('lista fuentes registradas en el repositorio', async () => {
    const service = new ContextAdminService(mockSourceRepo);
    const sources = await service.listSources();
    expect(sources).toHaveLength(1);
    expect(sources[0].sourceTag).toBe('test-source');
  });

  it('permite transiciones legales como APPROVE desde PENDING_APPROVAL hacia ACTIVE (CA-4)', async () => {
    const service = new ContextAdminService(mockSourceRepo);
    const envelope = await service.transitionSource('src-123', 'APPROVE', 'HUMAN');

    expect(envelope.success).toBe(true);
    expect(envelope.result?.status).toBe('ACTIVE');
    expect(mockSourceRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ACTIVE',
      })
    );
  });

  it('rechaza transiciones ilegales con código 422 sin mutar la base de datos (CA-4 / Escenario 4)', async () => {
    // Para PENDING_APPROVAL, el evento INGEST_OK o INGEST_FAIL no es legal para HUMAN
    const service = new ContextAdminService(mockSourceRepo);
    const envelope = await service.transitionSource('src-123', 'INGEST_OK', 'HUMAN');

    expect(envelope.success).toBe(false);
    expect(envelope.exitCode).toBe(422);
    expect(envelope.errors?.[0]).toContain('Transición ilegal');
    expect(mockSourceRepo.save).not.toHaveBeenCalled();
  });

  it('permite PROPOSE_CORRECTION actualizando el endpoint', async () => {
    const service = new ContextAdminService(mockSourceRepo);
    const envelope = await service.transitionSource(
      'src-123',
      'PROPOSE_CORRECTION',
      'HUMAN',
      { endpoint: 'https://test.bcn/events-corregido' }
    );

    expect(envelope.success).toBe(true);
    expect(envelope.result?.endpoint).toBe('https://test.bcn/events-corregido');
  });

  describe('Aduana de APPROVE para CKAN_DATASTORE sin extracción (PBI-CTX-028)', () => {
    const ckanSourceNoExtraction: ContextSourceSnapshot = {
      id: 'src-ckan-1',
      sourceTag: 'bcn-ckan-argos',
      displayName: 'Propuesta CKAN Argos',
      endpoint: 'https://opendata-ajuntament.barcelona.cat/data/api/3/action/package_show?id=agenda',
      type: 'CKAN_DATASTORE',
      category: 'EVENT',
      status: 'PENDING_APPROVAL',
      failedAttempts: 0,
      proposedBy: 'ARGOS',
    };

    const validCkanExtraction = {
      strategy: 'CKAN_DATASTORE' as const,
      dataset: 'culturailleure-parcsjardins',
      resourceSelector: {
        format: 'CSV' as const,
        datastoreActive: true,
      },
      fieldMap: {
        externalId: 'register_id',
        title: 'name',
        summary: 'institution_name',
      },
      pageSize: 100,
      maxRecords: 1000,
      timeoutMs: 10000,
    };

    it('CA-1: rechaza APPROVE con 422 si extractionConfig es ausente o null sin llamar a save', async () => {
      vi.mocked(mockSourceRepo.findAll).mockResolvedValue([ckanSourceNoExtraction]);

      const service = new ContextAdminService(mockSourceRepo);
      const envelope = await service.transitionSource('src-ckan-1', 'APPROVE', 'HUMAN');

      expect(envelope.success).toBe(false);
      expect(envelope.exitCode).toBe(422);
      expect(envelope.errors?.[0]).toContain('requiere una configuración de extracción válida');
      expect(mockSourceRepo.save).not.toHaveBeenCalled();
    });

    it('CA-2: rechaza APPROVE con 422 si extractionConfig no pasa CkanDatastoreExtractionConfigSchema', async () => {
      const ckanSourceInvalidExtraction: ContextSourceSnapshot = {
        ...ckanSourceNoExtraction,
        // Configuración inválida (falta dataset y fieldMap)
        extractionConfig: {
          strategy: 'CKAN_DATASTORE',
          pageSize: 50,
        } as unknown as ContextSourceSnapshot['extractionConfig'],
      };
      vi.mocked(mockSourceRepo.findAll).mockResolvedValue([ckanSourceInvalidExtraction]);

      const service = new ContextAdminService(mockSourceRepo);
      const envelope = await service.transitionSource('src-ckan-1', 'APPROVE', 'HUMAN');

      expect(envelope.success).toBe(false);
      expect(envelope.exitCode).toBe(422);
      expect(mockSourceRepo.save).not.toHaveBeenCalled();
    });

    it('CA-3: aprueba y llama a save cuando extractionConfig es válido', async () => {
      const ckanSourceValidExtraction: ContextSourceSnapshot = {
        ...ckanSourceNoExtraction,
        extractionConfig: validCkanExtraction,
      };
      vi.mocked(mockSourceRepo.findAll).mockResolvedValue([ckanSourceValidExtraction]);

      const service = new ContextAdminService(mockSourceRepo);
      const envelope = await service.transitionSource('src-ckan-1', 'APPROVE', 'HUMAN');

      expect(envelope.success).toBe(true);
      expect(envelope.result?.status).toBe('ACTIVE');
      expect(mockSourceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'src-ckan-1',
          status: 'ACTIVE',
        })
      );
    });

    it('CA-4: permite REJECT de un CKAN_DATASTORE sin extracción pasando a INACTIVE', async () => {
      vi.mocked(mockSourceRepo.findAll).mockResolvedValue([ckanSourceNoExtraction]);

      const service = new ContextAdminService(mockSourceRepo);
      const envelope = await service.transitionSource('src-ckan-1', 'REJECT', 'HUMAN');

      expect(envelope.success).toBe(true);
      expect(envelope.result?.status).toBe('INACTIVE');
      expect(mockSourceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'src-ckan-1',
          status: 'INACTIVE',
        })
      );
    });
  });

  describe('listMemoryEntries', () => {
    it('retorna lista vacía con isAvailable: true si context_memory no existe', async () => {
      const { getLanceDbConnection } = await import('@/features/cognitive-memory/lancedb-client');
      vi.mocked(getLanceDbConnection).mockResolvedValueOnce({
        tableNames: vi.fn().mockResolvedValue(['other_table']),
      } as unknown as import('@lancedb/lancedb').Connection);

      const service = new ContextAdminService(mockSourceRepo);
      const res = await service.listMemoryEntries();

      expect(res.isAvailable).toBe(true);
      expect(res.entries).toEqual([]);
    });

    it('retorna registros mapeados correctamente cuando context_memory existe', async () => {
      const { getLanceDbConnection } = await import('@/features/cognitive-memory/lancedb-client');
      const mockTable = {
        query: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              {
                id: 'test-1',
                text: 'Resumen de prueba',
                metadata: JSON.stringify({
                  sourceTag: 'wikidata-monuments',
                  category: 'POI',
                  title: 'Sagrada Família',
                  summary: 'Basílica monumental en Barcelona',
                  expiresAt: '2026-12-31T23:59:59.000Z',
                  contentHash: 'hash123',
                }),
              },
            ]),
          }),
        }),
      };

      vi.mocked(getLanceDbConnection).mockResolvedValueOnce({
        tableNames: vi.fn().mockResolvedValue(['context_memory']),
        openTable: vi.fn().mockResolvedValue(mockTable),
      } as unknown as import('@lancedb/lancedb').Connection);

      const service = new ContextAdminService(mockSourceRepo);
      const res = await service.listMemoryEntries(10);

      expect(res.isAvailable).toBe(true);
      expect(res.entries).toHaveLength(1);
      expect(res.entries[0].title).toBe('Sagrada Família');
      expect(res.entries[0].category).toBe('POI');
      expect(res.entries[0].sourceTag).toBe('wikidata-monuments');
    });

    it('retorna isAvailable: false cuando falla la conexión con LanceDB', async () => {
      const { getLanceDbConnection } = await import('@/features/cognitive-memory/lancedb-client');
      vi.mocked(getLanceDbConnection).mockRejectedValueOnce(new Error('LanceDB connection failed'));

      const service = new ContextAdminService(mockSourceRepo);
      const res = await service.listMemoryEntries();

      expect(res.isAvailable).toBe(false);
      expect(res.entries).toEqual([]);
    });
  });
});
