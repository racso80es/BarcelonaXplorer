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
});
