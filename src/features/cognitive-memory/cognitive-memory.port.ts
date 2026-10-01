import { DenseSemanticMatrix } from './dense-semantic-matrix.vo';

export interface CognitiveMemoryItem {
  readonly id: string;
  readonly sessionId: string;
  readonly matrixId: string;
  readonly denseText: string;
  readonly payload: Record<string, unknown>;
  readonly score: number;
  readonly timestamp: number;
}

export const COGNITIVE_MEMORY_KNN_MIN_SIMILARITY = 0.75;

export interface SearchSimilarMemoriesOptions {
  readonly sessionId: string;
  readonly limit?: number;
  readonly minSimilarity?: number;
}

/**
 * Puerto de Salida Hexagonal para la gestión de Memoria Cognitiva Vectorial (LanceDB RAG).
 * 
 * Principios Arquitectónicos S+ Grade:
 * 1. Recuperación K-NN especializada para contexto conversacional.
 * 2. Ingesta Acotada (Bounded Query Pattern): Límite duro obligatorio de 100 registros
 *    para consultas administrativas, blindando el servidor contra asfixia térmica y OOM.
 */
export interface ICognitiveMemoryPort {
  /**
   * Persiste una matriz densa consolidada en la tabla LanceDB ('cognitive_memories').
   */
  persistMemory(matrix: DenseSemanticMatrix, vector: number[]): Promise<void>;

  /**
   * Recupera la memoria más reciente consolidada para la sesión indicada.
   */
  getLatestSessionMemory(
    sessionId: string,
    matrixId?: string,
  ): Promise<DenseSemanticMatrix | null>;

  /**
   * Búsqueda por similitud semántica K-NN sobre la memoria de la sesión (PBI-MEM-003 CA-2).
   * sessionId es obligatorio en el tipo para blindar el aislamiento por sesión.
   */
  searchSimilarMemories(
    queryVector: number[],
    options: SearchSimilarMemoriesOptions,
  ): Promise<Array<{ matrix: DenseSemanticMatrix; score: number }>>;

  /**
   * Consulta acotada (Bounded Query) de actividad reciente para la Sala de Control.
   * Límite estricto por defecto: 100 registros (Anti-OOM).
   */
  getRecentMemories(options?: { limit?: number; offset?: number }): Promise<CognitiveMemoryItem[]>;

  /**
   * Poda de memoria cognitiva de una sesión (Amnesia Táctica / Derecho al Olvido).
   */
  clearSessionMemory(sessionId: string): Promise<void>;
}
