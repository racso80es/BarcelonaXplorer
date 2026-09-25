import { TelemetryRepositoryPort } from './telemetry-repository.port';
import { RetentionRules } from './telemetry-entry.entity';

export interface PruneTelemetryResult {
  deletedCount: number;
  executedAt: Date;
  rulesApplied: RetentionRules;
}

/**
 * Caso de Uso: Poda Ontológica de Telemetría.
 * Aplica las políticas de ciclo de vida para salvaguardar el almacenamiento en el Nodo 11:
 * - Registros DEBUG e INFO: Máximo 7 días.
 * - Registros WARN y ERROR: Máximo 30 días.
 */
export class PruneTelemetryUseCase {
  constructor(private readonly telemetryRepository: TelemetryRepositoryPort) {}

  async execute(customRules?: RetentionRules): Promise<PruneTelemetryResult> {
    const rules: RetentionRules = {
      debugInfoMaxAgeDays: customRules?.debugInfoMaxAgeDays ?? 7,
      warnErrorMaxAgeDays: customRules?.warnErrorMaxAgeDays ?? 30,
    };

    const { deletedCount } = await this.telemetryRepository.prune(rules);

    return {
      deletedCount,
      executedAt: new Date(),
      rulesApplied: rules,
    };
  }
}
