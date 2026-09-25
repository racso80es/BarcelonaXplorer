import { describe, it, expect } from 'vitest';
import { TriageInputSchema, TriageOutcomeDtoSchema } from './triage.schema';
import { TriageOutcome } from './triage-outcome.vo';

describe('Feature Triage (Vertical Slicing - Rama B)', () => {
  it('debe validar la estructura de entrada de TriageInputSchema localmente', () => {
    const input = TriageInputSchema.parse({
      sessionId: 'sess-vertical-1',
      prompt: 'Quiero ver arquitectura modernista en el Eixample',
    });
    expect(input.sessionId).toBe('sess-vertical-1');
    expect(input.matrixId).toBe('default');
  });

  it('debe crear un TriageOutcome DISPATCH_READY y convertirlo a DTO', () => {
    const outcome = TriageOutcome.createDispatchReady({
      sessionId: 'sess-vertical-1',
      matrixId: 'default',
      score: 80,
      survivalThreshold: 60,
      payload: {
        time_window: '3 horas',
        vibe: 'modernismo',
        constraints: [],
        districts: [],
      },
      durationMs: 15,
    });

    expect(outcome.status).toBe('DISPATCH_READY');
    expect(outcome.isThresholdSatisfied).toBe(true);
    const dto = outcome.toDto();
    expect(TriageOutcomeDtoSchema.parse(dto)).toBeDefined();
  });

  it('debe validar y tipar el enum mood en la frontera de entrada de la feature', async () => {
    const { MoodSchema } = await import('./triage.schema');
    expect(MoodSchema.parse('relaxed')).toBe('relaxed');
    expect(MoodSchema.parse('adventurous')).toBe('adventurous');
    expect(MoodSchema.parse('cultural')).toBe('cultural');
    expect(MoodSchema.parse('gastronomic')).toBe('gastronomic');
    expect(() => MoodSchema.parse('chaotic')).toThrow();
  });

  it('debe admitir el campo mood en TriageInputSchema y participar con peso 10 en la Matriz de Densidad', async () => {
    const { calculateMatrixDensity, DefaultDensityPayloadSchema } = await import('@/domain/schemas/matrix');
    const input = TriageInputSchema.parse({
      sessionId: 'sess-mood-vertical',
      prompt: 'Exploración relajada',
      mood: 'relaxed',
    });
    expect(input.mood).toBe('relaxed');

    const payload = DefaultDensityPayloadSchema.parse({
      time_window: '2 horas',
      mood: input.mood,
    });
    const density = calculateMatrixDensity('default', payload);
    // time_window (60) + mood (10) = 70
    expect(density.score).toBe(70);
    expect(density.isThresholdSatisfied).toBe(true);
    expect(density.presentVariables).toContain('mood');
  });
});
