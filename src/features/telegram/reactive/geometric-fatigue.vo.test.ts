import { describe, it, expect } from 'vitest';
import { GeometricFatigueVo } from './geometric-fatigue.vo';

describe('GeometricFatigueVo (Protocolo de Acero - Grado S+)', () => {
  // Puntos icónicos de Barcelona:
  // Plaça Catalunya -> Sagrada Família (~2.5 km a pie)
  // Sagrada Família -> Park Güell (~2.4 km a pie)
  // Park Güell -> Casa Batlló (~2.8 km a pie)
  const plCatalunya = { lat: 41.387, lng: 2.1701, title: 'Plaça Catalunya' };
  const sagradaFamilia = { lat: 41.4036, lng: 2.1744, title: 'Sagrada Família' };
  const parkGuell = { lat: 41.4145, lng: 2.1527, title: 'Park Güell' };
  const casaBatllo = { lat: 41.3916, lng: 2.1648, title: 'Casa Batlló' };

  it('calcula la distancia geodésica Haversine de forma determinista entre dos puntos', () => {
    const dist = GeometricFatigueVo.calculateDistanceMeters(plCatalunya, sagradaFamilia);
    // Plaça Catalunya a Sagrada Família son aprox 1870-1900 m en línea recta geodésica
    expect(dist).toBeGreaterThan(1800);
    expect(dist).toBeLessThan(2000);
  });

  it('retorna 0 metros si hay menos de 2 waypoints', () => {
    const single = GeometricFatigueVo.create([plCatalunya]);
    expect(single.calculateTotalDistanceMeters()).toBe(0);
    expect(single.calculateTotalDistanceKm()).toBe(0);
    expect(single.isFatigueThresholdExceeded(5.0)).toBe(false);
  });

  it('calcula la distancia acumulada secuencial a través de múltiples waypoints', () => {
    const vo = GeometricFatigueVo.create([
      plCatalunya,
      sagradaFamilia,
      parkGuell,
      casaBatllo,
    ]);

    const totalMeters = vo.calculateTotalDistanceMeters();
    const totalKm = vo.calculateTotalDistanceKm();

    // Suma geodésica de los 3 segmentos consecutivos: ~1.87 km + ~2.19 km + ~2.73 km ≈ 6.797 km
    expect(totalKm).toBeGreaterThan(6.0);
    expect(totalKm).toBe(6.8);
    expect(totalMeters).toBeCloseTo(6797.51, 1);
    expect(vo.isFatigueThresholdExceeded(5.0)).toBe(true);
  });

  it('reconoce cuando NO se supera el umbral de fatiga (ej. < 5.0 km)', () => {
    const vo = GeometricFatigueVo.create([plCatalunya, sagradaFamilia]);
    expect(vo.calculateTotalDistanceKm()).toBeLessThan(5.0);
    expect(vo.isFatigueThresholdExceeded(5.0)).toBe(false);
  });

  it('lanza error determinista si alguna coordenada está fuera de rango geográfico', () => {
    expect(() =>
      GeometricFatigueVo.create([{ lat: 95.0, lng: 2.17 }])
    ).toThrowError(/Latitud inválida/);

    expect(() =>
      GeometricFatigueVo.create([{ lat: 41.38, lng: 200.0 }])
    ).toThrowError(/Longitud inválida/);
  });
});
