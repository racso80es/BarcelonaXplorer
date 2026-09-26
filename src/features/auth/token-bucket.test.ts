import { describe, it, expect, beforeEach } from 'vitest';
import { TokenBucketRateLimiter } from './token-bucket-rate-limiter';

describe('TokenBucketRateLimiter (Aduana de Fricción S+)', () => {
  let limiter: TokenBucketRateLimiter;

  beforeEach(() => {
    // 5 fichas de capacidad, recarga de 1 ficha por segundo
    limiter = new TokenBucketRateLimiter({
      capacity: 5,
      refillRatePerSecond: 1,
      staleCleanupThresholdMs: 60000,
    });
  });

  it('CA-1: debe permitir ráfagas de peticiones hasta agotar la capacidad', () => {
    const key = 'client-192.168.1.1';
    const now = 1000000;

    for (let i = 0; i < 5; i++) {
      const res = limiter.consume(key, 1, now);
      expect(res.allowed).toBe(true);
      expect(res.remainingTokens).toBe(4 - i);
      expect(res.retryAfterSeconds).toBe(0);
    }

    // La 6ª petición inmediata debe ser rechazada
    const blockedRes = limiter.consume(key, 1, now);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remainingTokens).toBe(0);
    expect(blockedRes.retryAfterSeconds).toBe(1);
    expect(blockedRes.resetAt.getTime()).toBe(now + 1000);
  });

  it('CA-1: debe recargar fichas progresivamente según el paso del tiempo', () => {
    const key = 'client-10.0.0.2';
    const t0 = 1000000;

    // Consumir las 5 fichas
    for (let i = 0; i < 5; i++) {
      limiter.consume(key, 1, t0);
    }

    // Bloqueado en t0
    expect(limiter.consume(key, 1, t0).allowed).toBe(false);

    // Tras 2.5 segundos, se recargaron 2.5 fichas (2 utilizables)
    const t1 = t0 + 2500;
    const res1 = limiter.consume(key, 1, t1);
    expect(res1.allowed).toBe(true);

    const res2 = limiter.consume(key, 1, t1);
    expect(res2.allowed).toBe(true);

    // La 3ª petición en t1 supera las 2.5 fichas disponibles
    const res3 = limiter.consume(key, 1, t1);
    expect(res3.allowed).toBe(false);
  });

  it('CA-1: no debe acumular más fichas que la capacidad máxima configurada', () => {
    const key = 'client-10.0.0.3';
    const t0 = 1000000;

    // Esperar 100 segundos
    const t1 = t0 + 100000;
    const res = limiter.consume(key, 1, t1);
    expect(res.allowed).toBe(true);
    expect(res.remainingTokens).toBe(4); // 5 capacidad - 1 consumido
  });

  it('CA-1: debe aislar los contadores entre diferentes clientes', () => {
    const t0 = 1000000;
    const clientA = 'ip-aaa';
    const clientB = 'ip-bbb';

    // Agotar fichas de clientA
    for (let i = 0; i < 5; i++) {
      limiter.consume(clientA, 1, t0);
    }
    expect(limiter.consume(clientA, 1, t0).allowed).toBe(false);

    // clientB debe tener su cubeta intacta
    const resB = limiter.consume(clientB, 1, t0);
    expect(resB.allowed).toBe(true);
    expect(resB.remainingTokens).toBe(4);
  });

  it('Anti-OOM: debe purgar cubetas inactivas que superen el umbral', () => {
    const customLimiter = new TokenBucketRateLimiter({
      capacity: 5,
      refillRatePerSecond: 1,
      staleCleanupThresholdMs: 1000,
    });
    const t0 = 1000000;
    customLimiter.consume('stale-key', 1, t0);
    expect(customLimiter.getActiveBucketsCount()).toBe(1);

    // Petición tras superar el threshold (1000ms)
    const t1 = t0 + 1500;
    customLimiter.consume('active-key', 1, t1);

    // La clave vieja debió ser purgada
    expect(customLimiter.getActiveBucketsCount()).toBe(1);
  });

  it('Invariantes: debe lanzar error si se inicializa con parámetros inválidos', () => {
    expect(() => new TokenBucketRateLimiter({ capacity: 0, refillRatePerSecond: 1 })).toThrow();
    expect(() => new TokenBucketRateLimiter({ capacity: 5, refillRatePerSecond: 0 })).toThrow();
  });
});
