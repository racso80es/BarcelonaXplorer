import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  createErrorEnvelope,
  createOperationEnvelopeSchema,
  createSuccessEnvelope,
} from './envelope.js';

describe('OperationEnvelope in IA Gateway', () => {
  it('debe construir un sobre de éxito válido', () => {
    const data = { message: 'ok' };
    const envelope = createSuccessEnvelope(data, 'Operación exitosa');

    expect(envelope.success).toBe(true);
    expect(envelope.exitCode).toBe(0);
    expect(envelope.result).toEqual(data);
    expect(envelope.feedback).toBe('Operación exitosa');
    expect(envelope.errors).toBeUndefined();
  });

  it('debe construir un sobre de error determinista', () => {
    const envelope = createErrorEnvelope(['No autorizado'], 401, 'Error de autenticación');

    expect(envelope.success).toBe(false);
    expect(envelope.exitCode).toBe(401);
    expect(envelope.errors).toEqual(['No autorizado']);
    expect(envelope.feedback).toBe('Error de autenticación');
    expect(envelope.result).toBeUndefined();
  });

  it('debe validar mediante esquema Zod', () => {
    const schema = createOperationEnvelopeSchema(z.object({ token: z.string() }));
    const valid = {
      success: true,
      exitCode: 0,
      result: { token: 'secret-123' },
    };

    const parsed = schema.safeParse(valid);
    expect(parsed.success).toBe(true);

    const invalid = {
      success: 'yes',
      exitCode: 'zero',
    };
    const invalidParsed = schema.safeParse(invalid);
    expect(invalidParsed.success).toBe(false);
  });
});
