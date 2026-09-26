/**
 * Algoritmo y Entidad de Dominio: Token Bucket Rate Limiter
 * Protocolo de Acero — Grado S+
 * Axioma I: Localidad de comportamiento (Feature: auth)
 * Axioma II: Tolerancia Cero a la Inferencia (Fronteras deterministas)
 * Axioma V: Ejecución encapsulada sin librerías externas opacas
 */

export interface RateLimiterConfig {
  capacity: number; // Número máximo de fichas (ráfaga permitida)
  refillRatePerSecond: number; // Fichas añadidas por segundo
  staleCleanupThresholdMs?: number; // Tiempo de inactividad para purgar claves
}

interface BucketState {
  tokens: number;
  lastRefillMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingTokens: number;
  retryAfterSeconds: number;
  resetAt: Date;
}

export class TokenBucketRateLimiter {
  private readonly buckets: Map<string, BucketState> = new Map();
  private readonly capacity: number;
  private readonly refillRatePerSecond: number;
  private readonly staleCleanupThresholdMs: number;
  private lastGlobalCleanupMs: number = 0;

  constructor(config: RateLimiterConfig = { capacity: 10, refillRatePerSecond: 10 / 60 }) {
    if (config.capacity <= 0) {
      throw new Error('La capacidad del Token Bucket debe ser mayor a 0.');
    }
    if (config.refillRatePerSecond <= 0) {
      throw new Error('La tasa de recarga por segundo debe ser mayor a 0.');
    }
    this.capacity = config.capacity;
    this.refillRatePerSecond = config.refillRatePerSecond;
    this.staleCleanupThresholdMs = config.staleCleanupThresholdMs ?? 600000; // 10 min por defecto
  }

  /**
   * Consume una o más fichas para una clave determinada (ej. IP o SessionId).
   */
  public consume(key: string, tokensToConsume: number = 1, nowMs: number = Date.now()): RateLimitResult {
    this.periodicCleanup(nowMs);

    const state = this.buckets.get(key) ?? {
      tokens: this.capacity,
      lastRefillMs: nowMs,
    };

    // Calcular fichas acumuladas por paso del tiempo
    const elapsedTimeSeconds = Math.max(0, (nowMs - state.lastRefillMs) / 1000);
    const replenishedTokens = elapsedTimeSeconds * this.refillRatePerSecond;
    const currentTokens = Math.min(this.capacity, state.tokens + replenishedTokens);

    if (currentTokens >= tokensToConsume) {
      const remaining = currentTokens - tokensToConsume;
      this.buckets.set(key, {
        tokens: remaining,
        lastRefillMs: nowMs,
      });

      return {
        allowed: true,
        remainingTokens: Math.floor(remaining),
        retryAfterSeconds: 0,
        resetAt: new Date(nowMs + ((this.capacity - remaining) / this.refillRatePerSecond) * 1000),
      };
    }

    // No hay suficientes fichas
    const deficit = tokensToConsume - currentTokens;
    const retryAfterSeconds = Math.ceil(deficit / this.refillRatePerSecond);
    const resetAt = new Date(nowMs + retryAfterSeconds * 1000);

    // Actualizar estado preservando fichas acumuladas
    this.buckets.set(key, {
      tokens: currentTokens,
      lastRefillMs: nowMs,
    });

    return {
      allowed: false,
      remainingTokens: Math.floor(currentTokens),
      retryAfterSeconds,
      resetAt,
    };
  }

  /**
   * Limpia claves inactivas para prevenir fugas de memoria (Anti-OOM).
   */
  private periodicCleanup(nowMs: number): void {
    if (nowMs - this.lastGlobalCleanupMs < this.staleCleanupThresholdMs) {
      return;
    }
    this.lastGlobalCleanupMs = nowMs;

    for (const [key, state] of this.buckets.entries()) {
      if (nowMs - state.lastRefillMs > this.staleCleanupThresholdMs) {
        this.buckets.delete(key);
      }
    }
  }

  /**
   * Devuelve el recuento de claves en memoria (para auditoría y testing).
   */
  public getActiveBucketsCount(): number {
    return this.buckets.size;
  }

  /**
   * Resetea el almacén en memoria (para testing).
   */
  public reset(): void {
    this.buckets.clear();
  }
}
