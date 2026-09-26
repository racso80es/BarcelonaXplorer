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

  describe('Matriz Especializada gastronomy (PBI-CORE-TRIAGE-003)', () => {
    it('TC-TRIAGE-GASTRO-01: Solo con time_window alcanza 25% (< 70%) e identifica group_size (peso 40) como faltante crítico', () => {
      const payload = {
        time_window: 'Cena a las 21:00',
      };

      const result = calculateMatrixDensity('gastronomy', payload);

      expect(result.matrixId).toBe('gastronomy');
      expect(result.score).toBe(25);
      expect(result.survivalThreshold).toBe(70);
      expect(result.isThresholdSatisfied).toBe(false);
      expect(result.presentVariables).toEqual(['time_window']);
      // En gastronomy group_size tiene peso 40, debe ser la variable prioritaria faltante
      expect(result.highestMissingVariable).toBe('group_size');
    });

    it('TC-TRIAGE-GASTRO-02: Con group_size (40%) y time_window (25%) alcanza 65% y desbloquea umbral al añadir vibe (85% >= 70%)', () => {
      const payload65 = {
        group_size: 4,
        time_window: '21:00',
      };

      const result65 = calculateMatrixDensity('gastronomy', payload65);
      expect(result65.score).toBe(65);
      expect(result65.isThresholdSatisfied).toBe(false);
      expect(result65.highestMissingVariable).toBe('vibe');

      const payload85 = {
        ...payload65,
        vibe: 'tapas de autor y vermut',
      };

      const result85 = calculateMatrixDensity('gastronomy', payload85);
      expect(result85.score).toBe(85);
      expect(result85.isThresholdSatisfied).toBe(true);
    });
  });
});
