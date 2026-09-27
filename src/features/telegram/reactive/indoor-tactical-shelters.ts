// ═══════════════════════════════════════════════════════════════
// Vertical Slice: Telegram / Reactive
// Catálogo Canónico Inmutable de Refugios Interiores de Barcelona
// Marco Constitucional: Protocolo de Acero — Grado S+
// ═══════════════════════════════════════════════════════════════

import { GeometricFatigueVo } from './geometric-fatigue.vo';

export interface IndoorShelter {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly lat: number;
  readonly lng: number;
  readonly cpaUrl: string;
  readonly estimatedStayMinutes: number;
  readonly affiliateProvider: string;
}

export const INDOOR_TACTICAL_SHELTERS: readonly IndoorShelter[] = Object.freeze([
  {
    id: 'shelter-batllo',
    name: 'Casa Batlló',
    description: 'Icono modernista cubierto en Passeig de Gràcia. Refugio climatizado de alta inmersión.',
    lat: 41.3916,
    lng: 2.1648,
    cpaUrl: 'https://www.civitatis.com/es/barcelona/entrada-casa-batllo/?aid=bcn_xplorer',
    estimatedStayMinutes: 75,
    affiliateProvider: 'CIVITATIS',
  },
  {
    id: 'shelter-pedrera',
    name: 'Casa Milà (La Pedrera)',
    description: 'Espacio interior gaudiniano con desvanes protegidos y exposición cultural.',
    lat: 41.3953,
    lng: 2.1619,
    cpaUrl: 'https://www.civitatis.com/es/barcelona/entrada-la-pedrera/?aid=bcn_xplorer',
    estimatedStayMinutes: 75,
    affiliateProvider: 'CIVITATIS',
  },
  {
    id: 'shelter-picasso',
    name: 'Museu Picasso (El Born)',
    description: 'Cinco palacios góticos unidos en Carrer Montcada. Recorrido completamente techado.',
    lat: 41.3853,
    lng: 2.1809,
    cpaUrl: 'https://www.civitatis.com/es/barcelona/visita-guiada-museo-picasso/?aid=bcn_xplorer',
    estimatedStayMinutes: 90,
    affiliateProvider: 'CIVITATIS',
  },
  {
    id: 'shelter-caixaforum',
    name: 'CaixaForum Barcelona (Montjuïc)',
    description: 'Antigua fábrica textil modernista Casaramona. Salas de exposiciones protegidas de la lluvia.',
    lat: 41.3712,
    lng: 2.1498,
    cpaUrl: 'https://caixaforum.org/es/barcelona?tag=bcn_xplorer',
    estimatedStayMinutes: 90,
    affiliateProvider: 'CULTURE_DIRECT',
  },
  {
    id: 'shelter-boqueria',
    name: 'Mercat de la Boqueria (Zona Techada)',
    description: 'Estructura metálica modernista cubierta con más de 200 puestos y barras gastronómicas protegidas.',
    lat: 41.3817,
    lng: 2.1716,
    cpaUrl: 'https://www.thefork.es/search?cityId=415144&query=boqueria&tag=bcn_xplorer',
    estimatedStayMinutes: 60,
    affiliateProvider: 'THEFORK',
  },
]);

/**
 * Encuentra de forma determinista el refugio interior más próximo a las coordenadas dadas.
 */
export function findNearestIndoorShelter(currentCoords: {
  lat: number;
  lng: number;
}): IndoorShelter {
  let nearest = INDOOR_TACTICAL_SHELTERS[0];
  let minDistance = GeometricFatigueVo.calculateDistanceMeters(currentCoords, nearest);

  for (let i = 1; i < INDOOR_TACTICAL_SHELTERS.length; i++) {
    const shelter = INDOOR_TACTICAL_SHELTERS[i];
    const dist = GeometricFatigueVo.calculateDistanceMeters(currentCoords, shelter);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = shelter;
    }
  }

  return nearest;
}
