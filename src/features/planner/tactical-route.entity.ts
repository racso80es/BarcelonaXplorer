import { DomainException } from '@/shared/exceptions/domain.exception';
import { InvalidCoordinatesException } from '@/shared/exceptions/invalid-coordinates.exception';
import { InvalidTimeSpanException } from '@/shared/exceptions/invalid-time-span.exception';

export class GeoCoordinates {
  constructor(
    public readonly lat: number,
    public readonly lng: number
  ) {
    if (lat < -90 || lat > 90) {
      throw new InvalidCoordinatesException(`latitud ${lat} fuera de rango [-90, 90]`);
    }
    if (lng < -180 || lng > 180) {
      throw new InvalidCoordinatesException(`longitud ${lng} fuera de rango [-180, 180]`);
    }
  }
}

export class TimeSpan {
  constructor(
    public readonly start: string,
    public readonly end?: string
  ) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(start)) {
      throw new InvalidTimeSpanException(`start '${start}' formato incorrecto (HH:MM esperado)`);
    }

    if (end) {
      if (!timeRegex.test(end)) {
        throw new InvalidTimeSpanException(`end '${end}' formato incorrecto (HH:MM esperado)`);
      }
      
      const startMinutes = this.toMinutes(start);
      const endMinutes = this.toMinutes(end);

      if (startMinutes > endMinutes) {
        throw new InvalidTimeSpanException(`start (${start}) no puede ser posterior a end (${end})`);
      }
    }
  }

  private toMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
  }
}

export class TacticalWaypoint {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly coordinates?: GeoCoordinates,
    public readonly timeSpan?: TimeSpan,
    public readonly recommendations: string[] = []
  ) {
    if (!id || !title || !description) {
      throw new DomainException('TacticalWaypoint: id, title, and description are required');
    }
  }
}

export class TacticalRoute {
  constructor(
    public readonly id: string,
    public readonly summary: string,
    public readonly waypoints: TacticalWaypoint[]
  ) {
    if (!id || !summary || !waypoints) {
      throw new DomainException('TacticalRoute: id, summary, and waypoints are required');
    }
  }
}
