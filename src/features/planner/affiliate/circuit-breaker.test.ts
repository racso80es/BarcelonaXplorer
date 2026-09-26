import { describe, it, expect, vi } from 'vitest';
import { CircuitBreaker } from './circuit-breaker';
import { AffiliateEnricherService } from './affiliate-enricher.service';
import { TacticalRoute, TacticalWaypoint } from '../tactical-route.entity';

describe('CircuitBreaker (Resiliencia de Afiliados S+)', () => {
  it('CA-1: debe iniciar en estado CLOSED y procesar operaciones exitosas', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownPeriodMs: 1000 });
    expect(cb.getState()).toBe('CLOSED');

    const result = await cb.execute(
      async () => 'ok',
      () => 'fallback',
    );

    expect(result.result).toBe('ok');
    expect(result.fallbackApplied).toBe(false);
    expect(result.state).toBe('CLOSED');
  });

  it('CA-1: debe abrir el circuito (OPEN) tras alcanzar el umbral de fallos consecutivos', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownPeriodMs: 5000 });
    const now = 1000000;

    // 1º fallo
    await cb.execute(
      async () => {
        throw new Error('503 Service Unavailable');
      },
      () => 'fallback',
      now,
    );
    expect(cb.getState(now)).toBe('CLOSED');
    expect(cb.getConsecutiveFailures()).toBe(1);

    // 2º fallo
    await cb.execute(
      async () => {
        throw new Error('503 Service Unavailable');
      },
      () => 'fallback',
      now,
    );
    expect(cb.getState(now)).toBe('CLOSED');
    expect(cb.getConsecutiveFailures()).toBe(2);

    // 3º fallo: se abre el circuito
    await cb.execute(
      async () => {
        throw new Error('503 Service Unavailable');
      },
      () => 'fallback',
      now,
    );
    expect(cb.getState(now)).toBe('OPEN');
    expect(cb.getConsecutiveFailures()).toBe(3);
  });

  it('CA-1: en estado OPEN debe ejecutar Fast-Fail retornando fallback sin invocar la operación', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownPeriodMs: 5000 });
    const now = 1000000;

    // Forzar apertura
    await cb.execute(
      async () => {
        throw new Error('fail');
      },
      () => 'fallback',
      now,
    );
    expect(cb.getState(now)).toBe('OPEN');

    const spyOp = vi.fn().mockResolvedValue('should not run');
    const result = await cb.execute(
      spyOp,
      () => 'fast-fail-fallback',
      now + 1000, // Dentro de la ventana de enfriamiento (1s < 5s)
    );

    expect(spyOp).not.toHaveBeenCalled();
    expect(result.result).toBe('fast-fail-fallback');
    expect(result.fallbackApplied).toBe(true);
    expect(result.state).toBe('OPEN');
  });

  it('CA-1: tras el enfriamiento debe pasar a HALF_OPEN y cerrarse ante una prueba exitosa', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownPeriodMs: 2000 });
    const t0 = 1000000;

    // Abrir circuito
    await cb.execute(
      async () => {
        throw new Error('fail');
      },
      () => 'fallback',
      t0,
    );
    expect(cb.getState(t0)).toBe('OPEN');

    // Transcurrido el enfriamiento (> 2000ms)
    const t1 = t0 + 2500;
    expect(cb.getState(t1)).toBe('HALF_OPEN');

    // Éxito en HALF_OPEN
    const res = await cb.execute(
      async () => 'recovered',
      () => 'fallback',
      t1,
    );
    expect(res.result).toBe('recovered');
    expect(cb.getState(t1)).toBe('CLOSED');
  });

  it('CA-2: debe abortar operaciones que superen el timeout configurado', async () => {
    const cb = new CircuitBreaker({ timeoutMs: 50, failureThreshold: 1 });

    const slowOperation = (signal: AbortSignal) =>
      new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => resolve('done'), 200);
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('Operation aborted by timeout'));
        });
      });

    const res = await cb.execute(
      slowOperation,
      () => 'timeout-fallback',
    );

    expect(res.result).toBe('timeout-fallback');
    expect(res.fallbackApplied).toBe(true);
    expect(cb.getState()).toBe('OPEN');
  });

  it('CA-3: AffiliateEnricherService debe recurrir a STATIC_AFFILIATE_CATALOG ante circuito OPEN', async () => {
    const openBreaker = new CircuitBreaker({ failureThreshold: 1 });
    // Abrir circuito
    await openBreaker.execute(
      async () => {
        throw new Error('API down');
      },
      () => null,
    );
    expect(openBreaker.getState()).toBe('OPEN');

    const service = new AffiliateEnricherService(openBreaker);
    const mockRoute = new TacticalRoute('r-1', 'Ruta Gastronómica', [
      new TacticalWaypoint('wp-1', 'Tapas Born', 'Ruta de tapas tradicionales', undefined, undefined, []),
    ]);

    const enriched = await service.enrichRoute(mockRoute);
    expect(enriched.summary).toContain('Catálogo Resiliente');
    expect(enriched.waypoints[0].options?.length).toBeGreaterThanOrEqual(1);
    expect(enriched.waypoints[0].affiliateProvider).toBe('THEFORK');
  });
});
