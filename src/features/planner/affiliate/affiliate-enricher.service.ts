import { TacticalRoute, TacticalWaypoint } from '../tactical-route.entity';
import {
  AffiliateProvider,
  EnrichedRoute,
  EnrichedRouteSchema,
  EnrichedWaypoint,
  WaypointOption,
} from './affiliate-enricher.schema';

import { CircuitBreaker } from './circuit-breaker';
import { STATIC_AFFILIATE_CATALOG } from './static-affiliate-catalog';

export interface IAffiliateEnricherService {
  enrichRoute(route: TacticalRoute): Promise<EnrichedRoute>;
}

export class AffiliateEnricherService implements IAffiliateEnricherService {
  constructor(private readonly circuitBreaker: CircuitBreaker = new CircuitBreaker()) {}

  private readonly gastronomyKeywords = [
    'restaurante',
    'restauran',
    'tapas',
    'comida',
    'almuerzo',
    'cena',
    'comer',
    'vermut',
    'bodega',
    'gastronom',
    'paella',
    'brunch',
    'bar',
    'café',
    'cafe',
  ];

  private readonly culturalKeywords = [
    'sagrada familia',
    'park güell',
    'park guell',
    'casa batlló',
    'casa batllo',
    'casa milà',
    'casa mila',
    'la pedrera',
    'pedrera',
    'museo',
    'museu',
    'catedral',
    'gótico',
    'gotico',
    'tour',
    'visita guiada',
    'montjuïc',
    'montjuic',
    'picasso',
    'camp nou',
    'boqueria',
    'mirador',
    'acuari',
  ];

  public getCircuitBreaker(): CircuitBreaker {
    return this.circuitBreaker;
  }

  async enrichRoute(route: TacticalRoute): Promise<EnrichedRoute> {
    const execution = await this.circuitBreaker.execute(
      async () => {
        const enrichedWaypoints: EnrichedWaypoint[] = route.waypoints.map((wp, index) =>
          this.enrichWaypoint(wp, index),
        );
        return {
          id: route.id,
          summary: route.summary,
          waypoints: enrichedWaypoints,
        };
      },
      () => {
        const fallbackWaypoints: EnrichedWaypoint[] = route.waypoints.map((wp) =>
          this.fallbackWaypoint(wp),
        );
        return {
          id: route.id,
          summary: `${route.summary} (Catálogo Resiliente)`,
          waypoints: fallbackWaypoints,
        };
      },
    );

    return EnrichedRouteSchema.parse(execution.result);
  }

  private fallbackWaypoint(wp: TacticalWaypoint): EnrichedWaypoint {
    const textToAnalyze = `${wp.title} ${wp.description}`.toLowerCase();
    const isGastronomy = this.gastronomyKeywords.some((kw) => textToAnalyze.includes(kw));
    const isCultural = this.culturalKeywords.some((kw) => textToAnalyze.includes(kw));

    const category = isGastronomy ? 'GASTRONOMY' : isCultural ? 'CULTURE' : 'ACTIVITY';
    const fallbackOptions = STATIC_AFFILIATE_CATALOG[category];
    const primaryOption = fallbackOptions[0];

    return {
      id: wp.id,
      title: wp.title,
      description: wp.description,
      category,
      coordinates: wp.coordinates
        ? { lat: wp.coordinates.lat, lng: wp.coordinates.lng }
        : undefined,
      timeSpan: wp.timeSpan
        ? { start: wp.timeSpan.start, end: wp.timeSpan.end }
        : undefined,
      recommendations: wp.recommendations ?? [],
      affiliateProvider: primaryOption.provider,
      affiliateUrl: primaryOption.affiliateUrl,
      options: fallbackOptions,
    };
  }

  private enrichWaypoint(wp: TacticalWaypoint, index: number): EnrichedWaypoint {
    const textToAnalyze = `${wp.title} ${wp.description}`.toLowerCase();

    const isGastronomy = this.gastronomyKeywords.some((kw) =>
      textToAnalyze.includes(kw),
    );
    const isCultural = this.culturalKeywords.some((kw) =>
      textToAnalyze.includes(kw),
    );

    let category: 'GASTRONOMY' | 'CULTURE' | 'ACTIVITY' | 'TRANSIT' | 'GENERAL' = 'GENERAL';
    let provider: AffiliateProvider = 'NONE';
    let affiliateUrl: string | undefined = undefined;

    if (isGastronomy) {
      category = 'GASTRONOMY';
      provider = 'THEFORK';
      affiliateUrl = `https://www.thefork.es/search?cityId=415144&query=${encodeURIComponent(wp.title)}&tag=bcn_xplorer`;
    } else if (isCultural) {
      category = 'CULTURE';
      provider = 'CIVITATIS';
      affiliateUrl = `https://www.civitatis.com/es/barcelona/?query=${encodeURIComponent(wp.title)}&aid=bcn_xplorer`;
    } else {
      category = 'ACTIVITY';
      provider = 'NONE';
    }

    const options = this.generateOptionsForWaypoint(wp, category, provider, affiliateUrl, index);

    return {
      id: wp.id,
      title: wp.title,
      description: wp.description,
      category,
      coordinates: wp.coordinates
        ? { lat: wp.coordinates.lat, lng: wp.coordinates.lng }
        : undefined,
      timeSpan: wp.timeSpan
        ? { start: wp.timeSpan.start, end: wp.timeSpan.end }
        : undefined,
      recommendations: wp.recommendations ?? [],
      affiliateProvider: provider,
      affiliateUrl,
      options,
    };
  }

  private generateOptionsForWaypoint(
    wp: TacticalWaypoint,
    category: 'GASTRONOMY' | 'CULTURE' | 'ACTIVITY' | 'TRANSIT' | 'GENERAL',
    provider: AffiliateProvider,
    affiliateUrl: string | undefined,
    index: number,
  ): WaypointOption[] {
    const option1: WaypointOption = {
      id: `opt-${wp.id}-1`,
      title: `${wp.title} (Selección Principal)`,
      description: wp.description,
      provider,
      affiliateUrl,
      priceEstimate: category === 'GASTRONOMY' ? '25€ - 40€' : category === 'CULTURE' ? '18€ - 30€' : 'Gratis',
      rating: 4.8,
      isSelected: true,
    };

    let option2Title = `Alternativa en ${wp.title}`;
    let option2Desc = `Variante táctica de proximidad con menor afluencia.`;
    let option2Url = affiliateUrl;

    if (category === 'GASTRONOMY') {
      option2Title = `Bistró & Tapas de Proximidad (${wp.title})`;
      option2Desc = `Opción recomendada con terraza y reserva prioritaria.`;
      option2Url = `https://www.thefork.es/search?cityId=415144&query=${encodeURIComponent('tapas bar ' + wp.title)}&tag=bcn_xplorer`;
    } else if (category === 'CULTURE') {
      option2Title = `Acceso Rápido / Tour Especial (${wp.title})`;
      option2Desc = `Visita guiada con acceso sin colas y guía en español.`;
      option2Url = `https://www.civitatis.com/es/barcelona/?query=${encodeURIComponent('tour guiado ' + wp.title)}&aid=bcn_xplorer`;
    } else {
      option2Title = `Paseo Panorámico Alternativo #${index + 1}`;
      option2Desc = `Ruta peatonal escénica por los alrededores del punto de interés.`;
    }

    const option2: WaypointOption = {
      id: `opt-${wp.id}-2`,
      title: option2Title,
      description: option2Desc,
      provider,
      affiliateUrl: option2Url,
      priceEstimate: category === 'GASTRONOMY' ? '20€ - 35€' : category === 'CULTURE' ? '15€ - 25€' : 'Gratis',
      rating: 4.6,
      isSelected: false,
    };

    return [option1, option2];
  }
}
