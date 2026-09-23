import { GeographicScopeResultDto } from '@/domain/schemas/geographic-scope.schema';

/**
 * Puerto de salida para el Motor de Decisión Determinista (System One / Jev AI).
 *
 * Evalúa con latencia ultrabaja (< 200 ms) si el prompt del usuario
 * se circunscribe al perímetro ontológico de Barcelona o detecta entidades foráneas.
 */
export interface GeographicDecisionEnginePort {
  evaluateScope(prompt: string): Promise<GeographicScopeResultDto>;
}
