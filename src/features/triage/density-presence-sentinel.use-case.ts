import { ITypedDecisionEngine } from '@/features/ai-engine';
import { OperationEnvelope, createSuccessEnvelope } from '@/shared/operation-envelope';
import {
  DensityPresenceProbe,
  DensityPresenceProbeSchema,
} from './density-presence-probe.schema';

/**
 * Matriz declarativa de directrices para la sonda de presencia logística (PBI-ARCH-JEV-003).
 */
export const DENSITY_SENTINEL_PROBES = [
  {
    key: 'has_time_window',
    instruction:
      '¿El usuario indica expresamente una ventana de tiempo, número de horas, día o momento para realizar el plan?',
    threshold: 0.5,
  },
  {
    key: 'has_group_size',
    instruction:
      '¿El usuario indica expresamente cuántas personas viajan o un tamaño de grupo?',
    threshold: 0.5,
  },
  {
    key: 'has_vibe',
    instruction:
      '¿El usuario indica expresamente el tipo de ambiente o vibra que busca en la salida?',
    threshold: 0.5,
  },
  {
    key: 'has_constraints',
    instruction:
      '¿El usuario indica expresamente una restricción práctica de la salida (ritmo, presupuesto relativo, accesibilidad)?',
    threshold: 0.5,
  },
] as const;

/**
 * Caso de Uso: Centinela de Presencia Jev en Paralelo (PBI-ARCH-JEV-003).
 *
 * Ejecuta cuatro sondas evaluateNoul concurrentes para determinar la presencia de variables
 * logísticas sin conversación, sin texto libre y con política fail-soft (ausencia de Jev
 * no inventa presencia).
 */
export class DensityPresenceSentinel {
  constructor(private readonly decisionEngine: ITypedDecisionEngine) {}

  async probe(prompt: string): Promise<OperationEnvelope<DensityPresenceProbe>> {
    const probePromises = DENSITY_SENTINEL_PROBES.map(async (probe) => {
      try {
        const evaluation = await this.decisionEngine.evaluateNoul(
          prompt,
          probe.instruction,
          probe.threshold,
        );
        return [probe.key, Boolean(evaluation.isAffirmative)] as const;
      } catch {
        // Toda excepción en una sonda se degrada a false (fail-soft)
        return [probe.key, false] as const;
      }
    });

    const settledResults = await Promise.all(probePromises);

    const probeRecord: Record<string, boolean> = {};
    for (const [key, isPresent] of settledResults) {
      probeRecord[key] = isPresent;
    }

    const validatedProbe = DensityPresenceProbeSchema.parse(probeRecord);
    return createSuccessEnvelope(validatedProbe);
  }
}
