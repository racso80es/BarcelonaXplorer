import { describe, it, expect, vi } from 'vitest';
import { ITypedDecisionEngine, JevNoulEvaluation, JevDecisionProbeResult, JevChoiceEvaluation } from '@/features/ai-engine';
import {
  DensityPresenceSentinel,
  DENSITY_SENTINEL_PROBES,
} from './density-presence-sentinel.use-case';
import { DensityPresenceProbeSchema } from './density-presence-probe.schema';

class MockDecisionEngine implements ITypedDecisionEngine {
  public noulCalls: Array<{ state: string; instruction: string; threshold?: number }> = [];
  public evaluateChoiceCalled = false;

  evaluateHealth(): Promise<JevDecisionProbeResult> {
    return Promise.resolve({ isHealthy: true, latencyMs: 5 });
  }

  evaluateNoul(
    state: string,
    instruction: string,
    threshold?: number,
  ): Promise<JevNoulEvaluation> {
    this.noulCalls.push({ state, instruction, threshold });
    return Promise.resolve({ probability: 0.9, isAffirmative: true });
  }

  evaluateChoice<T extends string>(
    _state: string,
    _instruction: string,
    _choices: readonly T[],
  ): Promise<JevChoiceEvaluation<T>> {
    void _state;
    void _instruction;
    void _choices;
    this.evaluateChoiceCalled = true;
    throw new Error('evaluateChoice should not be called');
  }
}

describe('PBI-ARCH-JEV-003: DensityPresenceSentinel', () => {
  it('CA-1: con motor que responde afirmativo a las cuatro instrucciones, trae las 4 banderas a true y success: true', async () => {
    const mockEngine = new MockDecisionEngine();
    const sentinel = new DensityPresenceSentinel(mockEngine);

    const envelope = await sentinel.probe('Somos 4 amigos, 3 horas, relax');

    expect(envelope.success).toBe(true);
    expect(envelope.exitCode).toBe(0);
    expect(envelope.result).toEqual({
      has_time_window: true,
      has_group_size: true,
      has_vibe: true,
      has_constraints: true,
    });
    expect(mockEngine.noulCalls.length).toBe(4);
    expect(mockEngine.evaluateChoiceCalled).toBe(false);
  });

  it('CA-2: las 4 llamadas ocurren en paralelo: el doble registra los cuatro evaluateNoul antes de resolver ninguna', async () => {
    let callCount = 0;
    let maxConcurrent = 0;
    const pendingResolvers: Array<() => void> = [];

    const mockEngine: ITypedDecisionEngine = {
      evaluateHealth: vi.fn(),
      evaluateChoice: vi.fn(),
      evaluateNoul: vi.fn().mockImplementation((state: string, instruction: string, threshold?: number) => {
        void state;
        void instruction;
        void threshold;
        callCount++;
        maxConcurrent = Math.max(maxConcurrent, callCount);
        return new Promise<JevNoulEvaluation>((resolve) => {
          pendingResolvers.push(() => {
            callCount--;
            resolve({ probability: 0.8, isAffirmative: true });
          });
        });
      }),
    };

    const sentinel = new DensityPresenceSentinel(mockEngine);
    const probePromise = sentinel.probe('Prompt de prueba');

    // Comprobar que antes de resolver ninguna, ya se han lanzado las 4 llamadas concurrentes
    expect(mockEngine.evaluateNoul).toHaveBeenCalledTimes(4);
    expect(maxConcurrent).toBe(4);

    // Resolver las 4 promesas
    pendingResolvers.forEach((resolve) => resolve());
    const envelope = await probePromise;

    expect(envelope.success).toBe(true);
    expect(envelope.result?.has_time_window).toBe(true);
  });

  it('CA-3: si una llamada rechaza y las otras tres afirman, esa bandera queda en false y el sobre sigue en éxito', async () => {
    const mockEngine: ITypedDecisionEngine = {
      evaluateHealth: vi.fn(),
      evaluateChoice: vi.fn(),
      evaluateNoul: vi.fn().mockImplementation((_state: string, instruction: string) => {
        if (instruction === DENSITY_SENTINEL_PROBES[0].instruction) {
          // Fallo en has_time_window
          return Promise.reject(new Error('Gateway timeout'));
        }
        return Promise.resolve({ probability: 0.8, isAffirmative: true });
      }),
    };

    const sentinel = new DensityPresenceSentinel(mockEngine);
    const envelope = await sentinel.probe('Prompt parcial');

    expect(envelope.success).toBe(true);
    expect(envelope.result).toEqual({
      has_time_window: false,
      has_group_size: true,
      has_vibe: true,
      has_constraints: true,
    });
  });

  it('CA-3 (degradación total): si las cuatro llamadas rechazan, el sobre es de éxito con las cuatro en false', async () => {
    const mockEngine: ITypedDecisionEngine = {
      evaluateHealth: vi.fn(),
      evaluateChoice: vi.fn(),
      evaluateNoul: vi.fn().mockRejectedValue(new Error('Downstream network outage')),
    };

    const sentinel = new DensityPresenceSentinel(mockEngine);
    const envelope = await sentinel.probe('Cualquier prompt');

    expect(envelope.success).toBe(true);
    expect(envelope.result).toEqual({
      has_time_window: false,
      has_group_size: false,
      has_vibe: false,
      has_constraints: false,
    });
  });

  it('CA-4: el resultado que sale del caso de uso pasa DensityPresenceProbeSchema y no invoca evaluateChoice', async () => {
    const mockEngine = new MockDecisionEngine();
    const sentinel = new DensityPresenceSentinel(mockEngine);

    const envelope = await sentinel.probe('Prompt');

    expect(() => DensityPresenceProbeSchema.parse(envelope.result)).not.toThrow();
    expect(mockEngine.evaluateChoiceCalled).toBe(false);
  });
});
