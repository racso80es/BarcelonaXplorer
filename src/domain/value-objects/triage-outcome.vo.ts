import { TriageOutcomeDto, TriageStatus } from '../schemas/triage.schema';
import { DefaultDensityPayload } from '../schemas/matrix';
import { GeographicScope } from './geographic-scope.vo';

/**
 * Value Object inmutable que modela y encapsula el resultado de la Aduana Universal (HU-CORE-TRIAGE-002).
 * Gobernado por los Laudos 1 (Endpoint Único) y 2 (Gobernanza del Estado),
 * e integrando el anclaje perimetral de Barcelona (HU-PERIM-GEO-001).
 */
export class TriageOutcome {
  private constructor(
    public readonly status: TriageStatus,
    public readonly sessionId: string,
    public readonly matrixId: string,
    public readonly score: number,
    public readonly survivalThreshold: number,
    public readonly isThresholdSatisfied: boolean,
    public readonly bounceMessage?: string,
    public readonly repromptMessage?: string,
    public readonly missingVariable?: string,
    public readonly rejectedEntity?: string,
    public readonly payload?: DefaultDensityPayload,
    public readonly route?: unknown,
    public readonly geographicScope?: GeographicScope,
    public readonly detectedDistricts?: readonly string[],
    public readonly durationMs: number = 0,
  ) {
    if (this.detectedDistricts) {
      Object.freeze(this.detectedDistricts);
    }
    Object.freeze(this);
  }

  public get partialPayload(): DefaultDensityPayload | undefined {
    return this.payload;
  }

  public static createReboundOutOfScope(params: {
    sessionId: string;
    matrixId: string;
    bounceMessage: string;
    rejectedEntity?: string;
    geographicScope?: GeographicScope;
    durationMs: number;
  }): TriageOutcome {
    return new TriageOutcome(
      'REBOUND_OUT_OF_SCOPE',
      params.sessionId,
      params.matrixId,
      0,
      60,
      false,
      params.bounceMessage,
      undefined,
      undefined,
      params.rejectedEntity,
      undefined,
      undefined,
      params.geographicScope,
      undefined,
      params.durationMs,
    );
  }

  public static createIncompleteReprompt(params: {
    sessionId: string;
    matrixId: string;
    score: number;
    survivalThreshold: number;
    missingVariable: string;
    repromptMessage: string;
    partialPayload?: DefaultDensityPayload;
    geographicScope?: GeographicScope;
    detectedDistricts?: readonly string[];
    durationMs: number;
  }): TriageOutcome {
    return new TriageOutcome(
      'INCOMPLETE_REPROMPT',
      params.sessionId,
      params.matrixId,
      params.score,
      params.survivalThreshold,
      false,
      undefined,
      params.repromptMessage,
      params.missingVariable,
      undefined,
      params.partialPayload,
      undefined,
      params.geographicScope,
      params.detectedDistricts,
      params.durationMs,
    );
  }

  public static createDispatchReady(params: {
    sessionId: string;
    matrixId: string;
    score: number;
    survivalThreshold: number;
    payload: DefaultDensityPayload;
    route?: unknown;
    geographicScope?: GeographicScope;
    detectedDistricts?: readonly string[];
    durationMs: number;
  }): TriageOutcome {
    return new TriageOutcome(
      'DISPATCH_READY',
      params.sessionId,
      params.matrixId,
      params.score,
      params.survivalThreshold,
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      params.payload,
      params.route,
      params.geographicScope,
      params.detectedDistricts,
      params.durationMs,
    );
  }

  public toDto(): TriageOutcomeDto {
    return {
      status: this.status,
      sessionId: this.sessionId,
      matrixId: this.matrixId,
      score: this.score,
      survivalThreshold: this.survivalThreshold,
      isThresholdSatisfied: this.isThresholdSatisfied,
      bounceMessage: this.bounceMessage,
      repromptMessage: this.repromptMessage,
      missingVariable: this.missingVariable,
      rejectedEntity: this.rejectedEntity,
      detectedDistricts: this.detectedDistricts
        ? Array.from(this.detectedDistricts)
        : undefined,
      payload: this.payload,
      route: this.route,
      durationMs: this.durationMs,
    };
  }
}
