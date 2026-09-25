import {
  GeographicValidationOutcome,
  ValidateGeographicScopeUseCasePort,
} from '@/application/ports/in/validate-geographic-scope.use-case.port';
import { GeographicDecisionEnginePort } from '@/application/ports/out/geographic-decision-engine.port';
import { GeographicBounceGeneratorPort } from '@/application/ports/out/geographic-bounce-generator.port';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { GeographicScope } from '@/domain/value-objects/geographic-scope.vo';
import {
  ValidateGeographicScopeInputDto,
  ValidateGeographicScopeInputSchema,
} from '@/domain/schemas/geographic-scope.schema';
import { TelemetryEntry } from '@/features/telemetry';

/**
 * Caso de Uso: Aduana Universal - Validación de Anclaje Geográfico (HU-PERIM-GEO-001).
 *
 * Implementa la doble vía operacional:
 * 1. Inyección Silenciosa (Fricción Cero) ante prompts implícitos o explícitos dentro de Barcelona.
 * 2. Rebote Táctico (< 200 ms) ante desviaciones fuera de perímetro, blindando a Gemini y LanceDB.
 * 3. Fail-Soft con política Assume-Barcelona-Default ante degradación del motor de inferencia rápida.
 */
export class ValidateGeographicScopeUseCase implements ValidateGeographicScopeUseCasePort {
  constructor(
    private readonly decisionEngine: GeographicDecisionEnginePort,
    private readonly bounceGenerator: GeographicBounceGeneratorPort,
    private readonly telemetryRepo?: TelemetryRepositoryPort,
  ) {}

  async execute(
    rawInput: ValidateGeographicScopeInputDto,
  ): Promise<GeographicValidationOutcome> {
    const startTime = Date.now();
    const input = ValidateGeographicScopeInputSchema.parse(rawInput);
    const trimmedPrompt = input.prompt.trim();

    try {
      const evaluation = await this.decisionEngine.evaluateScope(trimmedPrompt);

      if (evaluation.is_barcelona_scope) {
        const isExplicit =
          trimmedPrompt.toLowerCase().includes('barcelona') ||
          evaluation.detected_districts.length > 0;

        const scope = isExplicit
          ? GeographicScope.createExplicitInScope(
              evaluation.detected_districts,
              evaluation.confidence,
            )
          : GeographicScope.createImplicitBarcelona();

        const enrichedPrompt = isExplicit
          ? trimmedPrompt
          : `[Geo: Barcelona] ${trimmedPrompt}`;

        return {
          status: 'IN_SCOPE',
          scope,
          isImplicit: !isExplicit,
          enrichedPrompt,
        };
      }

      // Desvío geográfico detectado (Rebote Táctico)
      const durationMs = Date.now() - startTime;
      const rejectedEntity = evaluation.out_of_scope_entity || 'Ubicación foránea';
      const scope = GeographicScope.createOutOfScope(
        rejectedEntity,
        evaluation.confidence,
      );

      const bounceMessage = await this.bounceGenerator.generateBounceMessage(
        rejectedEntity,
        trimmedPrompt,
      );

      this.emitTelemetry({
        level: 'WARN',
        context: 'SECURITY_PERIMETER',
        message: `[Aduana] Rebote geográfico táctico: '${rejectedEntity}' fuera de perímetro | Prompt: ${trimmedPrompt.slice(0, 120)}`,
        statusCode: 422,
        durationMs,
        payload: {
          tag: 'GEOGRAPHIC_REBOUND',
          rejectedEntity,
          prompt: trimmedPrompt,
          confidence: evaluation.confidence,
        },
      });

      return {
        status: 'REJECTED_OUT_OF_SCOPE',
        scope,
        bounceMessage,
        rejectedEntity,
        durationMs,
      };
    } catch (error: unknown) {
      // Política Fail-Soft (Assume-Barcelona-Default) ante fallo del motor de triaje
      const durationMs = Date.now() - startTime;
      const fallbackScope = GeographicScope.createImplicitBarcelona();

      this.emitTelemetry({
        level: 'WARN',
        context: 'SECURITY_PERIMETER',
        message: `[Aduana] Fallo en motor de triaje geográfico. Activada política Assume-Barcelona-Default: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        statusCode: 500,
        durationMs,
        payload: {
          tag: 'GEOGRAPHIC_TRIAGE_DEGRADATION',
          prompt: trimmedPrompt,
        },
      });

      return {
        status: 'IN_SCOPE',
        scope: fallbackScope,
        isImplicit: true,
        enrichedPrompt: `[Geo: Barcelona] ${trimmedPrompt}`,
      };
    }
  }

  private emitTelemetry(params: {
    level: 'WARN' | 'ERROR';
    context: 'SECURITY_PERIMETER';
    message: string;
    statusCode: number;
    durationMs: number;
    payload: Record<string, unknown>;
  }): void {
    if (!this.telemetryRepo) return;

    const entry = new TelemetryEntry(
      params.level,
      params.context,
      params.message,
      params.payload,
      params.statusCode,
      params.durationMs,
    );

    this.telemetryRepo.log(entry).catch(() => {
      // Aislamiento perimetral silencioso para no bloquear el flujo de usuario
    });
  }
}
