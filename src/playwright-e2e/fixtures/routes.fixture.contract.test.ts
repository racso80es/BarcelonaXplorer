import { describe, it, expect } from 'vitest';
import { TriageOutcomeSchema } from '@/features/triage/triage.schema';
import { EnrichedRouteSchema } from '@/features/planner';
import {
  baseOperationalItinerary,
  saturatedSGradeItinerary,
  triageDispatchBaseDto,
  triageDispatchSaturatedDto,
} from './routes.fixture';

describe('PBI-STEEL-006: fixtures E2E alineados con contrato Zod', () => {
  it('valida itinerarios enriquecidos de Playwright', () => {
    expect(EnrichedRouteSchema.safeParse(baseOperationalItinerary).success).toBe(
      true,
    );
    expect(EnrichedRouteSchema.safeParse(saturatedSGradeItinerary).success).toBe(
      true,
    );
  });

  it('valida DTOs de despacho contra TriageOutcomeSchema', () => {
    expect(TriageOutcomeSchema.safeParse(triageDispatchBaseDto).success).toBe(
      true,
    );
    expect(TriageOutcomeSchema.safeParse(triageDispatchSaturatedDto).success).toBe(
      true,
    );
  });
});
