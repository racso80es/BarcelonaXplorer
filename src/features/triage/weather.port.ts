export interface WeatherReport {
  summary: string;
  temperatureCelsius: number;
  conditionCode: number;
  isAdverse: boolean; // ej. lluvia, tormenta, calor extremo
  cachedAt?: number;
}

export interface IWeatherPort {
  /**
   * Obtiene el estado meteorológico actual de Barcelona con amortiguación y timeout perimetral.
   * En caso de fallo o timeout, retorna de forma determinista un reporte templado (Fail-Soft).
   */
  getBarcelonaWeather(): Promise<WeatherReport>;
}
