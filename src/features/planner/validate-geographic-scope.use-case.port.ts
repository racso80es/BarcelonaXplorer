import { GeographicScope } from '@/features/planner';
import { ValidateGeographicScopeInputDto } from '@/features/planner';

export type GeographicValidationOutcome =
  | {
      readonly status: 'IN_SCOPE';
      readonly scope: GeographicScope;
      readonly isImplicit: boolean;
      readonly enrichedPrompt: string;
    }
  | {
      readonly status: 'REJECTED_OUT_OF_SCOPE';
      readonly scope: GeographicScope;
      readonly bounceMessage: string;
      readonly rejectedEntity: string;
      readonly durationMs: number;
    };

export interface ValidateGeographicScopeUseCasePort {
  execute(input: ValidateGeographicScopeInputDto): Promise<GeographicValidationOutcome>;
}
