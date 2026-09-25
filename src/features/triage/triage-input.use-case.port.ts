import { TriageInputDto } from './triage.schema';
import { TriageOutcome } from './triage-outcome.vo';

export interface ITriageInputUseCasePort {
  execute(input: TriageInputDto): Promise<TriageOutcome>;
}
