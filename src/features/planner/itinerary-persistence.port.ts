import { EnrichedRoute, EnrichedWaypoint } from './affiliate/affiliate-enricher.schema';

export interface PersistedItineraryDto {
  id: string;
  sessionId: string;
  summary: string;
  status: string;
  waypoints: EnrichedWaypoint[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ItineraryPersistencePort {
  saveItinerary(sessionId: string, route: EnrichedRoute): Promise<PersistedItineraryDto>;
  getItineraryBySessionId(sessionId: string): Promise<PersistedItineraryDto | null>;
  updateNodeSelection(nodeId: string, optionId: string): Promise<boolean>;
  updateNodeTime(nodeId: string, startTime: string, endTime?: string): Promise<boolean>;
}
