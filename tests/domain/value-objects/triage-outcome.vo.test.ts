import { describe, it, expect } from 'vitest';
import { TriageOutcome } from '@/domain/value-objects/triage-outcome.vo';

describe('TriageOutcome Value Object (HU-CORE-TRIAGE-002)', () => {
  it('crea correctamente una salida de REBOUND_OUT_OF_SCOPE', () => {
    const vo = TriageOutcome.createReboundOutOfScope({
      sessionId: 'sess-123',
      matrixId: 'default',
      bounceMessage: 'Radar calibrado sólo para Barcelona.',
      rejectedEntity: 'Girona',
      durationMs: 45,
    });

    expect(vo.status).toBe('REBOUND_OUT_OF_SCOPE');
    expect(vo.sessionId).toBe('sess-123');
    expect(vo.score).toBe(0);
    expect(vo.isThresholdSatisfied).toBe(false);
    expect(vo.bounceMessage).toBe('Radar calibrado sólo para Barcelona.');
    expect(vo.rejectedEntity).toBe('Girona');
    expect(vo.durationMs).toBe(45);
    expect(Object.isFrozen(vo)).toBe(true);

    const dto = vo.toDto();
    expect(dto.status).toBe('REBOUND_OUT_OF_SCOPE');
  });

  it('crea correctamente una salida de INCOMPLETE_REPROMPT', () => {
    const vo = TriageOutcome.createIncompleteReprompt({
      sessionId: 'sess-456',
      matrixId: 'default',
      score: 30,
      survivalThreshold: 60,
      missingVariable: 'time_window',
      repromptMessage: '¿De cuántas horas dispones?',
      partialPayload: { vibe: 'tapas' },
      durationMs: 80,
    });

    expect(vo.status).toBe('INCOMPLETE_REPROMPT');
    expect(vo.score).toBe(30);
    expect(vo.isThresholdSatisfied).toBe(false);
    expect(vo.missingVariable).toBe('time_window');
    expect(vo.repromptMessage).toBe('¿De cuántas horas dispones?');
    expect(vo.partialPayload).toEqual({ vibe: 'tapas' });
  });

  it('crea correctamente una salida de DISPATCH_READY', () => {
    const vo = TriageOutcome.createDispatchReady({
      sessionId: 'sess-789',
      matrixId: 'default',
      score: 60,
      survivalThreshold: 60,
      payload: { time_window: '4 horas' },
      durationMs: 110,
    });

    expect(vo.status).toBe('DISPATCH_READY');
    expect(vo.score).toBe(60);
    expect(vo.isThresholdSatisfied).toBe(true);
    expect(vo.payload).toEqual({ time_window: '4 horas' });
  });
});
