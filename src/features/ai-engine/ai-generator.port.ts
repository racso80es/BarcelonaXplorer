import { TacticalRoute } from '@/features/planner';

export interface AiGeneratorPort {
  generateTacticalRoute(prompt: string): Promise<TacticalRoute>;
}
