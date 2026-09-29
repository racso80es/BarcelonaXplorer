import { CircuitBreaker } from './circuit-breaker.js';
import type { ProviderHealthInfo, ProviderId } from './types.js';

export interface HealthSensorConfig {
  jevBaseUrl?: string;
  jevApiKey?: string;
  groqApiKey?: string;
  geminiApiKey?: string;
  probeTimeoutMs?: number;
}

export class HealthSensor {
  private readonly breakers: Map<ProviderId, CircuitBreaker> = new Map();
  private probeTimer: NodeJS.Timeout | null = null;

  // Matrices de prioridad acordadas en D-3
  private readonly providerMatrices: Record<'FAST_LLM' | 'REASONING_LLM' | 'TYPED_DECISION', ProviderId[]> = {
    FAST_LLM: ['GROQ', 'GOOGLE'],
    REASONING_LLM: ['GOOGLE', 'GROQ'],
    TYPED_DECISION: ['JEV'],
  };

  constructor(
    private readonly config: HealthSensorConfig = {},
    private readonly fetchFn: typeof fetch = fetch
  ) {
    this.breakers.set('GOOGLE', new CircuitBreaker('GOOGLE'));
    this.breakers.set('GROQ', new CircuitBreaker('GROQ'));
    this.breakers.set('JEV', new CircuitBreaker('JEV'));
  }

  getBreaker(provider: ProviderId): CircuitBreaker {
    const breaker = this.breakers.get(provider);
    if (!breaker) {
      throw new Error(`Proveedor desconocido: ${provider}`);
    }
    return breaker;
  }

  recordSuccess(provider: ProviderId, latencyMs: number, statusCode: number = 200): void {
    this.getBreaker(provider).recordSuccess(latencyMs, statusCode);
  }

  recordFailure(provider: ProviderId, latencyMs: number, statusCode: number = 500): void {
    this.getBreaker(provider).recordFailure(latencyMs, statusCode);
  }

  getHealthiestProvider(
    engineType: 'FAST_LLM' | 'REASONING_LLM' | 'TYPED_DECISION'
  ): ProviderId | null {
    const matrix = this.providerMatrices[engineType];
    for (const provider of matrix) {
      const breaker = this.getBreaker(provider);
      if (breaker.canExecute()) {
        return provider;
      }
    }
    return null;
  }

  async runActiveProbeForProvider(provider: ProviderId): Promise<boolean> {
    const timeout = this.config.probeTimeoutMs ?? 5000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      let url = '';
      const headers: Record<string, string> = { Accept: 'application/json' };

      if (provider === 'JEV') {
        if (!this.config.jevApiKey) return true; // Si no hay key no penalizamos sonda activa
        url = `${(this.config.jevBaseUrl ?? 'https://jev-ai.pro/api').replace(/\/+$/, '')}/v1/models`;
        headers['Authorization'] = `Bearer ${this.config.jevApiKey}`;
      } else if (provider === 'GROQ') {
        if (!this.config.groqApiKey) return true;
        url = 'https://api.groq.com/openai/v1/models';
        headers['Authorization'] = `Bearer ${this.config.groqApiKey}`;
      } else if (provider === 'GOOGLE') {
        if (!this.config.geminiApiKey) return true;
        url = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.config.geminiApiKey}`;
      }

      const res = await this.fetchFn(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const isSuccess = res.ok;
      this.getBreaker(provider).setActiveProbeStatus(isSuccess);
      return isSuccess;
    } catch {
      clearTimeout(timeoutId);
      // Sonda activa fallida degrada sin abrir el circuito
      this.getBreaker(provider).setActiveProbeStatus(false);
      return false;
    }
  }

  async runAllActiveProbes(): Promise<Record<ProviderId, boolean>> {
    const [google, groq, jev] = await Promise.all([
      this.runActiveProbeForProvider('GOOGLE'),
      this.runActiveProbeForProvider('GROQ'),
      this.runActiveProbeForProvider('JEV'),
    ]);
    return { GOOGLE: google, GROQ: groq, JEV: jev };
  }

  startPeriodicProbes(intervalMs: number = 60000): void {
    if (this.probeTimer) return;
    this.probeTimer = setInterval(() => {
      void this.runAllActiveProbes();
    }, intervalMs);
  }

  stopPeriodicProbes(): void {
    if (this.probeTimer) {
      clearInterval(this.probeTimer);
      this.probeTimer = null;
    }
  }

  getAllHealth(): Record<ProviderId, ProviderHealthInfo> {
    return {
      GOOGLE: this.getBreaker('GOOGLE').getHealthInfo(),
      GROQ: this.getBreaker('GROQ').getHealthInfo(),
      JEV: this.getBreaker('JEV').getHealthInfo(),
    };
  }
}
