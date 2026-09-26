import { describe, it, expect, vi } from 'vitest';
import {
  OpenMeteoWeatherAdapter,
  CANONICAL_BARCELONA_WEATHER_FALLBACK,
} from './open-meteo-weather.adapter';

describe('OpenMeteoWeatherAdapter (Fail-Soft & Timeout Perimetral)', () => {
  it('obtiene y mapea correctamente un reporte meteorológico con código de lluvia', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 17.6,
          weather_code: 61, // Lluvia
        },
      }),
    } as unknown as Response);

    const adapter = new OpenMeteoWeatherAdapter({
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const report = await adapter.getBarcelonaWeather();

    expect(report.temperatureCelsius).toBe(18);
    expect(report.summary).toBe('Lluvia en Barcelona');
    expect(report.isAdverse).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('utiliza la memoria caché en llamadas subsiguientes dentro del TTL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 22.0,
          weather_code: 0, // Despejado
        },
      }),
    } as unknown as Response);

    const adapter = new OpenMeteoWeatherAdapter({
      fetchFn: mockFetch as unknown as typeof fetch,
      cacheTtlMs: 60000,
    });

    const first = await adapter.getBarcelonaWeather();
    const second = await adapter.getBarcelonaWeather();

    expect(first.temperatureCelsius).toBe(22);
    expect(second.temperatureCelsius).toBe(22);
    expect(mockFetch).toHaveBeenCalledTimes(1); // No repite fetch dentro del TTL
  });

  it('activa Fail-Soft y devuelve fallback canónico ante respuesta HTTP fallida', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    } as unknown as Response);

    const adapter = new OpenMeteoWeatherAdapter({
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const report = await adapter.getBarcelonaWeather();

    expect(report.summary).toBe(CANONICAL_BARCELONA_WEATHER_FALLBACK.summary);
    expect(report.temperatureCelsius).toBe(CANONICAL_BARCELONA_WEATHER_FALLBACK.temperatureCelsius);
  });

  it('activa Fail-Soft sin lanzar excepción ante corte de red o timeout', async () => {
    const mockFetch = vi.fn().mockImplementation(() => {
      throw new Error('Network timeout / connection aborted');
    });

    const adapter = new OpenMeteoWeatherAdapter({
      fetchFn: mockFetch as unknown as typeof fetch,
      timeoutMs: 50,
    });

    const report = await adapter.getBarcelonaWeather();

    expect(report).toBeDefined();
    expect(report.temperatureCelsius).toBe(CANONICAL_BARCELONA_WEATHER_FALLBACK.temperatureCelsius);
  });
});
