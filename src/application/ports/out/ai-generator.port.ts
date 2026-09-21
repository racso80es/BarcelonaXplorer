import { TacticalRoute } from '@/domain/entities/tactical-route.entity';

export interface AiGeneratorPort {
  generateTacticalRoute(prompt: string): Promise<TacticalRoute>;
}
