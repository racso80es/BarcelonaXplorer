export type ProviderId = 'GOOGLE' | 'GROQ' | 'JEV';

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export type ProviderOperationalStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export interface ProviderRequestSample {
  timestamp: number;
  latencyMs: number;
  success: boolean;
  statusCode: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Número de fallos consecutivos o ratio
  recoveryTimeoutMs: number; // Tiempo en OPEN antes de pasar a HALF_OPEN
  latencyP95ThresholdMs?: number; // Umbral de latencia p95
  windowSize: number; // Tamaño de ventana deslizante de muestras
}

export interface ProviderHealthInfo {
  provider: ProviderId;
  circuitState: CircuitBreakerState;
  operationalStatus: ProviderOperationalStatus;
  consecutiveFailures: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  recentSampleCount: number;
  averageLatencyMs: number;
  errorRate: number;
  activeProbeSuccess: boolean;
}
