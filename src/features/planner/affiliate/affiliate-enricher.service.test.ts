import { describe, it, expect } from 'vitest';
import { AffiliateEnricherService } from './affiliate-enricher.service';
import { TacticalRoute, TacticalWaypoint, TimeSpan } from '../tactical-route.entity';

describe('AffiliateEnricherService (Protocolo de Acero S+ / HU-10)', () => {
  const enricher = new AffiliateEnricherService();

  it('debe enriquecer un waypoint gastronómico con TheFork y generar 2 opciones viables', async () => {
    const gastronomyWaypoint = new TacticalWaypoint(
      'wp-1',
      'Restaurante Cerveseria Catalana',
      'Tapas clásicas de marisco y montaditos en Eixample',
      undefined,
      new TimeSpan('13:30', '15:00'),
      ['Pedir flauta de solomillo'],
    );

    const route = new TacticalRoute('route-1', 'Ruta Gastronómica', [gastronomyWaypoint]);

    const enriched = await enricher.enrichRoute(route, 'operational');

    expect(enriched.waypoints).toHaveLength(1);
    const wp = enriched.waypoints[0];
    expect(wp.category).toBe('GASTRONOMY');
    expect(wp.affiliateProvider).toBe('THEFORK');
    expect(wp.affiliateUrl).toContain('thefork.es');
    expect(wp.affiliateUrl).toContain('Cerveseria%20Catalana');
    expect(wp.options).toHaveLength(2);
    expect(wp.options[0].isSelected).toBe(true);
    expect(wp.options[1].isSelected).toBe(false);
    expect(wp.options[0].provider).toBe('THEFORK');
    expect(enriched.thermalState).toBe('operational');
  });

  it('debe aplicar la Táctica del Refugio en Ruta Base: advertencias vitales activas y alternativas gastronómicas latentes', async () => {
    const sagradaFamiliaWaypoint = new TacticalWaypoint(
      'wp-sf-base',
      'Basílica de la Sagrada Família',
      'Visita monumental modernista y paseo por los alrededores',
      undefined,
      new TimeSpan('10:00', '12:00'),
    );

    const route = new TacticalRoute('route-sf-base', 'Ruta Base Gaudí', [sagradaFamiliaWaypoint]);

    const enriched = await enricher.enrichRoute(route, 'operational');
    const wp = enriched.waypoints[0];

    // Seguridad innegociable presente
    expect(wp.tacticalMetadata).toBeDefined();
    expect(wp.tacticalMetadata?.antiTrapShield?.warnings).toHaveLength(1);
    expect(wp.tacticalMetadata?.antiTrapShield?.warnings[0]).toContain('Avenida Gaudí');
    expect(wp.tacticalMetadata?.microLogistics?.pickpocketAlertLevel).toBe('HIGH');
    expect(wp.tacticalMetadata?.microLogistics?.transitTips).toContain('Metro L2/L5');

    // Alternativas gastronómicas de barrio LATENTES (bloqueadas para S+)
    expect(wp.tacticalMetadata?.antiTrapShield?.recommendedAlternatives).toHaveLength(0);

    // Sin pase prioritario forzado en Base
    expect(wp.options[0].isPriorityAccess).toBe(false);
    expect(wp.options[0].placementTrigger).toBeUndefined();
  });

  it('debe activar el Modo S+ Grade: revela alternativas gastronómicas auténticas y Drops Preventivos CPA con acceso prioritario', async () => {
    const sagradaFamiliaWaypoint = new TacticalWaypoint(
      'wp-sf-sat',
      'Basílica de la Sagrada Família',
      'Visita monumental modernista y paseo por los alrededores',
      undefined,
      new TimeSpan('10:00', '12:00'),
    );

    const route = new TacticalRoute('route-sf-sat', 'Ruta S+ Grade Gaudí', [sagradaFamiliaWaypoint]);

    const enriched = await enricher.enrichRoute(route, 'saturated');
    const wp = enriched.waypoints[0];

    expect(enriched.thermalState).toBe('saturated');

    // Seguridad vital presente
    expect(wp.tacticalMetadata?.antiTrapShield?.warnings).toHaveLength(1);
    expect(wp.tacticalMetadata?.microLogistics?.pickpocketAlertLevel).toBe('HIGH');

    // Alternativas gastronómicas de barrio DESBLOQUEADAS
    expect(wp.tacticalMetadata?.antiTrapShield?.recommendedAlternatives.length).toBeGreaterThan(0);
    expect(wp.tacticalMetadata?.antiTrapShield?.recommendedAlternatives[0]).toContain('Estevet');

    // Drop Preventivo CPA de Acceso Prioritario activado
    expect(wp.options[0].isPriorityAccess).toBe(true);
    expect(wp.options[0].placementTrigger).toBe('HIGH_QUEUE_MONUMENT');
    expect(wp.options[0].ctaLabel).toBe('Asegurar Entrada');
    expect(wp.options[0].description).toContain('Aforo crítico');
  });

  it('debe alertar de carteristas en nivel EXTREME en Las Ramblas tanto en Base como en S+ Grade (Táctica del Refugio)', async () => {
    const ramblaWp = new TacticalWaypoint(
      'wp-rambla',
      'Paseo de Las Ramblas y Mercado de la Boquería',
      'Paseo histórico por el centro',
      undefined,
      new TimeSpan('17:00', '19:00'),
    );

    const route = new TacticalRoute('route-rambla', 'Ruta Ramblas', [ramblaWp]);

    const enrichedBase = await enricher.enrichRoute(route, 'operational');
    expect(enrichedBase.waypoints[0].tacticalMetadata?.microLogistics?.pickpocketAlertLevel).toBe('EXTREME');

    const enrichedSat = await enricher.enrichRoute(route, 'saturated');
    expect(enrichedSat.waypoints[0].tacticalMetadata?.microLogistics?.pickpocketAlertLevel).toBe('EXTREME');
    expect(enrichedSat.waypoints[0].tacticalMetadata?.antiTrapShield?.recommendedAlternatives.length).toBeGreaterThan(0);
  });

  it('debe manejar waypoints generales sin proveedor de afiliados de forma segura', async () => {
    const generalWaypoint = new TacticalWaypoint(
      'wp-3',
      'Passeig Marítim del Bogatell',
      'Paseo relajado frente al mar Mediterráneo',
      undefined,
      new TimeSpan('18:00', '19:30'),
    );

    const route = new TacticalRoute('route-3', 'Paseo Costero', [generalWaypoint]);

    const enriched = await enricher.enrichRoute(route);

    const wp = enriched.waypoints[0];
    expect(wp.category).toBe('ACTIVITY');
    expect(wp.affiliateProvider).toBe('NONE');
    expect(wp.affiliateUrl).toBeUndefined();
    expect(wp.options).toHaveLength(2);
  });
});
