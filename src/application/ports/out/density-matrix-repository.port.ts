import { DefaultDensityPayload } from '@/domain/schemas/matrix';

/**
 * Puerto de Salida Hexagonal (Driven Port) para la persistencia del estado
 * de la Matriz de Densidad por sesión de usuario (Laudo 2: Gobernanza del Estado).
 *
 * Desacopla la lógica de triaje del almacenamiento físico (Memoria, Redis, MySQL).
 */
export interface DensityMatrixRepositoryPort {
  /**
   * Recupera el estado acumulado de una matriz para la sesión dada.
   */
  getMatrixPayload(
    sessionId: string,
    matrixId: string,
  ): Promise<DefaultDensityPayload | null>;

  /**
   * Persiste o actualiza el estado acumulado de una matriz para la sesión dada.
   */
  saveMatrixPayload(
    sessionId: string,
    matrixId: string,
    payload: DefaultDensityPayload,
  ): Promise<void>;

  /**
   * Purga el estado acumulado de la sesión (tras completitud de ruta o revocación).
   */
  clearMatrixPayload(sessionId: string, matrixId?: string): Promise<void>;
}
