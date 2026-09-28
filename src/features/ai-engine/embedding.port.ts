/**
 * Puerto de Salida Hexagonal para la generación de vectores de embedding.
 * Desacopla la lógica de RAG y vectorización de cualquier proveedor concreto (Google Gemini, Local, etc.).
 */

export type EmbeddingVectorSource = 'provider' | 'fallback';

export interface EmbeddingGenerationResult {
  vector: number[];
  source: EmbeddingVectorSource;
}

export interface IEmbeddingPort {
  /**
   * Genera el vector matemático normalizado para el texto proporcionado y su origen.
   */
  generateEmbedding(text: string): Promise<EmbeddingGenerationResult>;

  /**
   * Dimensión del espacio vectorial generado (ej. 768).
   */
  getDimensions(): number;
}
