import { z } from 'zod';

/**
 * Sobre de Retorno Determinista Canónico para comunicación inter-cápsula (Axioma V).
 * Compatible con la especificación de src/shared/operation-envelope.ts.
 */
export interface OperationEnvelope<T> {
  success: boolean;
  exitCode: number;
  result?: T;
  feedback?: string;
  errors?: string[];
}

export const createOperationEnvelopeSchema = <T extends z.ZodTypeAny>(resultSchema: T) =>
  z.object({
    success: z.boolean(),
    exitCode: z.number().int(),
    result: resultSchema.optional(),
    feedback: z.string().optional(),
    errors: z.array(z.string()).optional(),
  });

export function createSuccessEnvelope<T>(result: T, feedback?: string): OperationEnvelope<T> {
  return {
    success: true,
    exitCode: 0,
    result,
    feedback,
  };
}

export function createErrorEnvelope<T = never>(
  errors: string[],
  exitCode = 1,
  feedback?: string
): OperationEnvelope<T> {
  return {
    success: false,
    exitCode,
    errors,
    feedback,
  };
}
