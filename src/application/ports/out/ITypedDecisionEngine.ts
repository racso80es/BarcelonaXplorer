/**
 * Resultado estructurado devuelto por la sonda térmica de salud de Jev AI.
 */
export interface JevDecisionProbeResult {
  readonly isHealthy: boolean;
  readonly latencyMs: number;
  readonly statusCode?: number;
  readonly error?: string;
  readonly modelCount?: number;
}

/**
 * Evaluación probabilística booleana (Noul).
 */
export interface JevNoulEvaluation {
  readonly probability: number;
  readonly isAffirmative: boolean;
}

/**
 * Evaluación categórica con opciones y confianza (Choice).
 */
export interface JevChoiceEvaluation<T extends string = string> {
  readonly selectedChoice: T;
  readonly confidence: number;
  readonly probabilities: Record<T, number>;
}

/**
 * Puerto de Salida Hexagonal (Driven Port) para el Motor de Decisión Determinista (System One).
 *
 * Desacopla la lógica de negocio y los casos de uso del proveedor concreto (Jev AI).
 * Tolerancia cero a tipos any.
 */
export interface ITypedDecisionEngine {
  /**
   * Sonda de vida y latencia no bloqueante contra el endpoint de discovery.
   * No consume créditos ni ejecuta inferencia pesada.
   */
  evaluateHealth(): Promise<JevDecisionProbeResult>;

  /**
   * Evalúa una pregunta binaria / probabilística sobre un estado o texto.
   *
   * @param state Contenido o contexto a evaluar.
   * @param instruction Pregunta o instrucción de evaluación.
   * @param threshold Umbral de probabilidad para considerar afirmativa la respuesta (default: 0.5).
   */
  evaluateNoul(
    state: string,
    instruction: string,
    threshold?: number,
  ): Promise<JevNoulEvaluation>;

  /**
   * Evalúa una selección categórica sobre un estado o texto entre una lista tipada de opciones.
   *
   * @param state Contenido o contexto a evaluar.
   * @param instruction Pregunta o directriz de categorización.
   * @param choices Opciones disponibles para la selección.
   */
  evaluateChoice<T extends string>(
    state: string,
    instruction: string,
    choices: readonly T[],
  ): Promise<JevChoiceEvaluation<T>>;
}
