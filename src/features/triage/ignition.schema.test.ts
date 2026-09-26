import { describe, it, expect } from 'vitest';
import {
  IgnitionSensoryContextSchema,
  classifyTimeWindow,
  detectDeviceType,
  IgnitionOutcomeSchema,
} from './ignition.schema';

describe('Ignition Sensory Schemas & Helpers (S+ Grade)', () => {
  it('valida un contexto sensorial íntegro conforme a esquema Zod', () => {
    const validData = {
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      device: 'MOBILE' as const,
      language: 'es',
      clientTimestamp: 1727366400000,
      serverTimestamp: 1727366400100,
      detectedHour: 10,
      period: 'MORNING' as const,
      weatherSummary: 'Lluvia en Barcelona',
      temperatureCelsius: 18,
      priorMemoryExcerpt: 'Buscaba restaurantes románticos en el Born',
    };

    const parsed = IgnitionSensoryContextSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it('rechaza un sessionId que no sea UUID o detectedHour fuera de rango', () => {
    const invalidData = {
      sessionId: 'invalid-session-id',
      device: 'DESKTOP' as const,
      language: 'es',
      clientTimestamp: 1727366400000,
      serverTimestamp: 1727366400100,
      detectedHour: 25, // Inválido (>23)
      period: 'NIGHT' as const,
    };

    const parsed = IgnitionSensoryContextSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  describe('classifyTimeWindow (Mapeo declarativo)', () => {
    it('clasifica correctamente 00:00 a 05:59 como DAWN', () => {
      expect(classifyTimeWindow(0)).toBe('DAWN');
      expect(classifyTimeWindow(3)).toBe('DAWN');
      expect(classifyTimeWindow(5)).toBe('DAWN');
    });

    it('clasifica correctamente 06:00 a 12:59 como MORNING', () => {
      expect(classifyTimeWindow(6)).toBe('MORNING');
      expect(classifyTimeWindow(9)).toBe('MORNING');
      expect(classifyTimeWindow(12)).toBe('MORNING');
    });

    it('clasifica correctamente 13:00 a 19:59 como AFTERNOON', () => {
      expect(classifyTimeWindow(13)).toBe('AFTERNOON');
      expect(classifyTimeWindow(16)).toBe('AFTERNOON');
      expect(classifyTimeWindow(19)).toBe('AFTERNOON');
    });

    it('clasifica correctamente 20:00 a 23:59 como NIGHT', () => {
      expect(classifyTimeWindow(20)).toBe('NIGHT');
      expect(classifyTimeWindow(22)).toBe('NIGHT');
      expect(classifyTimeWindow(23)).toBe('NIGHT');
    });
  });

  describe('detectDeviceType', () => {
    it('detecta MOBILE para agentes de usuario de teléfonos', () => {
      const iPhoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
      const androidUA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile Safari/537.36';
      expect(detectDeviceType(iPhoneUA)).toBe('MOBILE');
      expect(detectDeviceType(androidUA)).toBe('MOBILE');
    });

    it('detecta TABLET para iPads o tablets Android', () => {
      const iPadUA = 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15';
      const tabletUA = 'Mozilla/5.0 (Linux; Android 13; SM-X900) AppleWebKit/537.36';
      expect(detectDeviceType(iPadUA)).toBe('TABLET');
      expect(detectDeviceType(tabletUA)).toBe('TABLET');
    });

    it('detecta DESKTOP por defecto o para navegadores de escritorio', () => {
      const desktopUA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      expect(detectDeviceType(desktopUA)).toBe('DESKTOP');
      expect(detectDeviceType(null)).toBe('DESKTOP');
      expect(detectDeviceType(undefined)).toBe('DESKTOP');
    });
  });

  describe('IgnitionOutcomeSchema', () => {
    it('valida correctamente un IgnitionOutcome completo', () => {
      const outcome = {
        greeting: '¡Buenos días! Amanece con lluvia en Barcelona.',
        isFallback: false,
        period: 'MORNING' as const,
        device: 'MOBILE' as const,
        sparks: [
          {
            id: 'spark-1',
            type: 'weather' as const,
            insight: 'Lluvia en Barcelona (18ºC). Recomendamos actividades cubiertas.',
            urgency: 'medium' as const,
          },
        ],
        contextSummary: 'Sesión nueva | Móvil | Mañana | Lluvia',
      };

      const parsed = IgnitionOutcomeSchema.safeParse(outcome);
      expect(parsed.success).toBe(true);
    });
  });
});
