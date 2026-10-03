/**
 * Mapa de proceso en memoria para promesas en vuelo del Centinela de Presencia Jev (PBI-ARCH-JEV-005 y PBI-ARCH-JEV-006).
 *
 * Registra promesas asíncronas indexadas por la clave canónica `${sessionId}:${matrixId}`.
 * Permite que turnos posteriores o el despacho de ruta (join acotado) esperen la consolidación
 * paramétrica antes de invocar a Gemini.
 */
export const inFlightSentinelProbes = new Map<string, Promise<void>>();
