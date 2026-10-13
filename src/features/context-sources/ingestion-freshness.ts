/**
 * Módulo de evaluación de frescura de la ingesta de fuentes de contexto (PBI-CTX-030).
 *
 * Función pura determinista sin reloj oculto. El llamador provee 'now'.
 */

export const INGESTION_STALE_AFTER_MS = 26 * 60 * 60 * 1000;

export interface IngestionFreshness {
  readonly stale: boolean;
  readonly newestSuccessAt: Date | null;
  readonly activeCount: number;
  readonly activeWithoutSuccess: number;
}

export interface IngestionFreshnessSourceInput {
  readonly status: string;
  readonly lastSuccessAt?: Date | string | null;
}

/**
 * Evalúa si el ciclo de ingesta está estancado o inerte basándose en el lastSuccessAt
 * de las fuentes en estado ACTIVE.
 *
 * Reglas deterministas:
 * - Si activeCount === 0 => stale: false
 * - Si activeCount > 0 y activeWithoutSuccess === activeCount (ninguna tiene lastSuccessAt) => stale: true
 * - Si el más reciente lastSuccessAt es anterior a (now - 26 h) => stale: true
 * - Si el más reciente lastSuccessAt cae dentro de las 26 h => stale: false
 */
export function assessIngestionFreshness(
  sources: readonly IngestionFreshnessSourceInput[],
  now: Date = new Date(),
): IngestionFreshness {
  const activeSources = sources.filter((s) => s.status === 'ACTIVE');
  const activeCount = activeSources.length;

  if (activeCount === 0) {
    return {
      stale: false,
      newestSuccessAt: null,
      activeCount: 0,
      activeWithoutSuccess: 0,
    };
  }

  let activeWithoutSuccess = 0;
  let newestSuccessAt: Date | null = null;

  for (const source of activeSources) {
    if (!source.lastSuccessAt) {
      activeWithoutSuccess += 1;
      continue;
    }

    const dateVal =
      source.lastSuccessAt instanceof Date
        ? source.lastSuccessAt
        : new Date(source.lastSuccessAt);

    if (isNaN(dateVal.getTime())) {
      activeWithoutSuccess += 1;
      continue;
    }

    if (!newestSuccessAt || dateVal.getTime() > newestSuccessAt.getTime()) {
      newestSuccessAt = dateVal;
    }
  }

  if (newestSuccessAt === null) {
    return {
      stale: true,
      newestSuccessAt: null,
      activeCount,
      activeWithoutSuccess,
    };
  }

  const thresholdMs = now.getTime() - INGESTION_STALE_AFTER_MS;
  const stale = newestSuccessAt.getTime() < thresholdMs;

  return {
    stale,
    newestSuccessAt,
    activeCount,
    activeWithoutSuccess,
  };
}
