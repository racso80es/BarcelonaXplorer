// ═══════════════════════════════════════════════════════════════
// Vertical Slice: Planner — superficie de dominio puro (cliente-safe)
// PBI-STEEL-007: exports nominales; infraestructura en ./server
// ═══════════════════════════════════════════════════════════════

export {
  DefaultDensityPayloadSchema,
  calculateMatrixDensity,
  type DefaultDensityPayload,
} from './matrix';

export { GeographicScope } from './geographic-scope.vo';
export type { DensityMatrixRepositoryPort } from './density-matrix-repository.port';
export type { GeographicDecisionEnginePort } from './geographic-decision-engine.port';
export type { GeographicScopeResultDto } from './geographic-scope.schema';
export {
  GeographicScopeResultSchema,
  ValidateGeographicScopeInputSchema,
  type ValidateGeographicScopeInputDto,
} from './geographic-scope.schema';
export type { ValidateGeographicScopeUseCasePort } from './validate-geographic-scope.use-case.port';

export {
  GeoCoordinates,
  TimeSpan,
  TacticalWaypoint,
  TacticalRoute,
} from './tactical-route.entity';

export {
  GeoCoordinatesZodSchema,
  TimeSpanZodSchema,
  TacticalWaypointZodSchema,
  TacticalRouteZodSchema,
} from './tactical-route.schema';

export {
  EnrichedRouteSchema,
  EnrichedWaypointSchema,
  type EnrichedRoute,
  type EnrichedWaypoint,
} from './affiliate/affiliate-enricher.schema';

export type { IAffiliateEnricherService } from './affiliate/affiliate-enricher.service';

export { ChronologicalPropagator } from './chronological-propagator';

export type { ItineraryPersistencePort } from './itinerary-persistence.port';

export {
  OrchestratorStreamEventSchema,
  formatSseMessage,
  type OrchestratorStreamEvent,
} from './streaming-events.schema';
