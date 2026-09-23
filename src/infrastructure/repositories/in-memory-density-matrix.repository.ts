import { DensityMatrixRepositoryPort } from '@/application/ports/out/density-matrix-repository.port';
import { DefaultDensityPayload } from '@/domain/schemas/matrix';

/**
 * Adaptador de Infraestructura en Memoria para la persistencia del estado de la Matriz de Densidad.
 *
 * Cumple con el Laudo 2: Gestión soberana del estado multivuelta en el backend ligada al bx_session_id.
 * Utiliza un almacén estático en memoria persistente a nivel de proceso Node.js.
 */
export class InMemoryDensityMatrixRepository implements DensityMatrixRepositoryPort {
  private static readonly store = new Map<string, DefaultDensityPayload>();

  async getMatrixPayload(
    sessionId: string,
    matrixId: string,
  ): Promise<DefaultDensityPayload | null> {
    const key = `${sessionId}:${matrixId}`;
    const data = InMemoryDensityMatrixRepository.store.get(key);
    return data ? { ...data } : null;
  }

  async saveMatrixPayload(
    sessionId: string,
    matrixId: string,
    payload: DefaultDensityPayload,
  ): Promise<void> {
    const key = `${sessionId}:${matrixId}`;
    InMemoryDensityMatrixRepository.store.set(key, { ...payload });
  }

  async clearMatrixPayload(sessionId: string, matrixId?: string): Promise<void> {
    if (matrixId) {
      InMemoryDensityMatrixRepository.store.delete(`${sessionId}:${matrixId}`);
    } else {
      for (const key of InMemoryDensityMatrixRepository.store.keys()) {
        if (key.startsWith(`${sessionId}:`)) {
          InMemoryDensityMatrixRepository.store.delete(key);
        }
      }
    }
  }

  /**
   * Método de utilidad táctica para limpiar el almacén global en pruebas unitarias.
   */
  public static clearAll(): void {
    InMemoryDensityMatrixRepository.store.clear();
  }
}
