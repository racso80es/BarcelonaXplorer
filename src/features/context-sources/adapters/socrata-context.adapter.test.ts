import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { SocrataContextAdapter } from './socrata-context.adapter';
import { ContextSourceSnapshot } from '../context-source.types';

describe('SocrataContextAdapter', () => {
  const fixtureAgendaPath = path.resolve(
    __dirname,
    '../../../../Documentacion/Fuentes/muestras-contexto/socrata-agenda-cultural.json'
  );
  const fixtureEquipamentsPath = path.resolve(
    __dirname,
    '../../../../Documentacion/Fuentes/muestras-contexto/socrata-equipaments-culturals.json'
  );

  const rawAgenda = fs.readFileSync(fixtureAgendaPath, 'utf8');
  const rawEquipaments = fs.readFileSync(fixtureEquipamentsPath, 'utf8');

  const baseSource: ContextSourceSnapshot = {
    id: 'src-socrata-1',
    sourceTag: 'gencat-agenda-cultural',
    displayName: 'Agenda Cultural',
    endpoint: 'https://analisi.transparenciacatalunya.cat/resource/rhpv-yr4f.json',
    type: 'SOCRATA',
    category: 'EVENT',
    status: 'ACTIVE',
    failedAttempts: 0,
    lastSuccessAt: null,
    proposedBy: 'SEED',
    supersedesSourceTag: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('debe procesar exitosamente la muestra real de Socrata Agenda Cultural', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => JSON.parse(rawAgenda),
    });

    const adapter = new SocrataContextAdapter(mockFetch as unknown as typeof fetch);
    const result = await adapter.fetch(baseSource);

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.result!.length).toBeGreaterThanOrEqual(4);

    const first = result.result![0];
    expect(first.category).toBe('EVENT');
    expect(first.id).toMatch(/^gencat-agenda:/);
    expect(first.location?.lat).toBeCloseTo(41.38, 1);
    expect(first.location?.lng).toBeCloseTo(2.17, 1);
  });

  it('debe procesar exitosamente la muestra real de Socrata Equipaments Culturals', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => JSON.parse(rawEquipaments),
    });

    const equipSource: ContextSourceSnapshot = {
      ...baseSource,
      sourceTag: 'gencat-equipaments-culturals',
      category: 'VENUE',
    };

    const adapter = new SocrataContextAdapter(mockFetch as unknown as typeof fetch);
    const result = await adapter.fetch(equipSource);

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.result!.length).toBeGreaterThanOrEqual(4);

    const first = result.result![0];
    expect(first.category).toBe('VENUE');
    expect(first.id).toMatch(/^gencat-equip:/);
  });

  it('debe retornar sobre con error si el servidor Socrata responde HTTP 500', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const adapter = new SocrataContextAdapter(mockFetch as unknown as typeof fetch);
    const result = await adapter.fetch(baseSource);

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(500);
  });
});
