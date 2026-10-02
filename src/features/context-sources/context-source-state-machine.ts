import { createErrorEnvelope, createSuccessEnvelope, OperationEnvelope } from '@/shared/operation-envelope';
import {
  ContextSourceSnapshot,
  ContextSourceStatus,
  StateMachineActor,
  StateMachineEvent,
  TransitionMetadata,
} from './context-source.types';

export interface TransitionRule {
  from: ContextSourceStatus;
  event: StateMachineEvent;
  actor: StateMachineActor;
  targetStatus: (source: ContextSourceSnapshot, meta?: TransitionMetadata) => ContextSourceStatus;
  applyMutation: (
    source: ContextSourceSnapshot,
    meta?: TransitionMetadata
  ) => Partial<ContextSourceSnapshot>;
}

/**
 * Matriz declarativa de transiciones de estado de fuentes de contexto (Axioma III).
 * Protocolo de Acero: Grado S+. Cero bifurcaciones if/else no controladas.
 */
export const CONTEXT_SOURCE_TRANSITIONS: readonly TransitionRule[] = [
  // 1. PENDING_APPROVAL + APPROVE por HUMAN -> ACTIVE
  {
    from: 'PENDING_APPROVAL',
    event: 'APPROVE',
    actor: 'HUMAN',
    targetStatus: () => 'ACTIVE',
    applyMutation: () => ({
      status: 'ACTIVE',
      failedAttempts: 0,
      lastError: null,
      lastErrorAt: null,
    }),
  },
  // 2. PENDING_APPROVAL + REJECT por HUMAN -> INACTIVE
  {
    from: 'PENDING_APPROVAL',
    event: 'REJECT',
    actor: 'HUMAN',
    targetStatus: () => 'INACTIVE',
    applyMutation: () => ({
      status: 'INACTIVE',
    }),
  },
  // 3. ACTIVE + INGEST_OK por CRON -> ACTIVE (reset de fallos)
  {
    from: 'ACTIVE',
    event: 'INGEST_OK',
    actor: 'CRON',
    targetStatus: () => 'ACTIVE',
    applyMutation: (_s, meta) => ({
      status: 'ACTIVE',
      failedAttempts: 0,
      lastSuccessAt: meta?.now ?? new Date(),
    }),
  },
  // 4 y 5. ACTIVE + INGEST_FAIL por CRON -> ACTIVE (fallos < 3) o DEGRADED (fallos >= 3)
  {
    from: 'ACTIVE',
    event: 'INGEST_FAIL',
    actor: 'CRON',
    targetStatus: (s) => (s.failedAttempts + 1 >= 3 ? 'DEGRADED' : 'ACTIVE'),
    applyMutation: (s, meta) => {
      const newAttempts = s.failedAttempts + 1;
      const newStatus: ContextSourceStatus = newAttempts >= 3 ? 'DEGRADED' : 'ACTIVE';
      return {
        status: newStatus,
        failedAttempts: newAttempts,
        lastErrorAt: meta?.now ?? new Date(),
        lastError: meta?.error ?? 'Error de ingesta no especificado',
      };
    },
  },
  // 6. DEGRADED + REACTIVATE por HUMAN -> ACTIVE
  {
    from: 'DEGRADED',
    event: 'REACTIVATE',
    actor: 'HUMAN',
    targetStatus: () => 'ACTIVE',
    applyMutation: () => ({
      status: 'ACTIVE',
      failedAttempts: 0,
      lastError: null,
      lastErrorAt: null,
    }),
  },
  // 7. DEGRADED + PROPOSE_CORRECTION por ARGOS -> DEGRADED (permanece DEGRADED)
  {
    from: 'DEGRADED',
    event: 'PROPOSE_CORRECTION',
    actor: 'ARGOS',
    targetStatus: () => 'DEGRADED',
    applyMutation: () => ({
      status: 'DEGRADED',
    }),
  },
  // 7b. DEGRADED + PROPOSE_CORRECTION por HUMAN -> PENDING_APPROVAL
  {
    from: 'DEGRADED',
    event: 'PROPOSE_CORRECTION',
    actor: 'HUMAN',
    targetStatus: () => 'PENDING_APPROVAL',
    applyMutation: () => ({
      status: 'PENDING_APPROVAL',
      failedAttempts: 0,
      lastError: null,
      lastErrorAt: null,
    }),
  },
  // 7c. PENDING_APPROVAL + PROPOSE_CORRECTION por HUMAN -> PENDING_APPROVAL
  {
    from: 'PENDING_APPROVAL',
    event: 'PROPOSE_CORRECTION',
    actor: 'HUMAN',
    targetStatus: () => 'PENDING_APPROVAL',
    applyMutation: () => ({
      status: 'PENDING_APPROVAL',
    }),
  },
  // 8a. ACTIVE + DEACTIVATE por HUMAN -> INACTIVE
  {
    from: 'ACTIVE',
    event: 'DEACTIVATE',
    actor: 'HUMAN',
    targetStatus: () => 'INACTIVE',
    applyMutation: () => ({
      status: 'INACTIVE',
    }),
  },
  // 8b. DEGRADED + DEACTIVATE por HUMAN -> INACTIVE
  {
    from: 'DEGRADED',
    event: 'DEACTIVATE',
    actor: 'HUMAN',
    targetStatus: () => 'INACTIVE',
    applyMutation: () => ({
      status: 'INACTIVE',
    }),
  },
  // 9. INACTIVE + REACTIVATE por HUMAN -> PENDING_APPROVAL
  {
    from: 'INACTIVE',
    event: 'REACTIVATE',
    actor: 'HUMAN',
    targetStatus: () => 'PENDING_APPROVAL',
    applyMutation: () => ({
      status: 'PENDING_APPROVAL',
      failedAttempts: 0,
      lastError: null,
      lastErrorAt: null,
    }),
  },
];

/**
 * Validador puro y ejecutor determinista de transiciones de estado.
 */
export function transitionContextSource(
  source: ContextSourceSnapshot,
  event: StateMachineEvent,
  actor: StateMachineActor,
  meta?: TransitionMetadata
): OperationEnvelope<ContextSourceSnapshot> {
  const rule = CONTEXT_SOURCE_TRANSITIONS.find(
    (r) => r.from === source.status && r.event === event && r.actor === actor
  );

  if (!rule) {
    return createErrorEnvelope(
      [
        `Transición ilegal: No está permitida la combinación estado='${source.status}', evento='${event}', actor='${actor}'`,
      ],
      422,
      'Transición de estado rechazada por la máquina de estados'
    );
  }

  const mutations = rule.applyMutation(source, meta);
  const updatedSnapshot: ContextSourceSnapshot = {
    ...source,
    ...mutations,
    updatedAt: meta?.now ?? new Date(),
  };

  // Blindaje ontológico: solo HUMAN puede llevar una fuente a ACTIVE
  if (updatedSnapshot.status === 'ACTIVE' && actor !== 'HUMAN' && source.status !== 'ACTIVE') {
    return createErrorEnvelope(
      ['Soberanía Biológica Violada: Solo el actor HUMAN puede promover una fuente a ACTIVE'],
      403,
      'Transición no autorizada'
    );
  }

  return createSuccessEnvelope(
    updatedSnapshot,
    `Transición completada: ${source.status} -> ${updatedSnapshot.status} por ${actor}`
  );
}

/**
 * Circuit Breaker Puro para procesos de ingesta (CA-4).
 * Evalúa el resultado de la ingesta de forma determinista y transiciona la fuente.
 */
export function applyIngestionResult(
  source: ContextSourceSnapshot,
  result: { success: boolean; error?: string },
  now = new Date()
): OperationEnvelope<ContextSourceSnapshot> {
  if (source.status !== 'ACTIVE') {
    return createErrorEnvelope(
      [`Solo las fuentes ACTIVE pueden procesar ingesta. Estado actual: ${source.status}`],
      422,
      'Fuente no activa para ingesta'
    );
  }

  const event: StateMachineEvent = result.success ? 'INGEST_OK' : 'INGEST_FAIL';
  return transitionContextSource(source, event, 'CRON', {
    now,
    error: result.error,
  });
}

/**
 * Predicado puro para determinar si una transición de estado es legal.
 */
export function canTransition(
  status: ContextSourceStatus,
  event: StateMachineEvent,
  actor: StateMachineActor
): boolean {
  return CONTEXT_SOURCE_TRANSITIONS.some(
    (r) => r.from === status && r.event === event && r.actor === actor
  );
}

/**
 * Aplica una transición retornando el snapshot mutado o lanzando error si es ilegal.
 */
export function applyTransition(
  source: ContextSourceSnapshot,
  event: StateMachineEvent,
  actor: StateMachineActor,
  meta?: TransitionMetadata
): ContextSourceSnapshot {
  const env = transitionContextSource(source, event, actor, meta);
  if (!env.success || !env.result) {
    throw new Error(env.errors?.join('; ') || 'Transición ilegal');
  }
  return env.result;
}

