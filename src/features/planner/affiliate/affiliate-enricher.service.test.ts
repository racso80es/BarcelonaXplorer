import { describe, it, expect } from 'vitest';
import { AffiliateEnricherService } from './affiliate-enricher.service';
import { TacticalRoute, TacticalWaypoint, TimeSpan } from '../tactical-route.entity';

describe('AffiliateEnricherService (Protocolo de Acero S+)', () => {
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

    const enriched = await enricher.enrichRoute(route);

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
  });

  it('debe enriquecer un waypoint cultural con Civitatis y generar 2 opciones viables', async () => {
    const culturalWaypoint = new TacticalWaypoint(
      'wp-2',
      'Basílica de la Sagrada Familia',
      'Obra maestra de Antoni Gaudí',
      undefined,
      new TimeSpan('10:00', '12:00'),
      ['Reservar acceso a las torres'],
    );

    const route = new TacticalRoute('route-2', 'Ruta Modernista', [culturalWaypoint]);

    const enriched = await enricher.enrichRoute(route);

    expect(enriched.waypoints).toHaveLength(1);
    const wp = enriched.waypoints[0];
    expect(wp.category).toBe('CULTURE');
    expect(wp.affiliateProvider).toBe('CIVITATIS');
    expect(wp.affiliateUrl).toContain('civitatis.com');
    expect(wp.affiliateUrl).toContain('Sagrada%20Familia');
    expect(wp.options).toHaveLength(2);
    expect(wp.options[0].provider).toBe('CIVITATIS');
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
