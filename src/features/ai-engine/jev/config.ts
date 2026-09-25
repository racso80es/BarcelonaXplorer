export interface JevConfig {
  readonly apiKey?: string;
  readonly baseUrl: string;
  readonly healthTimeoutMs: number;
  readonly latencyWarnThresholdMs: number;
  readonly defaultModel: string;
}

/**
 * Lee y valida la configuración de Jev AI desde las variables de entorno.
 */
export function getJevConfig(): JevConfig {
  const rawBaseUrl = process.env.JEV_BASE_URL || 'https://jev-ai.pro/api';
  const baseUrl = rawBaseUrl.replace(/\/+$/, '');

  const healthTimeoutMs = process.env.JEV_HEALTH_TIMEOUT_MS
    ? parseInt(process.env.JEV_HEALTH_TIMEOUT_MS, 10)
    : 2000;

  const latencyWarnThresholdMs = process.env.JEV_LATENCY_WARN_THRESHOLD_MS
    ? parseInt(process.env.JEV_LATENCY_WARN_THRESHOLD_MS, 10)
    : 800;

  return {
    apiKey: process.env.JEV_API_KEY?.trim() || undefined,
    baseUrl,
    healthTimeoutMs: Number.isFinite(healthTimeoutMs) ? healthTimeoutMs : 2000,
    latencyWarnThresholdMs: Number.isFinite(latencyWarnThresholdMs)
      ? latencyWarnThresholdMs
      : 800,
    defaultModel: process.env.JEV_MODEL?.trim() || 'jev-latest',
  };
}
