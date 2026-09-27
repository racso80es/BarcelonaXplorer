// ═══════════════════════════════════════════════════════════════
// Vertical Slice: Telegram / Reactive
// Value Object: GeometricFatigueVo (Cálculo Geodésico Determinista)
// Marco Constitucional: Protocolo de Acero — Grado S+
// ═══════════════════════════════════════════════════════════════

export interface WaypointCoordinate {
  readonly lat: number;
  readonly lng: number;
  readonly title?: string;
}

export class GeometricFatigueVo {
  private static readonly EARTH_RADIUS_METERS = 6371000;
  private readonly waypoints: readonly WaypointCoordinate[];

  private constructor(waypoints: readonly WaypointCoordinate[]) {
    this.waypoints = Object.freeze([...waypoints]);
  }

  public static create(waypoints: readonly WaypointCoordinate[]): GeometricFatigueVo {
    for (const wp of waypoints) {
      if (
        typeof wp.lat !== 'number' ||
        Number.isNaN(wp.lat) ||
        wp.lat < -90 ||
        wp.lat > 90
      ) {
        throw new Error(`Latitud inválida en waypoint: ${wp.lat}`);
      }
      if (
        typeof wp.lng !== 'number' ||
        Number.isNaN(wp.lng) ||
        wp.lng < -180 ||
        wp.lng > 180
      ) {
        throw new Error(`Longitud inválida en waypoint: ${wp.lng}`);
      }
    }
    return new GeometricFatigueVo(waypoints);
  }

  /**
   * Calcula la distancia Haversine determinista entre dos puntos geodésicos en metros.
   */
  public static calculateDistanceMeters(
    p1: { lat: number; lng: number },
    p2: { lat: number; lng: number }
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(p2.lat - p1.lat);
    const dLng = toRad(p2.lng - p1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(p1.lat)) *
        Math.cos(toRad(p2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(GeometricFatigueVo.EARTH_RADIUS_METERS * c * 100) / 100;
  }

  /**
   * Retorna la distancia acumulada recorrida a lo largo de la secuencia de coordenadas en metros.
   */
  public calculateTotalDistanceMeters(): number {
    if (this.waypoints.length < 2) {
      return 0;
    }

    let total = 0;
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      total += GeometricFatigueVo.calculateDistanceMeters(
        this.waypoints[i],
        this.waypoints[i + 1]
      );
    }
    return Math.round(total * 100) / 100;
  }

  /**
   * Retorna la distancia acumulada en kilómetros con dos decimales de precisión.
   */
  public calculateTotalDistanceKm(): number {
    return Math.round((this.calculateTotalDistanceMeters() / 1000) * 100) / 100;
  }

  /**
   * Evalúa si la fatiga acumulada supera el umbral configurado (por defecto 5.0 km).
   */
  public isFatigueThresholdExceeded(thresholdKm = 5.0): boolean {
    return this.calculateTotalDistanceKm() >= thresholdKm;
  }

  public getWaypointsCount(): number {
    return this.waypoints.length;
  }
}
