// ═══════════════════════════════════════════════════════════════
// Vertical Slice: Triage & Universal Customs
// Marco Constitucional: Protocolo de Acero — Grado S+
// ═══════════════════════════════════════════════════════════════

export {
  TriageStatusSchema,
  UserGpsLocationSchema,
  MoodSchema,
  TriageInputSchema,
  TriageOutcomeDtoSchema,
  type TriageStatus,
  type UserGpsLocation,
  type Mood,
  type TriageInputDto,
  type TriageOutcomeDto,
} from './triage.schema';

export { TriageOutcome } from './triage-outcome.vo';
export { type ITriageInputUseCasePort } from './triage-input.use-case.port';
export { TriageInputUseCase } from './triage-input.use-case';

export {
  DeviceTypeEnum,
  TimeWindowPeriodEnum,
  IgnitionSensoryContextSchema,
  IgnitionSparkSchema,
  IgnitionOutcomeSchema,
  classifyTimeWindow,
  detectDeviceType,
  type DeviceType,
  type TimeWindowPeriod,
  type IgnitionSensoryContextDto,
  type IgnitionSpark,
  type IgnitionOutcome,
} from './ignition.schema';

export { type WeatherReport, type IWeatherPort } from './weather.port';
export {
  OpenMeteoWeatherAdapter,
  CANONICAL_BARCELONA_WEATHER_FALLBACK,
  type WeatherAdapterConfig,
} from './open-meteo-weather.adapter';

export {
  ContextualIgnitionUseCase,
  type ContextualIgnitionInput,
} from './contextual-ignition.use-case';
