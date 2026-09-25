import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LanceDbVectorAdapter } from '@/infrastructure/vector/lancedb-vector.adapter';
import { resetLanceDbConnection } from '@/infrastructure/vector/lancedb-client';
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
});
