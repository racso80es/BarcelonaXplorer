import { TacticalRoute, TacticalWaypoint } from '../tactical-route.entity';
import {
  AffiliateProvider,
  EnrichedRoute,
  EnrichedRouteSchema,
  EnrichedWaypoint,
  WaypointOption,
  TacticalMetadata,
  PickpocketAlertLevel,
} from './affiliate-enricher.schema';

import { CircuitBreaker } from './circuit-breaker';
import { STATIC_AFFILIATE_CATALOG } from './static-affiliate-catalog';

interface TacticalPointKnowledge {
  keywords: string[];
  warnings: string[];
  pickpocketAlertLevel: PickpocketAlertLevel;
  transitTips: string;
  recommendedAlternatives: string[];
  isHighQueue: boolean;
  priorityAccessTitle?: string;
  priorityAccessCta?: string;
  priorityAccessDesc?: string;
}

const TACTICAL_KNOWLEDGE_BASE: TacticalPointKnowledge[] = [
  {
    keywords: ['sagrada familia', 'sagrada família', 'avda gaudi', 'avenida gaudí', 'gaudi'],
    warnings: [
      '⚠️ Escudo Anti-Trampas: Evita comer en la Avenida Gaudí adyacente; precios inflados y paellas recalentadas.',
    ],
    pickpocketAlertLevel: 'HIGH',
    transitTips: 'Mantén pertenencias al frente en la salida de Metro L2/L5 Sagrada Família.',
    recommendedAlternatives: [
      "Bodega L'Estevet (C/ Mallorca)",
      'Can Ros (Menú de mercado tradicional a 4 calles)',
    ],
    isHighQueue: true,
    priorityAccessTitle: 'Acceso Prioritario Sin Colas (Sagrada Família)',
    priorityAccessDesc:
      'Aforo crítico de alta congestión. Asegura tu acceso prioritario aquí antes de desplazarte para evitar colas de más de 90 minutos.',
    priorityAccessCta: 'Asegurar Entrada',
  },
  {
    keywords: ['rambla', 'ramblas', 'boqueria', 'boquería', 'gótico', 'gotico', 'catedral', 'drassanes'],
    warnings: [
      '⚠️ Escudo Anti-Trampas: Desconfía de terrazas con fotos de paellas y sangrías de 1 litro en La Rambla.',
    ],
    pickpocketAlertLevel: 'EXTREME',
    transitTips:
      'Atención a distracciones con mapas o peticiones de firmas falsas en torno al mosaico de Miró.',
    recommendedAlternatives: [
      'Bar del Pla (C/ Montcada)',
      'El Xampanyet (Born auténtico)',
      'Bar La Plata (C/ Mercè)',
    ],
    isHighQueue: false,
  },
  {
    keywords: ['park güell', 'park guell', 'guell'],
    warnings: [
      '⚠️ Escudo Anti-Trampas: Vendedores no autorizados cobran suplementos abusivos en las inmediaciones.',
    ],
    pickpocketAlertLevel: 'MEDIUM',
    transitTips:
      'Accede por las escaleras mecánicas de Baixada de la Glòria para evitar la pendiente pronunciada.',
    recommendedAlternatives: [
      'Terraza La Cabaña (C/ Verdi, Gràcia)',
      'Bar Casi (Cocina casera en Horta-Guinardó)',
    ],
    isHighQueue: true,
    priorityAccessTitle: 'Ticket Anticipado Zona Monumental (Park Güell)',
    priorityAccessDesc:
      'Aforo crítico de alta congestión. Asegura tu acceso prioritario aquí antes de desplazarte para evitar colas de más de 90 minutos.',
    priorityAccessCta: 'Reservar Pase',
  },
  {
    keywords: ['casa batlló', 'casa batllo', 'casa milà', 'casa mila', 'pedrera', 'passeig de gracia'],
    warnings: [
      '⚠️ Escudo Anti-Trampas: Terrazas de Passeig de Gràcia aplican recargos abusivos de servicio no señalizados.',
    ],
    pickpocketAlertLevel: 'MEDIUM',
    transitTips:
      'Usa el pasaje subterráneo de Passeig de Gràcia para cruzar sin esperas de semáforos.',
    recommendedAlternatives: [
      'Cervecería Catalana (C/ Mallorca)',
      'Betlem Miscel·lània Gastronòmica (C/ Girona)',
    ],
    isHighQueue: true,
    priorityAccessTitle: 'Entrada VIP Sin Colas (Casa Batlló / La Pedrera)',
    priorityAccessDesc:
      'Aforo crítico de alta congestión. Asegura tu acceso prioritario aquí antes de desplazarte para evitar colas de más de 90 minutos.',
    priorityAccessCta: 'Acceso VIP Sin Colas',
  },
];

export interface IAffiliateEnricherService {
  enrichRoute(
    route: TacticalRoute,
    thermalState?: 'operational' | 'saturated',
  ): Promise<EnrichedRoute>;
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

  async enrichRoute(
    route: TacticalRoute,
    thermalState: 'operational' | 'saturated' = 'operational',
  ): Promise<EnrichedRoute> {
    const execution = await this.circuitBreaker.execute(
      async () => {
        const enrichedWaypoints: EnrichedWaypoint[] = route.waypoints.map((wp, index) =>
          this.enrichWaypoint(wp, index, thermalState),
        );
        return {
          id: route.id,
          summary: route.summary,
          thermalState,
          waypoints: enrichedWaypoints,
        };
      },
      () => {
        const fallbackWaypoints: EnrichedWaypoint[] = route.waypoints.map((wp) =>
          this.fallbackWaypoint(wp, thermalState),
        );
        return {
          id: route.id,
          summary: `${route.summary} (Catálogo Resiliente)`,
          thermalState,
          waypoints: fallbackWaypoints,
        };
      },
    );

    return EnrichedRouteSchema.parse(execution.result);
  }

  private matchTacticalKnowledge(textToAnalyze: string): TacticalPointKnowledge | undefined {
    return TACTICAL_KNOWLEDGE_BASE.find((entry) =>
      entry.keywords.some((kw) => textToAnalyze.includes(kw)),
    );
  }

  private fallbackWaypoint(
    wp: TacticalWaypoint,
    thermalState: 'operational' | 'saturated',
  ): EnrichedWaypoint {
    const textToAnalyze = `${wp.title} ${wp.description}`.toLowerCase();
    const isGastronomy = this.gastronomyKeywords.some((kw) => textToAnalyze.includes(kw));
    const isCultural = this.culturalKeywords.some((kw) => textToAnalyze.includes(kw));

    const category = isGastronomy ? 'GASTRONOMY' : isCultural ? 'CULTURE' : 'ACTIVITY';
    const fallbackOptions = STATIC_AFFILIATE_CATALOG[category];
    const primaryOption = fallbackOptions[0];

    const tacticalMatch = this.matchTacticalKnowledge(textToAnalyze);
    const tacticalMetadata = this.buildTacticalMetadata(tacticalMatch, isGastronomy, thermalState);

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
      tacticalMetadata,
    };
  }

  private buildTacticalMetadata(
    match: TacticalPointKnowledge | undefined,
    isGastronomy: boolean,
    thermalState: 'operational' | 'saturated',
  ): TacticalMetadata | undefined {
    if (!match && !isGastronomy) {
      return undefined;
    }

    const defaultGastronomyWarnings = [
      '⚠️ Consejo Local: Comprueba que el menú incluya IVA y evita locales con relaciones públicas en la puerta.',
    ];
    const defaultGastronomyAlternatives = [
      'Bodega Montferry (Sants)',
      'Quimet & Quimet (Poble Sec)',
    ];

    const warnings = match ? match.warnings : defaultGastronomyWarnings;
    const pickpocketAlertLevel = match ? match.pickpocketAlertLevel : 'LOW';
    const transitTips = match ? match.transitTips : undefined;

    // Táctica del Refugio: La seguridad física (warnings, carteristas, tips) viaja siempre.
    // Curaduría S+ Grade: Las alternativas gastronómicas solo se revelan en modo 'saturated'.
    const recommendedAlternatives =
      thermalState === 'saturated'
        ? match
          ? match.recommendedAlternatives
          : defaultGastronomyAlternatives
        : [];

    return {
      antiTrapShield: {
        warnings,
        recommendedAlternatives,
      },
      microLogistics: {
        pickpocketAlertLevel,
        transitTips,
        realWalkingTimeMinutes: 12,
      },
      environmentalConditions: {
        rainFriendly: true,
        requiresDaylight: false,
      },
    };
  }

  private enrichWaypoint(
    wp: TacticalWaypoint,
    index: number,
    thermalState: 'operational' | 'saturated',
  ): EnrichedWaypoint {
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

    const tacticalMatch = this.matchTacticalKnowledge(textToAnalyze);
    const tacticalMetadata = this.buildTacticalMetadata(tacticalMatch, isGastronomy, thermalState);
    const options = this.generateOptionsForWaypoint(
      wp,
      category,
      provider,
      affiliateUrl,
      index,
      thermalState,
      tacticalMatch,
    );

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
      tacticalMetadata,
    };
  }

  private generateOptionsForWaypoint(
    wp: TacticalWaypoint,
    category: 'GASTRONOMY' | 'CULTURE' | 'ACTIVITY' | 'TRANSIT' | 'GENERAL',
    provider: AffiliateProvider,
    affiliateUrl: string | undefined,
    index: number,
    thermalState: 'operational' | 'saturated',
    tacticalMatch?: TacticalPointKnowledge,
  ): WaypointOption[] {
    const isSaturated = thermalState === 'saturated';
    const isPriorityMonument = isSaturated && tacticalMatch?.isHighQueue;

    const option1Title = isPriorityMonument && tacticalMatch.priorityAccessTitle
      ? tacticalMatch.priorityAccessTitle
      : `${wp.title} (Selección Principal)`;

    const option1Desc = isPriorityMonument && tacticalMatch.priorityAccessDesc
      ? tacticalMatch.priorityAccessDesc
      : wp.description;

    const option1: WaypointOption = {
      id: `opt-${wp.id}-1`,
      title: option1Title,
      description: option1Desc,
      provider,
      affiliateUrl,
      priceEstimate: category === 'GASTRONOMY' ? '25€ - 40€' : category === 'CULTURE' ? '18€ - 30€' : 'Gratis',
      rating: 4.8,
      isSelected: true,
      placementTrigger: isPriorityMonument ? 'HIGH_QUEUE_MONUMENT' : undefined,
      isPriorityAccess: Boolean(isPriorityMonument),
      ctaLabel: isPriorityMonument ? tacticalMatch.priorityAccessCta : undefined,
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

