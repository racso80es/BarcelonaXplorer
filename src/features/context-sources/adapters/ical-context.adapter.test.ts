import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { IcalContextAdapter } from './ical-context.adapter';
import { ContextSourceSnapshot } from '../context-source.types';

describe('IcalContextAdapter', () => {
  const fixturePath = path.resolve(
    __dirname,
    '../../../../Documentacion/Fuentes/muestras-contexto/bcn-festes.ics'
  );
  const rawIcs = fs.readFileSync(fixturePath, 'utf8');

  const baseSource: ContextSourceSnapshot = {
    id: 'src-ical-1',
    sourceTag: 'bcn-festes-laborals',
    displayName: 'BCN Festes Laborals',
    endpoint: 'https://opendata-ajuntament.barcelona.cat/data/bcn-festes.ics',
    type: 'ICAL',
    category: 'EVENT',
    status: 'ACTIVE',
    failedAttempts: 0,
    lastSuccessAt: null,
    proposedBy: 'SEED',
    supersedesSourceTag: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('debe procesar exitosamente la muestra real de iCalendar convirtiendo fechas a ISO', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => rawIcs,
    });

    const adapter = new IcalContextAdapter(mockFetch as unknown as typeof fetch);
    const result = await adapter.fetch(baseSource);

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.result!.length).toBeGreaterThanOrEqual(5);

    const first = result.result![0];
    expect(first.category).toBe('EVENT');
    expect(first.id).toMatch(/^bcn-festes:/);
    expect(first.price).toBe('Gratis');
    expect(first.startsAt).toBeDefined();
    expect(first.endsAt).toBeDefined();
    expect(first.title).toBe("Cap d'Any");
  });

  it('debe rechazar con error 422 si el contenido recibido no tiene cabecera VCALENDAR', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'NOT_AN_ICS_FILE',
    });

    const adapter = new IcalContextAdapter(mockFetch as unknown as typeof fetch);
    const result = await adapter.fetch(baseSource);

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(422);
  });
});
