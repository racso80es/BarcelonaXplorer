import { describe, it, expect } from 'vitest';
import {
  calculateMatrixDensity,
  DensityMatrixEnvelopeSchema,
  DENSITY_MATRIX_REGISTRY,
  DefaultDensityPayloadSchema,
} from './matrix';

describe('Matriz de Densidad Polimórfica (HU 6 & HU-CORE-TRIAGE-002)', () => {
  it('TC-TRIAGE-01: Payload con time_window en matriz default alcanza el 60% y satisface el umbral', () => {
    const payload = {
      time_window: '4 horas por la tarde',
    };

    const result = calculateMatrixDensity('default', payload);

    expect(result.score).toBe(60);
    expect(result.survivalThreshold).toBe(60);
    expect(result.isThresholdSatisfied).toBe(true);
    expect(result.presentVariables).toEqual(['time_window']);
    expect(result.missingVariables).toContain('group_size');
    expect(result.missingVariables).toContain('vibe');
    expect(result.missingVariables).toContain('constraints');
  });

  it('TC-TRIAGE-02: Payload con solo vibe y group_size alcanza 30% (< 60%) e identifica time_window como faltante crítico', () => {
    const payload = {
      vibe: 'modernismo',
      group_size: 3,
    };

    const result = calculateMatrixDensity('default', payload);

    expect(result.score).toBe(30);
    expect(result.survivalThreshold).toBe(60);
    expect(result.isThresholdSatisfied).toBe(false);
    expect(result.presentVariables).toContain('vibe');
    expect(result.presentVariables).toContain('group_size');
    // time_window tiene peso 60, por lo que debe ser la primera variable faltante
    expect(result.highestMissingVariable).toBe('time_window');
  });

  it('debe calcular 100% de saturación cuando todas las variables están presentes', () => {
    const payload = {
      time_window: 'todo el sábado',
      group_size: 2,
      vibe: 'gastronomía y tapas',
      constraints: ['sin gluten', 'presupuesto medio'],
    };

    const result = calculateMatrixDensity('default', payload);

    expect(result.score).toBe(100);
    expect(result.isThresholdSatisfied).toBe(true);
    expect(result.missingVariables).toHaveLength(0);
    expect(result.highestMissingVariable).toBeNull();
  });

  it('debe validar un DensityMatrixEnvelope completo mediante Zod', () => {
    const envelope = {
      matrix_id: 'default',
      name: DENSITY_MATRIX_REGISTRY['default'].name,
      description: DENSITY_MATRIX_REGISTRY['default'].description,
      rules: DENSITY_MATRIX_REGISTRY['default'].rules,
      payload: {
        time_window: '3 horas',
        group_size: 1,
      },
    };

    const parseResult = DensityMatrixEnvelopeSchema.safeParse(envelope);
    expect(parseResult.success).toBe(true);
  });

  it('debe validar el DefaultDensityPayloadSchema con valores por defecto', () => {
    const parsed = DefaultDensityPayloadSchema.parse({
      time_window: '2 horas',
    });

    expect(parsed.time_window).toBe('2 horas');
    expect(parsed.constraints).toEqual([]);
  });
});
