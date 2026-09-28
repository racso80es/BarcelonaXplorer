/** Dimensión canónica del espacio de embeddings (Gemini / LanceDB). */
export const EMBEDDING_DIMENSIONS = 768;

/**
 * Vector determinista normalizado L2 a partir del texto (fallback cuando el proveedor falla).
 * Misma semilla → mismo vector; usado también por el script de purga LanceDB (PBI-STEEL-002).
 */
export function buildDeterministicFallbackVector(
  seedText: string,
  dimensions: number = EMBEDDING_DIMENSIONS,
): number[] {
  const vector = new Array<number>(dimensions);
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = (hash << 5) - hash + seedText.charCodeAt(i);
    hash |= 0;
  }

  let sumSq = 0;
  for (let i = 0; i < dimensions; i++) {
    hash = (hash * 1664525 + 1013904223) | 0;
    const val = hash / 0x7fffffff;
    vector[i] = val;
    sumSq += val * val;
  }

  const norm = Math.sqrt(sumSq) || 1;
  for (let i = 0; i < dimensions; i++) {
    vector[i] = vector[i] / norm;
  }

  return vector;
}

export const FALLBACK_VECTOR_FLOAT_TOLERANCE = 1e-6;

export function vectorMatchesDeterministicFallback(
  stored: number[],
  text: string,
  dimensions: number = EMBEDDING_DIMENSIONS,
): boolean {
  if (stored.length !== dimensions) {
    return false;
  }
  const expected = buildDeterministicFallbackVector(text, dimensions);
  for (let i = 0; i < dimensions; i++) {
    if (Math.abs(stored[i] - expected[i]) >= FALLBACK_VECTOR_FLOAT_TOLERANCE) {
      return false;
    }
  }
  return true;
}
