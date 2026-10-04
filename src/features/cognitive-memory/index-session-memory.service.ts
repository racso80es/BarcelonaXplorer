import {
  OperationEnvelope,
  createSuccessEnvelope,
} from '@/shared/operation-envelope';
import { ICognitiveMemoryPort } from './cognitive-memory.port';
import { IEmbeddingPort } from '@/features/ai-engine';
import { TelemetryRepositoryPort, TelemetryEntry } from '@/features/telemetry';
import { DenseSemanticMatrix } from './dense-semantic-matrix.vo';
import { TriageStatus } from '@/features/triage/triage.schema';

export type MemoryIndexingOutcome =
  | 'INDEXED'
  | 'DISCARDED_FALLBACK'
  | 'SKIPPED_UNCHANGED'
  | 'SKIPPED_POLICY'
  | 'SKIPPED_EMPTY'
  | 'FAILED';

export interface MemoryIndexingResult {
  outcome: MemoryIndexingOutcome;
  sessionId: string;
  matrixId: string;
  vector?: number[];
  error?: string;
}

/**
 * Matriz declarativa de indexabilidad de estados de triaje (PBI-MEM-001 CA-1).
 */
export const COGNITIVE_MEMORY_INDEXING_POLICY: Record<
  TriageStatus,
  { indexable: boolean }
> = {
  DISPATCH_READY: { indexable: true },
  DISPATCH_CLAUDICATION: { indexable: true },
  INCOMPLETE_REPROMPT: { indexable: true },
  CASUAL_DIALOGUE: { indexable: false },
  REBOUND_OUT_OF_SCOPE: { indexable: false },
};

/**
 * Servicio de Indexación Explícita de Memoria de Sesión (PBI-MEM-001 CA-2).
 * Aplica Pure DI y retorna un sobre tipado OperationEnvelope<MemoryIndexingResult>.
 */
export class IndexSessionMemoryService {
  constructor(
    private readonly cognitiveMemory?: ICognitiveMemoryPort | null,
    private readonly embeddingPort?: IEmbeddingPort | null,
    private readonly telemetryRepo?: TelemetryRepositoryPort | null,
  ) {}

  public async index(
    matrix: DenseSemanticMatrix,
    status: TriageStatus,
    priorPayload?: Record<string, unknown> | null,
  ): Promise<OperationEnvelope<MemoryIndexingResult>> {
    const startTime = Date.now();
    const sessionId = matrix.propsSnapshot.sessionId;
    const matrixId = matrix.propsSnapshot.matrixId;

    // 1. Verificación de dependencias y política declarativa (CA-1)
    if (!this.cognitiveMemory || !this.embeddingPort || !COGNITIVE_MEMORY_INDEXING_POLICY[status]?.indexable) {
      return createSuccessEnvelope({
        outcome: 'SKIPPED_POLICY',
        sessionId,
        matrixId,
      });
    }

    // 2. Verificación de contenido vacío (CA-3)
    const denseString = matrix.toDensePromptString();
    if (denseString === '[Contexto: Base]') {
      return createSuccessEnvelope({
        outcome: 'SKIPPED_EMPTY',
        sessionId,
        matrixId,
      });
    }

    // En INCOMPLETE_REPROMPT, requiere al menos una variable duradera (CA-3)
    if (status === 'INCOMPLETE_REPROMPT' && !this.hasDurableVariables(matrix)) {
      return createSuccessEnvelope({
        outcome: 'SKIPPED_EMPTY',
        sessionId,
        matrixId,
      });
    }

    // 3. Deduplicación ante payload previo sin cambios (CA-5)
    if (priorPayload && Object.keys(priorPayload).length > 0) {
      const priorMatrix = DenseSemanticMatrix.create({
        sessionId,
        matrixId,
        payload: priorPayload,
      });
      if (denseString === priorMatrix.toDensePromptString()) {
        return createSuccessEnvelope({
          outcome: 'SKIPPED_UNCHANGED',
          sessionId,
          matrixId,
        });
      }
    }

    // 4. Vectorización del contenido denso
    let embeddingEnvelope;
    try {
      embeddingEnvelope = await this.embeddingPort.generateEmbedding(denseString);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await this.emitTelemetry(
        'WARN',
        'LLM_ENGINE',
        `[Cognitive Memory] Fallo al generar embedding: ${errorMsg}`,
        {
          eventType: 'COGNITIVE_MEMORY_INDEXING',
          outcome: 'FAILED',
          sessionId,
          matrixId,
          error: errorMsg,
        },
        500,
        Date.now() - startTime,
      );

      return {
        success: false,
        exitCode: 1,
        result: {
          outcome: 'FAILED',
          sessionId,
          matrixId,
          error: errorMsg,
        },
        errors: [errorMsg],
        feedback: errorMsg,
      };
    }

    // 5. Fail-closed de persistencia ante embedding no disponible / fallo del sobre (CA-4)
    if (!embeddingEnvelope.success || !embeddingEnvelope.result) {
      await this.emitTelemetry(
        'WARN',
        'LLM_ENGINE',
        `[Cognitive Memory] Embedding no disponible; descartado de persistencia para sesión ${sessionId}`,
        {
          eventType: 'COGNITIVE_MEMORY_INDEXING',
          outcome: 'DISCARDED_FALLBACK',
          sessionId,
          matrixId,
        },
        422,
        Date.now() - startTime,
      );

      return createSuccessEnvelope({
        outcome: 'DISCARDED_FALLBACK',
        sessionId,
        matrixId,
      });
    }

    // 6. Persistencia en LanceDB con Fail-Soft (CA-6)
    try {
      await this.cognitiveMemory.persistMemory(matrix, embeddingEnvelope.result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await this.emitTelemetry(
        'WARN',
        'SECURITY_PERIMETER',
        `[Triage Fail-Soft] No se pudo persistir memoria cognitiva en LanceDB: ${errorMsg}`,
        {
          eventType: 'COGNITIVE_MEMORY_INDEXING',
          outcome: 'FAILED',
          sessionId,
          matrixId,
          error: errorMsg,
        },
        500,
        Date.now() - startTime,
      );

      return {
        success: false,
        exitCode: 1,
        result: {
          outcome: 'FAILED',
          sessionId,
          matrixId,
          error: errorMsg,
        },
        errors: [errorMsg],
        feedback: `[Triage Fail-Soft] No se pudo persistir memoria cognitiva en LanceDB: ${errorMsg}`,
      };
    }

    // 7. Telemetría de éxito (CA-7)
    await this.emitTelemetry(
      'INFO',
      'LLM_ENGINE',
      `[Cognitive Memory] Memoria indexada exitosamente para sesión ${sessionId}`,
      {
        eventType: 'COGNITIVE_MEMORY_INDEXING',
        outcome: 'INDEXED',
        sessionId,
        matrixId,
      },
      200,
      Date.now() - startTime,
    );

    return createSuccessEnvelope({
      outcome: 'INDEXED',
      sessionId,
      matrixId,
      vector: embeddingEnvelope.result,
    });
  }

  private hasDurableVariables(matrix: DenseSemanticMatrix): boolean {
    const props = matrix.propsSnapshot as Record<string, unknown>;
    const hasGroup = props.groupSize !== undefined && props.groupSize !== null;
    const hasVibe = typeof props.vibe === 'string' && props.vibe.trim().length > 0;
    const hasConstraints = Array.isArray(props.constraints) && props.constraints.length > 0;
    const hasDistricts = Array.isArray(props.districts) && props.districts.length > 0;
    const hasMood = typeof props.mood === 'string' && props.mood.trim().length > 0;
    return Boolean(hasGroup || hasVibe || hasConstraints || hasDistricts || hasMood);
  }

  private async emitTelemetry(
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
    context: 'LLM_ENGINE' | 'SECURITY_PERIMETER' | 'SYSTEM' | 'CLIENT_UI' | 'SERVER_API',
    message: string,
    payload?: Record<string, unknown>,
    statusCode?: number,
    durationMs?: number,
  ): Promise<void> {
    if (!this.telemetryRepo) return;
    try {
      await this.telemetryRepo.log(
        new TelemetryEntry(level, context, message, payload, statusCode, durationMs),
      );
    } catch {
      // Ignorar fallos en el bus de telemetría
    }
  }
}
