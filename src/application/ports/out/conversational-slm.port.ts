/**
 * Puerto de Salida Hexagonal (Driven Port) para el SLM Rápido Conversacional (System Two Ligero).
 *
 * Responsable de la síntesis en lenguaje natural de:
 * 1. Rebotes empáticos y amables ante consultas fuera de perímetro geográfico.
 * 2. Repreguntas orgánicas, atómicas y contextuales para recopilar variables faltantes de la matriz.
 */
export interface IConversationalSLMPort {
  /**
   * Genera un mensaje amable de rebote perimetral (< 200 ms).
   *
   * @param rejectedEntity Nombre de la entidad foránea detectada (ej. 'Girona', 'Madrid').
   * @param prompt Consulta original del usuario.
   */
  generateBounceMessage(rejectedEntity: string, prompt: string): Promise<string>;

  /**
   * Genera una repregunta contextual única orientada a la variable de mayor peso faltante.
   *
   * @param missingVariable Clave de la variable faltante (ej. 'time_window', 'group_size').
   * @param prompt Consulta original del usuario.
   * @param currentContext Contexto acumulado previo o detalles conocidos.
   */
  generateRepromptMessage(
    missingVariable: string,
    prompt: string,
    currentContext?: string,
  ): Promise<string>;
}
