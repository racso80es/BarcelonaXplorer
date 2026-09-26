import { TriageOutcomeDto, TriageStatus } from './triage.schema';
import { DefaultDensityPayload } from '@/features/planner';
import { GeographicScope } from '@/features/planner';

/**
 * Value Object inmutable que modela y encapsula el resultado de la Aduana Universal.
 * Vertical Slicing: reside dentro de la feature triage.
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
    public readonly dialogueMessage?: string,
    public readonly missingVariable?: string,
    public readonly rejectedEntity?: string,
    public readonly payload?: DefaultDensityPayload | Partial<DefaultDensityPayload>,
    public readonly route?: unknown,
    public readonly itinerary?: unknown,
    public readonly geographicScope?: GeographicScope,
    public readonly detectedDistricts?: readonly string[],
    public readonly durationMs: number = 0,
  ) {
    if (this.detectedDistricts) {
      Object.freeze(this.detectedDistricts);
    }
    Object.freeze(this);
  }

  public get partialPayload(): DefaultDensityPayload | Partial<DefaultDensityPayload> | undefined {
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
      undefined,
      params.rejectedEntity,
      undefined,
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
    partialPayload?: DefaultDensityPayload | Partial<DefaultDensityPayload>;
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
      undefined,
      params.missingVariable,
      undefined,
      params.partialPayload,
      undefined,
      undefined,
      params.geographicScope,
      params.detectedDistricts,
      params.durationMs,
    );
  }

  public static createCasualDialogue(params: {
    sessionId: string;
    matrixId: string;
    dialogueMessage: string;
    score?: number;
    survivalThreshold?: number;
    partialPayload?: DefaultDensityPayload | Partial<DefaultDensityPayload>;
    geographicScope?: GeographicScope;
    detectedDistricts?: readonly string[];
    durationMs: number;
  }): TriageOutcome {
    return new TriageOutcome(
      'CASUAL_DIALOGUE',
      params.sessionId,
      params.matrixId,
      params.score ?? 0,
      params.survivalThreshold ?? 60,
      false,
      undefined,
      undefined,
      params.dialogueMessage,
      undefined,
      undefined,
      params.partialPayload,
      undefined,
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
    itinerary?: unknown;
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
      undefined,
      params.payload,
      params.route,
      params.itinerary,
      params.geographicScope,
      params.detectedDistricts,
      params.durationMs,
    );
  }

  public static fromDto(dto: TriageOutcomeDto): TriageOutcome {
    return new TriageOutcome(
      dto.status,
      dto.sessionId,
      dto.matrixId,
      dto.score,
      dto.survivalThreshold,
      dto.isThresholdSatisfied,
      dto.bounceMessage,
      dto.repromptMessage,
      dto.dialogueMessage,
      dto.missingVariable,
      dto.rejectedEntity,
      dto.payload,
      dto.route,
      dto.itinerary,
      undefined,
      dto.detectedDistricts,
      dto.durationMs,
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
      dialogueMessage: this.dialogueMessage,
      missingVariable: this.missingVariable,
      rejectedEntity: this.rejectedEntity,
      detectedDistricts: this.detectedDistricts
        ? Array.from(this.detectedDistricts)
        : undefined,
      payload: this.payload,
      route: this.route,
      itinerary: this.itinerary,
      durationMs: this.durationMs,
    };
  }
}
