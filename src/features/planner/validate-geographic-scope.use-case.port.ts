import { GeographicScope } from './geographic-scope.vo';
import type { ValidateGeographicScopeInputDto } from './geographic-scope.schema';

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
