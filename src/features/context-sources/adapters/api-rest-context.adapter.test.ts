import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ApiRestContextAdapter } from './api-rest-context.adapter';
import { ContextSourceSnapshot } from '../context-source.types';

describe('ApiRestContextAdapter', () => {
  const fixturePath = path.resolve(
    __dirname,
    '../../../../Documentacion/Fuentes/muestras-contexto/bcn-opendata-ckan.json'
  );
  const rawCkan = fs.readFileSync(fixturePath, 'utf8');

  const baseSource: ContextSourceSnapshot = {
    id: 'src-ckan-1',
    sourceTag: 'bcn-opendata-ckan',
    displayName: 'Open Data Barcelona CKAN',
    endpoint: 'https://opendata-ajuntament.barcelona.cat/data/api/3/action/package_search?q=agenda',
    type: 'API_REST',
    category: 'EVENT',
    status: 'ACTIVE',
    failedAttempts: 0,
    lastSuccessAt: null,
    proposedBy: 'SEED',
    supersedesSourceTag: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('debe procesar exitosamente la muestra real de CKAN package_search', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => JSON.parse(rawCkan),
    });

    const adapter = new ApiRestContextAdapter(mockFetch as unknown as typeof fetch);
    const result = await adapter.fetch(baseSource);

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.result!.length).toBeGreaterThanOrEqual(1);

    const first = result.result![0];
    expect(first.category).toBe('EVENT');
    expect(first.id).toMatch(/^bcn-opendata:/);
    expect(first.title).toBeDefined();
    expect(first.summary.length).toBeGreaterThanOrEqual(10);
  });

  it('debe retornar sobre con error si el servidor responde con error HTTP 404', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const adapter = new ApiRestContextAdapter(mockFetch as unknown as typeof fetch);
    const result = await adapter.fetch(baseSource);

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(404);
  });
});
