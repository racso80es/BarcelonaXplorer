import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { CkanDatastoreContextAdapter } from './ckan-datastore-context.adapter';
import { ContextSourceSnapshot } from '../context-source.types';

describe('CkanDatastoreContextAdapter', () => {
  const packageShowFixturePath = path.resolve(
    __dirname,
    '../../../../Documentacion/Fuentes/muestras-contexto/ckan-package-show-agenda-cultural.json'
  );
  const datastoreFixturePath = path.resolve(
    __dirname,
    '../../../../Documentacion/Fuentes/muestras-contexto/ckan-datastore-agenda-cultural.json'
  );

  const rawPackageShow = fs.readFileSync(packageShowFixturePath, 'utf8');
  const rawDatastore = fs.readFileSync(datastoreFixturePath, 'utf8');

  const validSnapshot: ContextSourceSnapshot = {
    id: 'src-ckan-agenda-1',
    sourceTag: 'bcn-agenda-cultural',
    displayName: 'Ajuntament de Barcelona - Agenda Cultural CKAN',
    endpoint: 'https://opendata-ajuntament.barcelona.cat/data/api/3/action',
    type: 'CKAN_DATASTORE',
    category: 'EVENT',
    status: 'ACTIVE',
    failedAttempts: 0,
    lastSuccessAt: null,
    proposedBy: 'SEED',
    supersedesSourceTag: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    extractionConfig: {
      strategy: 'CKAN_DATASTORE',
      dataset: 'cultura-agenda-cultural',
      resourceSelector: {
        format: 'CSV',
        datastoreActive: true,
      },
      pageSize: 50,
      maxRecords: 100,
      fieldMap: {
        externalId: 'register_id',
        title: 'name',
        summary: ['institution_name', 'addresses_road_name'],
        startsAt: 'start_date',
        endsAt: 'end_date',
        lat: 'geo_epgs_4326_lat',
        lng: 'geo_epgs_4326_lon',
        locationName: 'institution_name',
        tags: ['interest_name'],
      },
      groupBy: 'register_id',
      timeoutMs: 5000,
    },
  };

  it('debe ejecutar flujo bifásico exitoso con fixtures reales de Agenda Cultural', async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('package_show')) {
        return {
          ok: true,
          status: 200,
          json: async () => JSON.parse(rawPackageShow),
        };
      }
      if (url.includes('datastore_search')) {
        return {
          ok: true,
          status: 200,
          json: async () => JSON.parse(rawDatastore),
        };
      }
      throw new Error(`URL no esperada: ${url}`);
    });

    const adapter = new CkanDatastoreContextAdapter(mockFetch as unknown as typeof fetch);
    const envelope = await adapter.fetch(validSnapshot);

    expect(envelope.success).toBe(true);
    expect(envelope.result).toBeDefined();
    const entries = envelope.result!;
    expect(entries.length).toBeGreaterThan(0);

    // Verificar que package_show y datastore_search fueron llamados
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toContain('package_show?id=cultura-agenda-cultural');
    expect(mockFetch.mock.calls[1][0]).toContain('datastore_search?resource_id=3abb2414-1ee0-446e-9c25-380e938adb73');

    // Verificar estructura del primer registro
    const first = entries[0];
    expect(first.sourceTag).toBe('bcn-agenda-cultural');
    expect(first.category).toBe('EVENT');
    expect(first.id).toMatch(/^bcn-agenda-cultural:/);
    expect(first.id).not.toContain('\ufeff');
    expect(first.title).toBeDefined();
    expect(first.summary.length).toBeGreaterThanOrEqual(10);
    expect(first.startsAt).toBeDefined();
    expect(first.contentHash).toBeDefined();

    // Validar orden cronológico ascendente (startsAt asc)
    for (let i = 0; i < entries.length - 1; i++) {
      const current = entries[i].startsAt ? new Date(entries[i].startsAt!).getTime() : 0;
      const next = entries[i + 1].startsAt ? new Date(entries[i + 1].startsAt!).getTime() : 0;
      expect(current).toBeLessThanOrEqual(next);
    }
  });

  it('debe retornar sobre con error 422 si falta la configuración de extracción o es inválida', async () => {
    const invalidSnapshot: ContextSourceSnapshot = {
      ...validSnapshot,
      extractionConfig: undefined,
    };

    const adapter = new CkanDatastoreContextAdapter();
    const envelope = await adapter.fetch(invalidSnapshot);

    expect(envelope.success).toBe(false);
    expect(envelope.exitCode).toBe(422);
    expect(envelope.errors).toContain('Configuración de extracción CKAN_DATASTORE inválida o ausente en la fuente');
  });

  it('debe retornar sobre con error si package_show responde con HTTP 404', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const adapter = new CkanDatastoreContextAdapter(mockFetch as unknown as typeof fetch);
    const envelope = await adapter.fetch(validSnapshot);

    expect(envelope.success).toBe(false);
    expect(envelope.exitCode).toBe(404);
  });

  it('debe retornar sobre con error si no se encuentra ningún recurso compatible en el dataset', async () => {
    const emptyResourcesShow = {
      success: true,
      result: {
        id: 'cultura-agenda-cultural',
        resources: [
          { id: 'res-1', format: 'JSON', datastore_active: false },
        ],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => emptyResourcesShow,
    });

    const adapter = new CkanDatastoreContextAdapter(mockFetch as unknown as typeof fetch);
    const envelope = await adapter.fetch(validSnapshot);

    expect(envelope.success).toBe(false);
    expect(envelope.exitCode).toBe(422);
    expect(envelope.feedback).toContain('Ambigüedad o ausencia de recurso en dataset CKAN');
  });

  it('debe retornar sobre con error si hay ambigüedad (>1 recursos compatibles)', async () => {
    const ambiguousShow = {
      success: true,
      result: {
        id: 'cultura-agenda-cultural',
        resources: [
          { id: 'res-1', format: 'CSV', datastore_active: true },
          { id: 'res-2', format: 'CSV', datastore_active: true },
        ],
      },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ambiguousShow,
    });

    const adapter = new CkanDatastoreContextAdapter(mockFetch as unknown as typeof fetch);
    const envelope = await adapter.fetch(validSnapshot);

    expect(envelope.success).toBe(false);
    expect(envelope.exitCode).toBe(422);
    expect(envelope.feedback).toContain('Ambigüedad o ausencia de recurso en dataset CKAN');
  });

  it('debe paginar deterministamente si el total supera pageSize y respetar maxRecords', async () => {
    const mockPackageShow = {
      success: true,
      result: {
        resources: [{ id: 'res-test-pag', format: 'CSV', datastore_active: true }],
      },
    };

    const page1 = {
      success: true,
      result: {
        resource_id: 'res-test-pag',
        total: 3,
        records: [
          { register_id: 'REC-1', name: 'Evento 1', start_date: '2026-10-15T10:00:00' },
          { register_id: 'REC-2', name: 'Evento 2', start_date: '2026-10-16T10:00:00' },
        ],
      },
    };

    const page2 = {
      success: true,
      result: {
        resource_id: 'res-test-pag',
        total: 3,
        records: [
          { register_id: 'REC-3', name: 'Evento 3', start_date: '2026-10-17T10:00:00' },
        ],
      },
    };

    const customSnapshot: ContextSourceSnapshot = {
      ...validSnapshot,
      extractionConfig: {
        ...validSnapshot.extractionConfig!,
        pageSize: 2,
        maxRecords: 10,
        fieldMap: {
          externalId: 'register_id',
          title: 'name',
          summary: 'name',
          startsAt: 'start_date',
        },
      },
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('package_show')) {
        return { ok: true, status: 200, json: async () => mockPackageShow };
      }
      if (url.includes('offset=0')) {
        return { ok: true, status: 200, json: async () => page1 };
      }
      if (url.includes('offset=2')) {
        return { ok: true, status: 200, json: async () => page2 };
      }
      throw new Error(`URL inesperada: ${url}`);
    });

    const adapter = new CkanDatastoreContextAdapter(mockFetch as unknown as typeof fetch);
    const envelope = await adapter.fetch(customSnapshot);

    expect(envelope.success).toBe(true);
    expect(envelope.result).toBeDefined();
    expect(envelope.result!.length).toBe(3);
    expect(mockFetch).toHaveBeenCalledTimes(3); // 1 package_show + 2 datastore_search
  });

  it('debe limpiar etiquetas HTML del sumario y recortar BOM en identificador', async () => {
    const mockPackageShow = {
      success: true,
      result: {
        resources: [{ id: 'res-html', format: 'CSV', datastore_active: true }],
      },
    };

    const recordsWithHtml = {
      success: true,
      result: {
        resource_id: 'res-html',
        total: 1,
        records: [
          {
            register_id: '\ufeff12345',
            name: 'Concierto de Jazz',
            desc: '<p>Gran concierto en <b>Plaza Real</b> con música en vivo.</p>',
            start_date: '2026-10-20T20:00:00',
          },
        ],
      },
    };

    const customSnapshot: ContextSourceSnapshot = {
      ...validSnapshot,
      extractionConfig: {
        ...validSnapshot.extractionConfig!,
        fieldMap: {
          externalId: 'register_id',
          title: 'name',
          summary: 'desc',
          startsAt: 'start_date',
        },
      },
    };

    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('package_show')) {
        return { ok: true, status: 200, json: async () => mockPackageShow };
      }
      return { ok: true, status: 200, json: async () => recordsWithHtml };
    });

    const adapter = new CkanDatastoreContextAdapter(mockFetch as unknown as typeof fetch);
    const envelope = await adapter.fetch(customSnapshot);

    expect(envelope.success).toBe(true);
    const entry = envelope.result![0];
    expect(entry.id).toBe('bcn-agenda-cultural:12345');
    expect(entry.summary).not.toContain('<p>');
    expect(entry.summary).not.toContain('<b>');
    expect(entry.summary).toContain('Gran concierto en Plaza Real');
  });
});
