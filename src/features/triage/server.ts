import 'server-only';

export { TriageInputUseCase } from './triage-input.use-case';
export {
  ContextualIgnitionUseCase,
  type ContextualIgnitionInput,
} from './contextual-ignition.use-case';
export {
  OpenMeteoWeatherAdapter,
  CANONICAL_BARCELONA_WEATHER_FALLBACK,
  type WeatherAdapterConfig,
} from './open-meteo-weather.adapter';
