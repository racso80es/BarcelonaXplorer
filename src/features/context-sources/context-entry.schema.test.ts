import { describe, expect, it } from 'vitest';
import {
  calculateContextContentHash,
  ContextEntrySchema,
} from './context-entry.schema';

describe('ContextEntrySchema & calculateContextContentHash', () => {
  const validEntry = {
    id: 'gencat-agenda-cultural:ev-12345',
    sourceTag: 'gencat-agenda-cultural',
    category: 'EVENT' as const,
    title: 'Concierto de Jazz en Ciutat Vella',
    summary: 'Concierto al aire libre en la plaza del Rei con artistas locales e internacionales.',
    startsAt: '2026-10-15T19:00:00.000Z',
    endsAt: '2026-10-15T21:30:00.000Z',
    location: {
      name: 'Plaça del Rei, Barcelona',
      lat: 41.3839,
      lng: 2.1772,
    },
    url: 'https://agenda.cat/esdeveniment/12345',
    price: 'Gratuito',
    tags: ['jazz', 'cultura', 'ciutat-vella'],
    expiresAt: '2026-10-16T21:30:00.000Z',
    contentHash: 'a'.repeat(64),
  };

  it('debe validar exitosamente una entrada conforme a los límites canónicos de Barcelona', () => {
    const parseResult = ContextEntrySchema.safeParse(validEntry);
    expect(parseResult.success).toBe(true);
  });

  it('debe rechazar coordenadas fuera de la caja geográfica de Barcelona (lat < 41.2 o > 41.5)', () => {
    const badLatEntry = {
      ...validEntry,
      location: {
        ...validEntry.location,
        lat: 40.5, // Fuera de BCN
      },
    };
    const result = ContextEntrySchema.safeParse(badLatEntry);
    expect(result.success).toBe(false);
  });

  it('debe rechazar coordenadas fuera de la caja geográfica de Barcelona (lng < 2.0 o > 2.3)', () => {
    const badLngEntry = {
      ...validEntry,
      location: {
        ...validEntry.location,
        lng: 2.5, // Fuera de BCN
      },
    };
    const result = ContextEntrySchema.safeParse(badLngEntry);
    expect(result.success).toBe(false);
  });

  it('debe rechazar resúmenes menores a 10 caracteres o mayores a 1200', () => {
    const tooShort = {
      ...validEntry,
      summary: 'Corto',
    };
    expect(ContextEntrySchema.safeParse(tooShort).success).toBe(false);

    const tooLong = {
      ...validEntry,
      summary: 'L'.repeat(1201),
    };
    expect(ContextEntrySchema.safeParse(tooLong).success).toBe(false);
  });

  it('debe calcular hash SHA-256 de exactamente 64 caracteres hex y ser determinista', () => {
    const hash1 = calculateContextContentHash({
      title: 'Concierto Jazz',
      summary: 'Música en vivo',
      startsAt: '2026-10-15T19:00:00.000Z',
    });
    const hash2 = calculateContextContentHash({
      title: 'Concierto Jazz',
      summary: 'Música en vivo',
      startsAt: '2026-10-15T19:00:00.000Z',
    });

    expect(hash1).toHaveLength(64);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    expect(hash1).toBe(hash2);

    const hashDifferent = calculateContextContentHash({
      title: 'Concierto Jazz Editado',
      summary: 'Música en vivo',
      startsAt: '2026-10-15T19:00:00.000Z',
    });
    expect(hashDifferent).not.toBe(hash1);
  });
});
