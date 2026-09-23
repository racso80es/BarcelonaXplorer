import { TriageInputDto } from '@/domain/schemas/triage.schema';
import { TriageOutcome } from '@/domain/value-objects/triage-outcome.vo';

/**
 * Puerto de Entrada Hexagonal (Driver Port) para el Caso de Uso de Triaje Entrópico y Aduana Universal.
 */
export interface ITriageInputUseCasePort {
  /**
   * Ejecuta la evaluación en dos tiempos (System One determinista + System Two ligero)
   * inyectando la identidad sombra (sessionId) y evaluando el umbral de supervivencia de la matriz.
   *
   * @param input DTO con sessionId, prompt, matrixId y estado acumulado.
   * @returns Value Object con el resultado de la decisión (Rebote, Repregunta o Despacho).
   */
  execute(input: TriageInputDto): Promise<TriageOutcome>;
}
