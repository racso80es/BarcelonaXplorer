/**
 * Fixtures deterministas para E2E Playwright (PBI-QA-E2E-003).
 * Espejan EnrichedRoute / waypoints sin importar desde src/ (evita acoplar tsc de la app).
 */

export const WAYPOINT_ID_E2E = 'wp-e2e-1';

const baseWaypoint = {
  id: WAYPOINT_ID_E2E,
  title: 'Basílica de la Sagrada Família',
  description: 'Monumento emblemático de Antoni Gaudí',
  category: 'CULTURE' as const,
  timeSpan: { start: '10:00', end: '12:00' },
  recommendations: [] as string[],
  affiliateProvider: 'CIVITATIS' as const,
  affiliateUrl: 'https://www.civitatis.com/es/barcelona/',
  options: [
    {
      id: 'opt-e2e-1',
      title: 'Acceso Prioritario Sin Colas',
      description: 'Aforo crítico de alta congestión.',
      provider: 'CIVITATIS' as const,
      affiliateUrl: 'https://www.civitatis.com/es/barcelona/sagrada-familia/',
      isSelected: true,
      isPriorityAccess: false,
    },
  ],
  tacticalMetadata: {
    antiTrapShield: {
      warnings: [
        '⚠️ Escudo Anti-Trampas: Evita comer en la Avenida Gaudí adyacente; precios inflados.',
      ],
      recommendedAlternatives: ["Bodega L'Estevet (C/ Mallorca)"],
    },
    microLogistics: {
      pickpocketAlertLevel: 'HIGH' as const,
      transitTips: 'Mantén pertenencias al frente en la salida de Metro L2/L5.',
      realWalkingTimeMinutes: 12,
    },
  },
};

export const baseOperationalItinerary = {
  id: 'route-e2e-base',
  summary: 'Ruta Táctica Modernista (E2E Base)',
  thermalState: 'operational' as const,
  waypoints: [baseWaypoint],
};

export const saturatedSGradeItinerary = {
  id: 'route-e2e-splus',
  summary: 'Ruta Táctica S+ Grade (E2E Saturación)',
  thermalState: 'saturated' as const,
  waypoints: [
    {
      ...baseWaypoint,
      options: [
        {
          ...baseWaypoint.options[0],
          isPriorityAccess: true,
          ctaLabel: 'Asegurar Entrada',
        },
      ],
    },
  ],
};

export const triageDispatchBaseDto = {
  status: 'DISPATCH_READY' as const,
  sessionId: 'e2e-playwright-session',
  matrixId: 'default',
  score: 75,
  survivalThreshold: 60,
  isThresholdSatisfied: true,
  _sys_lang: 'es' as const,
  durationMs: 5,
  itinerary: baseOperationalItinerary,
};

export const triageDispatchSaturatedDto = {
  ...triageDispatchBaseDto,
  score: 100,
  isThresholdSatisfied: true,
  itinerary: saturatedSGradeItinerary,
};

export const triageDispatchStreamOnlyDto = {
  ...triageDispatchBaseDto,
  score: 80,
  itinerary: undefined,
};

export const ignitionEnvelope = {
  success: true,
  result: {
    greeting: 'Bienvenido a BarcelonaXplorer (E2E)',
    sparks: [] as unknown[],
    _sys_lang: 'es',
  },
};
