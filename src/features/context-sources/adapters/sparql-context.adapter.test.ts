import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { SparqlContextAdapter } from './sparql-context.adapter';
import { ContextSourceSnapshot } from '../context-source.types';

describe('SparqlContextAdapter', () => {
  const fixturePath = path.resolve(
    __dirname,
    '../../../../Documentacion/Fuentes/muestras-contexto/wikidata-monuments.json'
  );
  const rawWikidata = fs.readFileSync(fixturePath, 'utf8');

  const baseSource: ContextSourceSnapshot = {
    id: 'src-sparql-1',
    sourceTag: 'wikidata-barcelona-monuments',
    displayName: 'Wikidata Monuments',
    endpoint: 'https://query.wikidata.org/sparql',
    type: 'SPARQL',
    category: 'POI',
    status: 'ACTIVE',
    failedAttempts: 0,
    lastSuccessAt: null,
    proposedBy: 'SEED',
    supersedesSourceTag: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('debe procesar exitosamente la muestra real de Wikidata SPARQL extrayendo coordenadas Point()', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => JSON.parse(rawWikidata),
    });

    const adapter = new SparqlContextAdapter(mockFetch as unknown as typeof fetch);
    const result = await adapter.fetch(baseSource);

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.result!.length).toBeGreaterThanOrEqual(4);

    const zoo = result.result!.find((e) => e.title.includes('Zoo'));
    expect(zoo).toBeDefined();
    expect(zoo?.id).toBe('wikidata:Q220013');
    expect(zoo?.category).toBe('POI');
    expect(zoo?.location?.lat).toBeCloseTo(41.387, 2);
    expect(zoo?.location?.lng).toBeCloseTo(2.191, 2);
  });

  it('debe incluir User-Agent identificable en los encabezados de cortesía', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => JSON.parse(rawWikidata),
    });

    const adapter = new SparqlContextAdapter(mockFetch as unknown as typeof fetch);
    await adapter.fetch(baseSource);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(baseSource.endpoint),
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('BarcelonaXplorer'),
        }),
      })
    );
  });

  it('debe retornar sobre con error si la respuesta SPARQL tiene estructura inválida', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ unexpected: 'structure' }),
    });

    const adapter = new SparqlContextAdapter(mockFetch as unknown as typeof fetch);
    const result = await adapter.fetch(baseSource);

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(422);
  });
});
