/**
 * Puerto de Salida Hexagonal para la generación de vectores de embedding.
 * Desacopla la lógica de RAG y vectorización de cualquier proveedor concreto (Google Gemini, Local, etc.).
 */
export interface IEmbeddingPort {
  /**
   * Genera el vector matemático normalizado para el texto proporcionado.
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Dimensión del espacio vectorial generado (ej. 768).
   */
  getDimensions(): number;
}
