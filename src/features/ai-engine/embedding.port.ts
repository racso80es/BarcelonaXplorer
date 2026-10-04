import { OperationEnvelope } from '@/shared/operation-envelope';

/**
 * Puerto de Salida Hexagonal para la generación de vectores de embedding.
 * Desacopla la lógica de RAG y vectorización de cualquier proveedor concreto (Google Gemini, Local, etc.).
 */
export interface IEmbeddingPort {
  /**
   * Genera el vector matemático normalizado para el texto proporcionado envuelto en un sobre determinista.
   * Si el proveedor falla o no está disponible, retorna success: false sin resultado vectorial.
   */
  generateEmbedding(text: string): Promise<OperationEnvelope<number[]>>;

  /**
   * Dimensión del espacio vectorial generado (ej. 768).
   */
  getDimensions(): number;
}
