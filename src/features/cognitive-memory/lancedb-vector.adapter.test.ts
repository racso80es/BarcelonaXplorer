import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { LanceDbVectorAdapter } from './lancedb-vector.adapter';
import { resetLanceDbConnection } from './lancedb-client';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('LanceDbVectorAdapter', () => {
  const testDir = path.join(os.tmpdir(), `lancedb_test_${Date.now()}`);
  let adapter: LanceDbVectorAdapter;

  beforeAll(() => {
    resetLanceDbConnection();
    adapter = new LanceDbVectorAdapter(testDir);
  });

  afterAll(() => {
    resetLanceDbConnection();
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch {
      // Ignorar fallos de limpieza en OS tmp
    }
  });

  it('debe confirmar que una tabla inexistente retorna false', async () => {
    const exists = await adapter.tableExists('non_existing_table');
    expect(exists).toBe(false);
  });

  it('debe insertar documentos y crear la tabla si no existe', async () => {
    const docs = [
      {
        id: 'doc-1',
        vector: [0.1, 0.2, 0.3],
        text: 'Visita a la Sagrada Família',
        metadata: { category: 'monuments', district: 'Eixample' },
      },
      {
        id: 'doc-2',
        vector: [0.9, 0.8, 0.7],
        text: 'Cata de vinos en El Born',
        metadata: { category: 'gastronomy', district: 'Ciutat Vella' },
      },
    ];

    await adapter.upsert('itineraries', docs);
    const exists = await adapter.tableExists('itineraries');
    expect(exists).toBe(true);
  });

  it('debe actualizar documentos existentes e insertar nuevos con mergeInsert (Upsert)', async () => {
    const updatedDocs = [
      {
        id: 'doc-1',
        vector: [0.1, 0.25, 0.35],
        text: 'Visita guiada a la Sagrada Família con acceso a torres',
        metadata: { category: 'monuments', district: 'Eixample', updated: true },
      },
      {
        id: 'doc-3',
        vector: [0.4, 0.5, 0.6],
        text: 'Paseo en velero por la Barceloneta',
        metadata: { category: 'sea', district: 'Sant Martí' },
      },
    ];

    await adapter.upsert('itineraries', updatedDocs);

    // Buscar doc-1 para certificar la actualización
    const searchResult = await adapter.search('itineraries', [0.1, 0.25, 0.35], 1);
    expect(searchResult.length).toBe(1);
    expect(searchResult[0].document.id).toBe('doc-1');
    expect(searchResult[0].document.text).toContain('acceso a torres');
    expect(searchResult[0].document.metadata).toEqual(
      expect.objectContaining({ updated: true })
    );
  });

  it('debe retornar resultados vacíos si se busca en una tabla que no existe', async () => {
    const results = await adapter.search('ghost_table', [0.1, 0.2, 0.3]);
    expect(results).toEqual([]);
  });

  it('debe calcular score de similitud en búsqueda vectorial', async () => {
    const results = await adapter.search('itineraries', [0.9, 0.8, 0.7], 2);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].document.id).toBe('doc-2');
    expect(results[0].score).toBeGreaterThan(0.9);
  });

  it('debe eliminar documentos mediante predicado SQL (poda higiénica)', async () => {
    await adapter.delete('itineraries', "id = 'doc-3'");
    const results = await adapter.search('itineraries', [0.4, 0.5, 0.6], 10);
    const doc3 = results.find((r) => r.document.id === 'doc-3');
    expect(doc3).toBeUndefined();
  });

  it('debe eliminar documentos mediante lista de IDs', async () => {
    await adapter.delete('itineraries', { ids: ['doc-2'] });
    const results = await adapter.search('itineraries', [0.9, 0.8, 0.7], 10);
    const doc2 = results.find((r) => r.document.id === 'doc-2');
    expect(doc2).toBeUndefined();
  });

  it('debe tolerar borrado con lista vacía de IDs sin colapsar', async () => {
    await expect(adapter.delete('itineraries', { ids: [] })).resolves.not.toThrow();
  });

  it('debe responder a la sonda ping reportando ok, latencia y conteo de tablas', async () => {
    const pingResult = await adapter.ping();
    expect(pingResult.ok).toBe(true);
    expect(pingResult.latencyMs).toBeGreaterThanOrEqual(0);
    expect(pingResult.path).toBe(testDir);
    expect(pingResult.tableCount).toBeGreaterThanOrEqual(1);
  });

  it('debe capturar y reportar fallo de permisos en la sonda ping ante error de I/O', async () => {
    const accessSpy = vi.spyOn(fs, 'accessSync').mockImplementationOnce(() => {
      const err = new Error('EACCES: permission denied, access /restricted_path');
      (err as NodeJS.ErrnoException).code = 'EACCES';
      throw err;
    });

    const pingResult = await adapter.ping();
    expect(pingResult.ok).toBe(false);
    expect(pingResult.error).toContain('EACCES: permission denied');
    expect(pingResult.tableCount).toBe(0);

    accessSpy.mockRestore();
  });

  it('CA-1: debe aplicar prefiltro where antes del top-K (50 filas de otras sesiones más cercanas y 1 de sesión objetivo)', async () => {
    // 50 documentos de otras sesiones muy cercanos a [1, 0, 0]
    const otherDocs = Array.from({ length: 50 }, (_, i) => ({
      id: `other-sess-${i}:matrix`,
      vector: [0.99, 0.01 * (i / 50), 0.01],
      text: `Other session doc ${i}`,
      metadata: { sessionId: `other-sess-${i}` },
    }));

    // 1 documento de la sesión objetivo con menor similitud a [1, 0, 0]
    const targetDoc = {
      id: 'target-sess-1:matrix',
      vector: [0.7, 0.3, 0.0],
      text: 'Target session doc',
      metadata: { sessionId: 'target-sess-1' },
    };

    await adapter.upsert('prefilter_test', [...otherDocs, targetDoc]);

    // Búsqueda con limit: 1 y prefiltro where
    const results = await adapter.search('prefilter_test', [1, 0, 0], {
      limit: 1,
      where: "id LIKE 'target-sess-1:%'",
    });

    expect(results).toHaveLength(1);
    expect(results[0].document.id).toBe('target-sess-1:matrix');
  });

  it('debe recuperar documentos por lista de IDs con getByIds para deduplicación térmica', async () => {
    const docs = [
      {
        id: 'dedup-1',
        vector: [0.1, 0.2, 0.3],
        text: 'Doc 1',
        metadata: { contentHash: 'hash-abc-1' },
      },
      {
        id: 'dedup-2',
        vector: [0.4, 0.5, 0.6],
        text: 'Doc 2',
        metadata: { contentHash: 'hash-abc-2' },
      },
    ];

    await adapter.upsert('dedup_test', docs);

    const found = await adapter.getByIds('dedup_test', ['dedup-1', 'dedup-2', 'dedup-inexistente']);
    expect(found).toHaveLength(2);
    expect(found.map((d) => d.id).sort()).toEqual(['dedup-1', 'dedup-2']);
    expect(found[0].metadata).toEqual(expect.objectContaining({ contentHash: expect.any(String) }));
  });

  it('CA-8: debe eliminar documentos caducados mediante { expiredBefore } y predicado expiresAt < ISO', async () => {
    const expiredDoc = {
      id: 'exp-old',
      vector: [0.1, 0.1, 0.1],
      text: 'Evento pasado',
      metadata: { expiresAt: '2026-01-01T00:00:00.000Z' },
    };
    const futureDoc = {
      id: 'exp-future',
      vector: [0.2, 0.2, 0.2],
      text: 'Evento futuro',
      metadata: { expiresAt: '2026-12-31T23:59:59.000Z' },
    };

    await adapter.upsert('expiry_test', [expiredDoc, futureDoc]);

    // Eliminar con expiredBefore
    await adapter.delete('expiry_test', { expiredBefore: '2026-06-01T00:00:00.000Z' });

    let remaining = await adapter.getByIds('expiry_test', ['exp-old', 'exp-future']);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('exp-future');

    // Insertar otro caducado y probar con filtro string "expiresAt < '...'"
    const anotherExpired = {
      id: 'exp-old-2',
      vector: [0.3, 0.3, 0.3],
      text: 'Otro evento pasado',
      metadata: { expiresAt: '2026-02-01T00:00:00.000Z' },
    };
    await adapter.upsert('expiry_test', [anotherExpired]);

    await adapter.delete('expiry_test', "expiresAt < '2026-06-01T00:00:00.000Z'");
    remaining = await adapter.getByIds('expiry_test', ['exp-old-2', 'exp-future']);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('exp-future');
  });
});

