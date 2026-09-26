/**
 * Puerto de Caché Semántica Vectorial (PBI-COGN-CACHE-001)
 * Protocolo de Acero — Grado S+
 * Axioma I: Localidad de Comportamiento (Feature: cognitive-memory)
 * Axioma II: Tolerancia Cero a la Inferencia (Contratos tipados)
 */

export interface CachedTriageResult {
  prompt: string;
  result: Record<string, unknown>;
  similarity: number;
  tokensSaved: number;
  createdAt: Date;
}

export interface ISemanticCachePort {
  /**
   * Busca una coincidencia semántica en la tabla de vectores según umbral de similitud.
   */
  get(vector: number[]): Promise<CachedTriageResult | null>;

  /**
   * Almacena un resultado estructurado asociado al vector del prompt para futuras consultas.
   */
  set(
    prompt: string,
    vector: number[],
    result: Record<string, unknown>,
    tokensSaved?: number,
  ): Promise<void>;
}
