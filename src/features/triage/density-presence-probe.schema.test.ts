import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
  DensityPresenceProbeSchema,
  DensityPresenceProbe,
} from './density-presence-probe.schema';

describe('PBI-ARCH-JEV-002: DensityPresenceProbeSchema', () => {
  it('CA-1: debe validar exitosamente un objeto con las cuatro banderas booleanas', () => {
    const validProbe: DensityPresenceProbe = {
      has_time_window: true,
      has_group_size: false,
      has_vibe: true,
      has_constraints: false,
    };

    const parsed = DensityPresenceProbeSchema.parse(validProbe);
    expect(parsed).toEqual(validProbe);
  });

  it('CA-2: debe lanzar ZodError si falta alguna bandera obligatoria', () => {
    const incomplete = {
      has_time_window: true,
      has_group_size: false,
      has_vibe: true,
      // falta has_constraints
    };

    expect(() => DensityPresenceProbeSchema.parse(incomplete)).toThrow(ZodError);
  });

  it('CA-2: debe lanzar ZodError si algún valor no es booleano', () => {
    const invalidType = {
      has_time_window: 'true',
      has_group_size: 1,
      has_vibe: null,
      has_constraints: false,
    };

    expect(() => DensityPresenceProbeSchema.parse(invalidType)).toThrow(ZodError);
  });

  it('CA-2: debe lanzar ZodError (.strict) ante claves no autorizadas (ej. budget, origin, nationality)', () => {
    const foreignKeys = {
      has_time_window: true,
      has_group_size: true,
      has_vibe: true,
      has_constraints: true,
      budget: 'low',
      origin: 'BCN',
      nationality: 'ES',
    };

    expect(() => DensityPresenceProbeSchema.parse(foreignKeys)).toThrow(ZodError);
  });
});
