import type {
  CircuitBreakerConfig,
  CircuitBreakerState,
  ProviderHealthInfo,
  ProviderId,
  ProviderOperationalStatus,
  ProviderRequestSample,
} from './types.js';

export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private consecutiveFailures = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private samples: ProviderRequestSample[] = [];
  private activeProbeSuccess = true;
  private halfOpenProbeInFlight = false;

  constructor(
    public readonly provider: ProviderId,
    private readonly config: CircuitBreakerConfig = {
      failureThreshold: 3,
      recoveryTimeoutMs: 10000,
      latencyP95ThresholdMs: 8000,
      windowSize: 20,
    }
  ) {}

  getState(): CircuitBreakerState {
    if (this.state === 'OPEN' && this.lastFailureTime !== null) {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.config.recoveryTimeoutMs) {
        this.state = 'HALF_OPEN';
        this.halfOpenProbeInFlight = false;
      }
    }
    return this.state;
  }

  canExecute(): boolean {
    const currentState = this.getState();
    if (currentState === 'CLOSED') {
      return true;
    }
    if (currentState === 'HALF_OPEN') {
      if (!this.halfOpenProbeInFlight) {
        this.halfOpenProbeInFlight = true;
        return true;
      }
      return false;
    }
    return false;
  }

  recordSuccess(latencyMs: number, statusCode: number = 200): void {
    const now = Date.now();
    this.lastSuccessTime = now;
    this.consecutiveFailures = 0;
    this.addSample({ timestamp: now, latencyMs, success: true, statusCode });

    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.halfOpenProbeInFlight = false;
    }
  }

  recordFailure(latencyMs: number, statusCode: number = 500): void {
    const now = Date.now();
    this.lastFailureTime = now;
    this.consecutiveFailures++;
    this.addSample({ timestamp: now, latencyMs, success: false, statusCode });

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.halfOpenProbeInFlight = false;
    } else if (this.consecutiveFailures >= this.config.failureThreshold) {
      this.state = 'OPEN';
    } else if (this.checkLatencyP95Exceeded()) {
      this.state = 'OPEN';
    }
  }

  setActiveProbeStatus(success: boolean): void {
    this.activeProbeSuccess = success;
  }

  private addSample(sample: ProviderRequestSample): void {
    this.samples.push(sample);
    if (this.samples.length > this.config.windowSize) {
      this.samples.shift();
    }
  }

  private checkLatencyP95Exceeded(): boolean {
    if (!this.config.latencyP95ThresholdMs || this.samples.length < 5) {
      return false;
    }
    const latencies = this.samples.map((s) => s.latencyMs).sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[p95Index] ?? 0;
    return p95Latency > this.config.latencyP95ThresholdMs;
  }

  getHealthInfo(): ProviderHealthInfo {
    const currentState = this.getState();
    const sampleCount = this.samples.length;
    const avgLatency =
      sampleCount > 0
        ? Math.round(this.samples.reduce((acc, s) => acc + s.latencyMs, 0) / sampleCount)
        : 0;
    const failures = this.samples.filter((s) => !s.success).length;
    const errorRate = sampleCount > 0 ? failures / sampleCount : 0;

    let operationalStatus: ProviderOperationalStatus = 'HEALTHY';
    if (currentState === 'OPEN') {
      operationalStatus = 'UNHEALTHY';
    } else if (currentState === 'HALF_OPEN' || !this.activeProbeSuccess || errorRate > 0.2) {
      operationalStatus = 'DEGRADED';
    }

    return {
      provider: this.provider,
      circuitState: currentState,
      operationalStatus,
      consecutiveFailures: this.consecutiveFailures,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      recentSampleCount: sampleCount,
      averageLatencyMs: avgLatency,
      errorRate,
      activeProbeSuccess: this.activeProbeSuccess,
    };
  }
}
