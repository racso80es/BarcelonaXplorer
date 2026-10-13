import { describe, it, expect } from 'vitest';
import {
  assessIngestionFreshness,
  INGESTION_STALE_AFTER_MS,
} from './ingestion-freshness';

describe('assessIngestionFreshness (PBI-CTX-030 / CA-4)', () => {
  const fixedNow = new Date('2026-10-13T10:00:00.000Z');

  it('Fila 1: Ninguna fuente ACTIVE => stale es falso', () => {
    const sources = [
      { status: 'PENDING_APPROVAL', lastSuccessAt: null },
      { status: 'INACTIVE', lastSuccessAt: new Date('2026-10-01T00:00:00.000Z') },
      { status: 'DEGRADED', lastSuccessAt: new Date('2026-10-02T00:00:00.000Z') },
    ];

    const result = assessIngestionFreshness(sources, fixedNow);
    expect(result.stale).toBe(false);
    expect(result.activeCount).toBe(0);
    expect(result.activeWithoutSuccess).toBe(0);
    expect(result.newestSuccessAt).toBeNull();
  });

  it('Fila 2: Alguna fuente ACTIVE y todas con lastSuccessAt null => stale es verdadero', () => {
    const sources = [
      { status: 'ACTIVE', lastSuccessAt: null },
      { status: 'ACTIVE', lastSuccessAt: null },
      { status: 'PENDING_APPROVAL', lastSuccessAt: null },
    ];

    const result = assessIngestionFreshness(sources, fixedNow);
    expect(result.stale).toBe(true);
    expect(result.activeCount).toBe(2);
    expect(result.activeWithoutSuccess).toBe(2);
    expect(result.newestSuccessAt).toBeNull();
  });

  it('Fila 3: El máximo lastSuccessAt es anterior a now - 26 h => stale es verdadero', () => {
    // 26 h antes de 2026-10-13T10:00:00Z es 2026-10-12T08:00:00Z
    // Ponemos una fecha anterior (ej. 27 horas antes)
    const twentySevenHoursAgo = new Date(fixedNow.getTime() - (INGESTION_STALE_AFTER_MS + 3600 * 1000));
    const twoDaysAgo = new Date(fixedNow.getTime() - 48 * 3600 * 1000);

    const sources = [
      { status: 'ACTIVE', lastSuccessAt: twoDaysAgo },
      { status: 'ACTIVE', lastSuccessAt: twentySevenHoursAgo },
      { status: 'ACTIVE', lastSuccessAt: null },
      { status: 'INACTIVE', lastSuccessAt: fixedNow }, // No debe contar por ser INACTIVE
    ];

    const result = assessIngestionFreshness(sources, fixedNow);
    expect(result.stale).toBe(true);
    expect(result.activeCount).toBe(3);
    expect(result.activeWithoutSuccess).toBe(1);
    expect(result.newestSuccessAt).toEqual(twentySevenHoursAgo);
  });

  it('Fila 4: El máximo lastSuccessAt cae dentro de las 26 h => stale es falso', () => {
    // 10 horas antes de fixedNow (dentro de las 26 h)
    const tenHoursAgo = new Date(fixedNow.getTime() - 10 * 3600 * 1000);
    const twoDaysAgo = new Date(fixedNow.getTime() - 48 * 3600 * 1000);

    const sources = [
      { status: 'ACTIVE', lastSuccessAt: twoDaysAgo },
      { status: 'ACTIVE', lastSuccessAt: tenHoursAgo },
      { status: 'ACTIVE', lastSuccessAt: null },
    ];

    const result = assessIngestionFreshness(sources, fixedNow);
    expect(result.stale).toBe(false);
    expect(result.activeCount).toBe(3);
    expect(result.activeWithoutSuccess).toBe(1);
    expect(result.newestSuccessAt).toEqual(tenHoursAgo);
  });
});
