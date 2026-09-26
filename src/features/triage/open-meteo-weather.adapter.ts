import { IWeatherPort, WeatherReport } from './weather.port';

export interface WeatherAdapterConfig {
  timeoutMs?: number;
  cacheTtlMs?: number;
  fetchFn?: typeof fetch;
}

/**
 * Mapeo declarativo de códigos WMO (World Meteorological Organization).
 */
function interpretWmoCode(code: number): { summary: string; isAdverse: boolean } {
  if (code === 0) return { summary: 'Cielo despejado', isAdverse: false };
  if (code >= 1 && code <= 3) return { summary: 'Parcialmente nublado', isAdverse: false };
  if (code === 45 || code === 48) return { summary: 'Niebla en la ciudad', isAdverse: false };
  if (code >= 51 && code <= 55) return { summary: 'Llovizna ligera', isAdverse: true };
  if (code >= 61 && code <= 67) return { summary: 'Lluvia en Barcelona', isAdverse: true };
  if (code >= 71 && code <= 77) return { summary: 'Nevada ocasional', isAdverse: true };
  if (code >= 80 && code <= 82) return { summary: 'Chubascos intensos', isAdverse: true };
  if (code >= 95 && code <= 99) return { summary: 'Tormenta eléctrica', isAdverse: true };
  return { summary: 'Tiempo templado', isAdverse: false };
}

export const CANONICAL_BARCELONA_WEATHER_FALLBACK: WeatherReport = {
  summary: 'Tiempo templado y agradable',
  temperatureCelsius: 21,
  conditionCode: 0,
  isAdverse: false,
};

export class OpenMeteoWeatherAdapter implements IWeatherPort {
  private readonly timeoutMs: number;
  private readonly cacheTtlMs: number;
  private readonly fetchFn: typeof fetch;

  // Caché en memoria de instancia
  private cachedReport: WeatherReport | null = null;
  private cacheExpiresAt = 0;

  // Coordenadas canónicas del centro de Barcelona (Plaça Catalunya)
  private readonly latitude = 41.3879;
  private readonly longitude = 2.1699;

  constructor(config?: WeatherAdapterConfig) {
    this.timeoutMs = config?.timeoutMs ?? 200; // 200 ms timeout perimetral estricto
    this.cacheTtlMs = config?.cacheTtlMs ?? 10 * 60 * 1000; // 10 minutos de amortiguación
    this.fetchFn = config?.fetchFn ?? fetch;
  }

  async getBarcelonaWeather(): Promise<WeatherReport> {
    const now = Date.now();

    // 1. Verificación de caché en memoria
    if (this.cachedReport && now < this.cacheExpiresAt) {
      return {
        ...this.cachedReport,
        cachedAt: this.cacheExpiresAt - this.cacheTtlMs,
      };
    }

    // 2. Consulta perimetral con AbortController
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.latitude}&longitude=${this.longitude}&current=temperature_2m,weather_code&timezone=Europe%2FMadrid`;
      const response = await this.fetchFn(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        return this.cachedReport ?? CANONICAL_BARCELONA_WEATHER_FALLBACK;
      }

      const data = (await response.json()) as {
        current?: {
          temperature_2m?: number;
          weather_code?: number;
        };
      };

      const temp = data?.current?.temperature_2m ?? 20;
      const code = data?.current?.weather_code ?? 0;
      const { summary, isAdverse } = interpretWmoCode(code);

      const report: WeatherReport = {
        summary,
        temperatureCelsius: Math.round(temp),
        conditionCode: code,
        isAdverse,
        cachedAt: now,
      };

      this.cachedReport = report;
      this.cacheExpiresAt = now + this.cacheTtlMs;

      return report;
    } catch {
      // Fail-soft: en caso de timeout, corte de red o error de parseo,
      // retornamos la última lectura en caché o el fallback determinista
      return this.cachedReport ?? CANONICAL_BARCELONA_WEATHER_FALLBACK;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}
