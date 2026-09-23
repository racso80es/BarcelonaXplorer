import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getJevConfig } from '@/infrastructure/ai/jev/config';

describe('JevConfig (Lectura tipada de entorno y fallbacks)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.JEV_API_KEY;
    delete process.env.JEV_BASE_URL;
    delete process.env.JEV_HEALTH_TIMEOUT_MS;
    delete process.env.JEV_LATENCY_WARN_THRESHOLD_MS;
    delete process.env.JEV_MODEL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('debe devolver valores por defecto seguros cuando no hay variables configuradas', () => {
    const config = getJevConfig();

    expect(config.apiKey).toBeUndefined();
    expect(config.baseUrl).toBe('https://jev-ai.pro/api');
    expect(config.healthTimeoutMs).toBe(2000);
    expect(config.latencyWarnThresholdMs).toBe(800);
    expect(config.defaultModel).toBe('jev-latest');
  });

  it('debe sanitizar la URL base eliminando barras finales redundantes', () => {
    process.env.JEV_BASE_URL = 'https://custom-jev.ai/api///';
    const config = getJevConfig();

    expect(config.baseUrl).toBe('https://custom-jev.ai/api');
  });

  it('debe leer y recortar espacios en JEV_API_KEY', () => {
    process.env.JEV_API_KEY = '  sk_test_12345  ';
    const config = getJevConfig();

    expect(config.apiKey).toBe('sk_test_12345');
  });

  it('debe parsear umbrales numéricos personalizados para timeout y latencia', () => {
    process.env.JEV_HEALTH_TIMEOUT_MS = '3500';
    process.env.JEV_LATENCY_WARN_THRESHOLD_MS = '600';
    process.env.JEV_MODEL = 'laya-multilingual';

    const config = getJevConfig();

    expect(config.healthTimeoutMs).toBe(3500);
    expect(config.latencyWarnThresholdMs).toBe(600);
    expect(config.defaultModel).toBe('laya-multilingual');
  });

  it('debe usar fallbacks seguros si los valores numéricos son inválidos (NaN)', () => {
    process.env.JEV_HEALTH_TIMEOUT_MS = 'not-a-number';
    process.env.JEV_LATENCY_WARN_THRESHOLD_MS = 'invalid';

    const config = getJevConfig();

    expect(config.healthTimeoutMs).toBe(2000);
    expect(config.latencyWarnThresholdMs).toBe(800);
  });
});
