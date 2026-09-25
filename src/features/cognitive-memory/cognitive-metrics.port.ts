export interface CognitiveMetricsSummary {
  readonly zeigarnikScore: number;           // % de sesiones que alcanzaron el peaje de supervivencia (>= 60%)
  readonly averageTurnsToSaturation: number; // Promedio de prompts/turnos requeridos para saturar la matriz
  readonly anchorRate: number;               // % de sesiones ancladas a Telegram
  readonly totalSessionsRecorded: number;    // Conteo total de sesiones analizadas
}

/**
 * Puerto de Salida Hexagonal para métricas analíticas de comportamiento (MySQL / Relacional).
 * 
 * Principio Red Teaming Anti-OOM:
 * Las agregaciones estadísticas (GROUP BY, COUNT, AVG) se resuelven en la base de datos relacional
 * mediante índices B-Tree, erradicando el uso de Array.reduce() en Node.js sobre LanceDB.
 */
export interface ICognitiveMetricsPort {
  /**
   * Computa los indicadores agregados en MySQL mediante consultas relacionales optimizadas.
   */
  getCognitiveMetrics(): Promise<CognitiveMetricsSummary>;
}
