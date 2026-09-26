import { z } from 'zod';

/**
 * Esquema de reglas termodinámicas de una matriz de densidad.
 * Define el umbral de supervivencia (peaje) y los pesos de cada variable.
 */
export const MatrixRuleSetSchema = z.object({
  survival_threshold: z.number().min(0).max(100),
  weights: z.record(z.string(), z.number().min(0).max(100)),
});

export type MatrixRuleSet = z.infer<typeof MatrixRuleSetSchema>;

/**
 * Esquema de carga útil (payload) para la Matriz de Exploración Urbana Base ('default').
 */
export const DefaultDensityPayloadSchema = z.object({
  time_window: z.string().optional(),
  group_size: z.number().int().positive().optional(),
  vibe: z.string().optional(),
  mood: z.enum(['relaxed', 'adventurous', 'cultural', 'gastronomic']).optional(),
  constraints: z.array(z.string()).optional().default([]),
  districts: z.array(z.string()).optional().default([]),
});

export type DefaultDensityPayload = z.infer<typeof DefaultDensityPayloadSchema>;

/**
 * Patrón Envelope para encapsular cualquier matriz instanciada.
 */
export const DensityMatrixEnvelopeSchema = z.object({
  matrix_id: z.string(),
  name: z.string(),
  description: z.string(),
  rules: MatrixRuleSetSchema,
  payload: DefaultDensityPayloadSchema,
});

export type DensityMatrixEnvelope = z.infer<typeof DensityMatrixEnvelopeSchema>;

/**
 * Registro (Registry) de Matrices de Densidad disponibles en el sistema.
 */
export const DENSITY_MATRIX_REGISTRY: Record<
  string,
  {
    name: string;
    description: string;
    rules: MatrixRuleSet;
  }
> = {
  default: {
    name: 'Exploración Urbana Base',
    description:
      'Matriz logística para itinerarios generales diurnos y urbanos en Barcelona.',
    rules: {
      survival_threshold: 60,
      weights: {
        time_window: 60,
        group_size: 15,
        vibe: 15,
        constraints: 10,
      },
    },
  },
  gastronomy: {
    name: 'Exploración Gastronómica',
    description:
      'Matriz especializada en rutas culinarias, tapas y restaurantes de Barcelona.',
    rules: {
      survival_threshold: 70,
      weights: {
        group_size: 40,
        time_window: 25,
        vibe: 20,
        constraints: 15,
      },
    },
  },
};

/**
 * Resultado del cálculo termodinámico de una matriz.
 */
export interface MatrixDensityEvaluation {
  readonly matrixId: string;
  readonly score: number;
  readonly survivalThreshold: number;
  readonly isThresholdSatisfied: boolean;
  readonly presentVariables: readonly string[];
  readonly missingVariables: readonly string[];
  readonly highestMissingVariable: string | null;
}

/**
 * Evalúa la saturación termodinámica de un payload frente a las reglas de la matriz indicada.
 */
export function calculateMatrixDensity(
  matrixId: string,
  payload: Record<string, unknown>,
): MatrixDensityEvaluation {
  const definition = DENSITY_MATRIX_REGISTRY[matrixId] ?? DENSITY_MATRIX_REGISTRY['default'];
  const { rules } = definition;

  let totalScore = 0;
  const presentVariables: string[] = [];
  const missingVariables: string[] = [];

  // Ordenar pesos descendentes para priorizar la variable con mayor impacto
  const sortedKeys = Object.keys(rules.weights).sort(
    (a, b) => (rules.weights[b] ?? 0) - (rules.weights[a] ?? 0),
  );

  for (const key of sortedKeys) {
    const val = payload[key];
    const isPresent =
      val !== undefined &&
      val !== null &&
      val !== '' &&
      (!Array.isArray(val) || val.length > 0);

    if (isPresent) {
      totalScore += rules.weights[key] ?? 0;
      presentVariables.push(key);
    } else {
      missingVariables.push(key);
    }
  }

  // Participación de mood como variable adaptativa con peso 10 si está en el payload
  if (payload.mood && !rules.weights['mood']) {
    totalScore += 10;
    presentVariables.push('mood');
  }

  // Normalizar score máximo a 100
  const normalizedScore = Math.min(totalScore, 100);
  const isThresholdSatisfied = normalizedScore >= rules.survival_threshold;
  const highestMissingVariable = missingVariables.length > 0 ? (missingVariables[0] ?? null) : null;

  return {
    matrixId,
    score: normalizedScore,
    survivalThreshold: rules.survival_threshold,
    isThresholdSatisfied,
    presentVariables,
    missingVariables,
    highestMissingVariable,
  };
}
