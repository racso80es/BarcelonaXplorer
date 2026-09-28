import { describe, it, expect, beforeEach } from 'vitest';
import {
  enforcePublicLlmRateLimit,
  resetPublicLlmRateLimitForTests,
  PUBLIC_LLM_TRIAGE_RATE_LIMIT_KEY,
} from './public-llm-rate-limit';

describe('public-llm-rate-limit (PBI-STEEL-004)', () => {
  beforeEach(() => {
    resetPublicLlmRateLimitForTests();
  });

  it('usa una clave global constante independiente de IP o cookie', () => {
    const r1 = enforcePublicLlmRateLimit(1_000);
    const r2 = enforcePublicLlmRateLimit(1_001);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(PUBLIC_LLM_TRIAGE_RATE_LIMIT_KEY).toBe('global:public-llm-inference');
  });

  it('agota el cubo tras superar la capacidad', () => {
    let last = enforcePublicLlmRateLimit(0);
    for (let i = 1; i < 10; i++) {
      last = enforcePublicLlmRateLimit(i);
      expect(last.allowed).toBe(true);
    }
    const blocked = enforcePublicLlmRateLimit(10);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
