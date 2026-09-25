import { describe, it, expect } from 'vitest';
import { HeuristicGeographicDecisionEngine } from './heuristic-geographic-decision-engine';

describe('HeuristicGeographicDecisionEngine (System One)', () => {
  const engine = new HeuristicGeographicDecisionEngine();

  it('debe aceptar peticiones implícitas como Barcelona por defecto (Fricción Cero)', async () => {
    const result = await engine.evaluateScope('Catas de vino, teatro y evento deportivo');

    expect(result.is_barcelona_scope).toBe(true);
    expect(result.canonical_city).toBe('Barcelona');
    expect(result.detected_districts).toEqual([]);
    expect(result.out_of_scope_entity).toBeUndefined();
  });

  it('debe detectar desviaciones out-of-scope hacia Madrid u otras ciudades foráneas', async () => {
    const result = await engine.evaluateScope('Ruta por el centro de Madrid');

    expect(result.is_barcelona_scope).toBe(false);
    expect(result.out_of_scope_entity).toBe('Madrid');
  });

  it('debe bloquear actividades de ocio foráneas como Sitges bajo la regla de micro-logística', async () => {
    const result = await engine.evaluateScope('Quiero ir a la playa en Sitges');

    expect(result.is_barcelona_scope).toBe(false);
    expect(result.out_of_scope_entity).toBe('Sitges');
  });

  it('debe admitir el Aeropuerto de El Prat como infraestructura logística autorizada', async () => {
    const result = await engine.evaluateScope('Aterrizo en el Aeropuerto de El Prat');

    expect(result.is_barcelona_scope).toBe(true);
    expect(result.detected_districts).toContain('Aeropuerto de El Prat');
  });

  it('debe extraer distritos canónicos de Barcelona si se mencionan', async () => {
    const result = await engine.evaluateScope('Ruta gastronómica por Gràcia y Eixample');

    expect(result.is_barcelona_scope).toBe(true);
    expect(result.detected_districts).toContain('Gràcia');
    expect(result.detected_districts).toContain('Eixample');
  });
});
