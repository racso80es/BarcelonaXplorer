// ═══════════════════════════════════════════════════════════════
// Vertical Slice: Telegram / Reactive
// Puerto Primario: ReactivePatrolUseCasePort (Axioma V & HU-11)
// Marco Constitucional: Protocolo de Acero — Grado S+
// ═══════════════════════════════════════════════════════════════

import { OperationEnvelope } from '@/shared/operation-envelope';
import { ReactiveDropResult } from './reactive-drops.schema';

export interface PatrolWaypointInput {
  readonly title: string;
  readonly lat?: number | null;
  readonly lng?: number | null;
  readonly isOutdoor?: boolean;
}

export interface PatrolEvaluationInput {
  readonly sessionId: string;
  readonly telegramChatId: string;
  readonly completedWaypoints: readonly PatrolWaypointInput[];
  readonly nextWaypoint?: PatrolWaypointInput | null;
  readonly fatigueThresholdKm?: number;
}

export interface IReactivePatrolUseCasePort {
  execute(input: PatrolEvaluationInput): Promise<OperationEnvelope<ReactiveDropResult>>;
}
