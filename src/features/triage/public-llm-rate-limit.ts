import { TokenBucketRateLimiter, RateLimitResult } from '@/features/auth';

/** Clave única del cubo global (PBI-STEEL-004 CA-1). No incluye IP ni cookie. */
export const PUBLIC_LLM_TRIAGE_RATE_LIMIT_KEY = 'global:public-llm-inference';

const limiter = new TokenBucketRateLimiter({
  capacity: 10,
  refillRatePerSecond: 10 / 60,
});

export function enforcePublicLlmRateLimit(nowMs?: number): RateLimitResult {
  return limiter.consume(PUBLIC_LLM_TRIAGE_RATE_LIMIT_KEY, 1, nowMs);
}

/** Solo para tests — reinicia el cubo en memoria. */
export function resetPublicLlmRateLimitForTests(): void {
  limiter.reset();
}
