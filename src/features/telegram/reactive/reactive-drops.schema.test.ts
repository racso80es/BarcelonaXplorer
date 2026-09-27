import { describe, it, expect } from 'vitest';
import {
  FatigueReliefDropPayloadSchema,
  WeatherShelterDropPayloadSchema,
  ReactiveDropEventSchema,
} from './reactive-drops.schema';
import {
  INDOOR_TACTICAL_SHELTERS,
  findNearestIndoorShelter,
} from './indoor-tactical-shelters';

describe('Reactive Drops Schemas & Indoor Shelters (S+ Grade)', () => {
  it('valida un payload de drop de fatiga con URL CPA legítima', () => {
    const validFatiguePayload = {
      accumulatedKm: 5.4,
      targetWaypointTitle: 'Castell de Montjuïc',
      mobilityProvider: 'CABIFY' as const,
      cpaUrl: 'https://cabify.com/es/promos?code=BCNXPLORER&discount=15',
      discountText: '15% de descuento en tu viaje',
      messageText:
        'Llevas mucha tralla en las piernas. Si quieres saltarte la caminata hasta Castell de Montjuïc, aquí tienes un Cabify con descuento.',
    };

    const parsed = FatigueReliefDropPayloadSchema.parse(validFatiguePayload);
    expect(parsed.accumulatedKm).toBe(5.4);
    expect(parsed.mobilityProvider).toBe('CABIFY');
  });

  it('rechaza un drop de fatiga si la URL es inválida', () => {
    const invalidPayload = {
      accumulatedKm: 5.4,
      targetWaypointTitle: 'Montjuïc',
      mobilityProvider: 'CABIFY' as const,
      cpaUrl: 'not-a-valid-url',
      discountText: '15%',
      messageText: 'Mensaje de prueba',
    };

    expect(() =>
      FatigueReliefDropPayloadSchema.parse(invalidPayload)
    ).toThrow();
  });

  it('valida un payload de refugio ambiental por lluvia', () => {
    const validWeatherPayload = {
      currentWeatherSummary: 'Lluvia moderada inminente',
      estimatedRainMinutes: 15,
      shelterName: 'Casa Batlló',
      shelterDescription: 'Icono modernista cubierto en Passeig de Gràcia.',
      shelterCoordinates: { lat: 41.3916, lng: 2.1648 },
      cpaUrl:
        'https://www.civitatis.com/es/barcelona/entrada-casa-batllo/?aid=bcn_xplorer',
      messageText:
        '⚠️ Lluvia inminente en 15 minutos. Cancela el mirador y refúgiate en Casa Batlló.',
    };

    const parsed = WeatherShelterDropPayloadSchema.parse(validWeatherPayload);
    expect(parsed.shelterName).toBe('Casa Batlló');
    expect(parsed.estimatedRainMinutes).toBe(15);
  });

  it('valida el evento reactivo completo con discriminador', () => {
    const event = {
      type: 'FATIGUE_RELIEF' as const,
      sessionId: 'sess_12345',
      telegramChatId: 'chat_999888',
      timestamp: Date.now(),
      fatiguePayload: {
        accumulatedKm: 6.1,
        targetWaypointTitle: 'Park Güell',
        mobilityProvider: 'CABIFY' as const,
        cpaUrl: 'https://cabify.com/es/promo',
        discountText: '10%',
        messageText: 'Alivio por fatiga activado.',
      },
    };

    const parsed = ReactiveDropEventSchema.parse(event);
    expect(parsed.type).toBe('FATIGUE_RELIEF');
    expect(parsed.telegramChatId).toBe('chat_999888');
  });

  it('encuentra de forma determinista el refugio interior más cercano', () => {
    // Coordenadas muy próximas a Casa Batlló (Passeig de Gràcia con C/ Aragó)
    const nearBatllo = { lat: 41.391, lng: 2.164 };
    const nearest = findNearestIndoorShelter(nearBatllo);
    expect(nearest.name).toBe('Casa Batlló');

    // Coordenadas muy próximas a Museu Picasso (El Born / Santa Maria del Mar)
    const nearBorn = { lat: 41.384, lng: 2.181 };
    const nearestBorn = findNearestIndoorShelter(nearBorn);
    expect(nearestBorn.name).toBe('Museu Picasso (El Born)');
  });

  it('verifica que todos los refugios del catálogo tienen URLs y coordenadas válidas', () => {
    expect(INDOOR_TACTICAL_SHELTERS.length).toBeGreaterThan(3);
    for (const shelter of INDOOR_TACTICAL_SHELTERS) {
      expect(shelter.lat).toBeGreaterThan(41.0);
      expect(shelter.lat).toBeLessThan(42.0);
      expect(shelter.lng).toBeGreaterThan(2.0);
      expect(shelter.lng).toBeLessThan(2.3);
      expect(shelter.cpaUrl).toMatch(/^https:\/\//);
    }
  });
});
