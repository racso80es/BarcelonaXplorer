import { InvalidFastInsightException } from '@/shared/exceptions/invalid-fast-insight.exception';

export type FastInsightCategory = 'environmental' | 'security' | 'transit';
export type FastInsightSeverity = 1 | 2 | 3;

export class FastInsight {
  constructor(
    public readonly category: FastInsightCategory,
    public readonly observation: string,
    public readonly severityLevel: FastInsightSeverity
  ) {
    if (!category) throw new InvalidFastInsightException('category is required');
    if (!observation) throw new InvalidFastInsightException('observation is required');
    if (![1, 2, 3].includes(severityLevel)) {
      throw new InvalidFastInsightException('severityLevel must be 1, 2, or 3');
    }
  }
}
