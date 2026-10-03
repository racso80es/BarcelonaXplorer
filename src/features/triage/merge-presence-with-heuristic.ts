import {
  DefaultDensityPayload,
  DefaultDensityPayloadSchema,
} from '@/features/planner';
import { DensityPresenceProbe } from './density-presence-probe.schema';

export interface MergePresenceWithHeuristicInput {
  prior: Partial<DefaultDensityPayload>;
  heuristic: DefaultDensityPayload;
  probe: DensityPresenceProbe;
}

/**
 * Función pura determinista para fusionar la sonda de presencia de Jev con la extracción
 * heurística del turno y el estado acumulado previo (PBI-ARCH-JEV-004).
 *
 * Reglas de retención por variable:
 * - time_window: si probe.has_time_window es true, se acepta la heurística del turno si es no vacía;
 *                en cualquier otro caso se retiene prior.time_window.
 * - group_size:  si probe.has_group_size es true, se acepta el entero positivo heurístico;
 *                en caso contrario se retiene prior.group_size.
 * - vibe:        si probe.has_vibe es true, se acepta la cadena no vacía heurística;
 *                en caso contrario se retiene prior.vibe.
 * - constraints: si probe.has_constraints es true, se acepta la lista con elementos;
 *                en caso contrario se retiene prior.constraints.
 * - districts, language, mood: se copian directamente del payload heurístico del turno.
 */
export function mergePresenceWithHeuristic(
  input: MergePresenceWithHeuristicInput,
): DefaultDensityPayload {
  const { prior, heuristic, probe } = input;

  const resolvedTimeWindow =
    probe.has_time_window &&
    typeof heuristic.time_window === 'string' &&
    heuristic.time_window.trim().length > 0
      ? heuristic.time_window
      : prior.time_window;

  const resolvedGroupSize =
    probe.has_group_size &&
    typeof heuristic.group_size === 'number' &&
    Number.isInteger(heuristic.group_size) &&
    heuristic.group_size > 0
      ? heuristic.group_size
      : prior.group_size;

  const resolvedVibe =
    probe.has_vibe &&
    typeof heuristic.vibe === 'string' &&
    heuristic.vibe.trim().length > 0
      ? heuristic.vibe
      : prior.vibe;

  const resolvedConstraints =
    probe.has_constraints &&
    Array.isArray(heuristic.constraints) &&
    heuristic.constraints.length > 0
      ? heuristic.constraints
      : (prior.constraints ?? []);

  const mergedRaw: Record<string, unknown> = {
    ...heuristic,
    constraints: resolvedConstraints,
    districts: heuristic.districts ?? prior.districts ?? [],
  };

  if (resolvedTimeWindow !== undefined) {
    mergedRaw.time_window = resolvedTimeWindow;
  } else {
    delete mergedRaw.time_window;
  }

  if (resolvedGroupSize !== undefined) {
    mergedRaw.group_size = resolvedGroupSize;
  } else {
    delete mergedRaw.group_size;
  }

  if (resolvedVibe !== undefined) {
    mergedRaw.vibe = resolvedVibe;
  } else {
    delete mergedRaw.vibe;
  }

  if (heuristic.mood !== undefined) {
    mergedRaw.mood = heuristic.mood;
  } else if (prior.mood !== undefined) {
    mergedRaw.mood = prior.mood;
  }

  if (heuristic.language !== undefined) {
    mergedRaw.language = heuristic.language;
  } else if (prior.language !== undefined) {
    mergedRaw.language = prior.language;
  }

  return DefaultDensityPayloadSchema.parse(mergedRaw);
}
