// ═══════════════════════════════════════════════════════════════
// Vertical Slice: Triage & Universal Customs — Superficie de Dominio Puro
// Marco Constitucional: Protocolo de Acero — Grado S+ (PBI-STEEL-022)
// Infraestructura y adaptadores de servidor en ./server
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
export type { ITriageInputUseCasePort } from './triage-input.use-case.port';
export type { WeatherReport, IWeatherPort } from './weather.port';

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

export {
  DensityPresenceProbeSchema,
  type DensityPresenceProbe,
} from './density-presence-probe.schema';

export {
  mergePresenceWithHeuristic,
  type MergePresenceWithHeuristicInput,
} from './merge-presence-with-heuristic';

export {
  BX_LANG_COOKIE,
  LanguageIntentSchema,
  ROUTE_LANGUAGE_DIRECTIVES,
  detectLanguageFromPrompt,
  looksLikeLanguageSwitch,
  parseLanguageIntent,
  resolveBaselineLanguage,
  buildRouteLanguageDirective,
  type LanguageIntent,
} from './language-detector';
