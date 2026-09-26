/**
 * Máquina de Estados: Circuit Breaker de Resiliencia para Proveedores Externos
 * Protocolo de Acero — Grado S+
 * Axioma I: Localidad de Comportamiento (Feature: planner/affiliate)
 * Axioma II: Tolerancia Cero a la Inferencia (Estados deterministas)
 * Axioma V: Ejecución Encapsulada con Fallback Táctico
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold?: number; // Número de fallos consecutivos para abrir circuito (def: 3)
  cooldownPeriodMs?: number; // Período de enfriamiento en ms antes de probar HALF_OPEN (def: 30000)
  timeoutMs?: number; // Timeout estricto de ejecución en ms (def: 1500)
}

export interface CircuitExecutionResult<T> {
  result: T;
  fallbackApplied: boolean;
  state: CircuitState;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private consecutiveFailures: number = 0;
  private lastFailureTimeMs: number = 0;
  private readonly failureThreshold: number;
  private readonly cooldownPeriodMs: number;
  private readonly timeoutMs: number;

  constructor(config: CircuitBreakerConfig = {}) {
    this.failureThreshold = config.failureThreshold ?? 3;
    this.cooldownPeriodMs = config.cooldownPeriodMs ?? 30000;
    this.timeoutMs = config.timeoutMs ?? 1500;
  }

  public getState(nowMs: number = Date.now()): CircuitState {
    if (this.state === 'OPEN') {
      if (nowMs - this.lastFailureTimeMs >= this.cooldownPeriodMs) {
        this.state = 'HALF_OPEN';
      }
    }
    return this.state;
  }

  public async execute<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    fallback: (error?: Error) => Promise<T> | T,
    nowMs: number = Date.now(),
  ): Promise<CircuitExecutionResult<T>> {
    const currentState = this.getState(nowMs);

    if (currentState === 'OPEN') {
      const fallbackResult = await fallback(new Error('Circuit is OPEN (Fast-Fail)'));
      return {
        result: fallbackResult,
        fallbackApplied: true,
        state: 'OPEN',
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const result = await operation(controller.signal);
      clearTimeout(timeoutId);
      this.onSuccess();
      return {
        result,
        fallbackApplied: false,
        state: this.state,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      this.onFailure(nowMs);
      const fallbackResult = await fallback(err instanceof Error ? err : new Error(String(err)));
      return {
        result: fallbackResult,
        fallbackApplied: true,
        state: this.state,
      };
    }
  }

  private onSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(nowMs: number): void {
    this.consecutiveFailures++;
    this.lastFailureTimeMs = nowMs;
    if (this.consecutiveFailures >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
    }
  }

  public getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  public reset(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.lastFailureTimeMs = 0;
  }
}
