import { describe, expect, it, vi } from 'vitest';
import { CircuitBreaker } from './circuit-breaker.js';
import { HealthSensor } from './health-sensor.js';

describe('Circuit Breaker and Health Sensor (PBI-GW-004)', () => {
  describe('CircuitBreaker', () => {
    it('CA-2: debe iniciar en estado CLOSED y transicionar a OPEN tras superar umbral de fallos', () => {
      const breaker = new CircuitBreaker('GROQ', {
        failureThreshold: 3,
        recoveryTimeoutMs: 100,
        windowSize: 10,
      });

      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.canExecute()).toBe(true);

      breaker.recordFailure(100, 500);
      expect(breaker.getState()).toBe('CLOSED');

      breaker.recordFailure(150, 500);
      expect(breaker.getState()).toBe('CLOSED');

      breaker.recordFailure(200, 500); // 3 fallos consecutivos
      expect(breaker.getState()).toBe('OPEN');
      expect(breaker.canExecute()).toBe(false);
    });

    it('CA-2: debe pasar a HALF_OPEN tras el tiempo de recuperación y recuperarse a CLOSED con éxito', async () => {
      const breaker = new CircuitBreaker('GOOGLE', {
        failureThreshold: 2,
        recoveryTimeoutMs: 50,
        windowSize: 10,
      });

      breaker.recordFailure(100, 500);
      breaker.recordFailure(100, 500);
      expect(breaker.getState()).toBe('OPEN');
      expect(breaker.canExecute()).toBe(false);

      // Esperar tiempo de recuperación
      await new Promise((r) => setTimeout(r, 60));

      expect(breaker.getState()).toBe('HALF_OPEN');
      expect(breaker.canExecute()).toBe(true); // Permite la sonda de prueba

      // Una segunda llamada simultánea en HALF_OPEN no se permite hasta que la prueba termine
      expect(breaker.canExecute()).toBe(false);

      // La sonda tiene éxito -> recupera a CLOSED
      breaker.recordSuccess(120, 200);
      expect(breaker.getState()).toBe('CLOSED');
      expect(breaker.canExecute()).toBe(true);
    });
  });

  describe('HealthSensor & Matrices (D-3)', () => {
    it('CA-4: getHealthiestProvider debe devolver el primer proveedor sano de la matriz', () => {
      const sensor = new HealthSensor();

      // FAST_LLM: GROQ principal, GOOGLE secundario
      expect(sensor.getHealthiestProvider('FAST_LLM')).toBe('GROQ');

      // Si GROQ falla y abre circuito, debe caer a GOOGLE
      const groqBreaker = sensor.getBreaker('GROQ');
      groqBreaker.recordFailure(100, 500);
      groqBreaker.recordFailure(100, 500);
      groqBreaker.recordFailure(100, 500);
      expect(groqBreaker.getState()).toBe('OPEN');

      expect(sensor.getHealthiestProvider('FAST_LLM')).toBe('GOOGLE');

      // Si GOOGLE también cae, devuelve null
      const googleBreaker = sensor.getBreaker('GOOGLE');
      googleBreaker.recordFailure(100, 500);
      googleBreaker.recordFailure(100, 500);
      googleBreaker.recordFailure(100, 500);
      expect(googleBreaker.getState()).toBe('OPEN');

      expect(sensor.getHealthiestProvider('FAST_LLM')).toBeNull();
    });

    it('CA-3: sonda activa fallida marca proveedor como DEGRADED sin abrir el circuito', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error on models endpoint'));
      const sensor = new HealthSensor(
        {
          jevBaseUrl: 'https://jev.test',
          jevApiKey: 'test-key',
        },
        mockFetch as unknown as typeof fetch
      );

      const probeSuccess = await sensor.runActiveProbeForProvider('JEV');
      expect(probeSuccess).toBe(false);

      const info = sensor.getBreaker('JEV').getHealthInfo();
      // El circuito sigue CLOSED pero operationalStatus pasa a DEGRADED
      expect(info.circuitState).toBe('CLOSED');
      expect(info.operationalStatus).toBe('DEGRADED');
      expect(sensor.getBreaker('JEV').canExecute()).toBe(true);
    });
  });
});
