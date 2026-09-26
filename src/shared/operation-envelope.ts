/**
 * Sobre de Retorno Determinista Canónico para comunicación inter-cápsula (Axioma V).
 */
export interface OperationEnvelope<T> {
  success: boolean;
  exitCode: number;
  result?: T;
  feedback?: string;
  errors?: string[];
}

export function createSuccessEnvelope<T>(result: T, feedback?: string): OperationEnvelope<T> {
  return {
    success: true,
    exitCode: 0,
    result,
    feedback,
  };
}

export function createErrorEnvelope<T>(errors: string[], exitCode = 1, feedback?: string): OperationEnvelope<T> {
  return {
    success: false,
    exitCode,
    errors,
    feedback,
  };
}
