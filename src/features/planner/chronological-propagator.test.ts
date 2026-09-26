import { describe, it, expect } from 'vitest';
import { ChronologicalPropagator } from './chronological-propagator';

describe('ChronologicalPropagator (Protocolo de Acero S+)', () => {
  const initialWaypoints = [
    {
      id: 'wp-1',
      title: 'Desayuno en Gràcia',
      timeSpan: { start: '09:00', end: '10:00' },
    },
    {
      id: 'wp-2',
      title: 'Park Güell',
      timeSpan: { start: '10:30', end: '12:00' }, // 30m gap
    },
    {
      id: 'wp-3',
      title: 'Almuerzo en Eixample',
      timeSpan: { start: '13:00', end: '14:30' }, // 60m gap
    },
  ];

  it('debe propagar el retraso de un nodo intermedio hacia los nodos posteriores manteniendo los intervalos de transición', () => {
    // Retrasar Park Güell de 10:30 a 11:30 (hasta 13:00)
    const result = ChronologicalPropagator.propagate(
      initialWaypoints,
      'wp-2',
      '11:30',
      '13:00',
    );

    // El primer nodo no se altera
    expect(result[0].timeSpan?.start).toBe('09:00');
    expect(result[0].timeSpan?.end).toBe('10:00');

    // El segundo nodo adopta la nueva hora
    expect(result[1].timeSpan?.start).toBe('11:30');
    expect(result[1].timeSpan?.end).toBe('13:00');

    // El tercer nodo propaga: 13:00 fin anterior + 60m gap original = 14:00 inicio, duración 90m = 15:30 fin
    expect(result[2].timeSpan?.start).toBe('14:00');
    expect(result[2].timeSpan?.end).toBe('15:30');
  });

  it('debe calcular la hora de fin por defecto si no se proporciona newEndTime', () => {
    // Almuerzo arranca a las 14:00 sin newEndTime (duración original era 90m)
    const result = ChronologicalPropagator.propagate(
      initialWaypoints,
      'wp-3',
      '14:00',
    );

    expect(result[2].timeSpan?.start).toBe('14:00');
    expect(result[2].timeSpan?.end).toBe('15:30');
  });

  it('debe lanzar error si el waypoint target no existe', () => {
    expect(() =>
      ChronologicalPropagator.propagate(initialWaypoints, 'wp-inexistente', '10:00'),
    ).toThrow(/no encontrado/);
  });

  it('debe lanzar error si newEndTime es anterior o igual a newStartTime', () => {
    expect(() =>
      ChronologicalPropagator.propagate(
        initialWaypoints,
        'wp-2',
        '12:00',
        '11:00',
      ),
    ).toThrow(/no puede ser anterior/);
  });

  it('debe limitar determinísticamente a 23:59 ante desbordamiento al final del día', () => {
    const lateWaypoints = [
      {
        id: 'wp-1',
        title: 'Cena tardía',
        timeSpan: { start: '22:30', end: '23:30' },
      },
      {
        id: 'wp-2',
        title: 'Copa nocturna',
        timeSpan: { start: '23:45', end: '23:59' },
      },
    ];

    const result = ChronologicalPropagator.propagate(
      lateWaypoints,
      'wp-1',
      '23:15',
      '23:55',
    );

    expect(result[0].timeSpan?.start).toBe('23:15');
    expect(result[0].timeSpan?.end).toBe('23:55');
    // wp-2 se limita a 23:59
    expect(result[1].timeSpan?.end).toBe('23:59');
  });
});
