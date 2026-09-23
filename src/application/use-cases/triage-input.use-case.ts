import { ITriageInputUseCasePort } from '@/application/ports/in/triage-input.use-case.port';
import { ITypedDecisionEngine } from '@/application/ports/out/ITypedDecisionEngine';
import { IConversationalSLMPort } from '@/application/ports/out/conversational-slm.port';
import { DensityMatrixRepositoryPort } from '@/application/ports/out/density-matrix-repository.port';
import { TelemetryRepositoryPort } from '@/application/ports/out/telemetry-repository.port';
import { GenerateTacticalRouteUseCase } from './generate-tactical-route.use-case';
import {
  TriageInputDto,
  TriageInputSchema,
} from '@/domain/schemas/triage.schema';
import {
  calculateMatrixDensity,
  DefaultDensityPayload,
} from '@/domain/schemas/matrix';
import { TriageOutcome } from '@/domain/value-objects/triage-outcome.vo';
import { TelemetryEntry } from '@/domain/entities/telemetry-entry.entity';

/**
 * Caso de Uso: Aduana Universal y Triaje Entrópico (HU-CORE-TRIAGE-002).
 *
 * Refactorizado bajo:
 * - Laudo 1 (Unificación de la Aduana): Si la matriz alcanza el umbral (>= 60%),
 *   despacha internamente la ejecución hacia GenerateTacticalRouteUseCase (Gemini).
 * - Laudo 2 (Gobernanza del Estado Multivuelta): El estado acumulado se recupera
 *   y persiste soberanamente en el backend vía DensityMatrixRepositoryPort ligado a bx_session_id.
 */
export class TriageInputUseCase implements ITriageInputUseCasePort {
  private static readonly FORBIDDEN_GEO_PATTERNS = [
    'madrid',
    'valencia',
    'sevilla',
    'bilbao',
    'zaragoza',
    'málaga',
    'malaga',
    'girona',
    'tarragona',
    'lleida',
    'sitges',
    'paris',
    'roma',
    'londres',
  ];

  constructor(
    private readonly decisionEngine: ITypedDecisionEngine,
    private readonly conversationalSlm: IConversationalSLMPort,
    private readonly matrixRepo: DensityMatrixRepositoryPort,
    private readonly routeUseCase?: GenerateTacticalRouteUseCase,
    private readonly telemetryRepo?: TelemetryRepositoryPort,
  ) {}

  async execute(rawInput: TriageInputDto): Promise<TriageOutcome> {
    const startTime = Date.now();
    const input = TriageInputSchema.parse(rawInput);
    const trimmedPrompt = input.prompt.trim();
    const matrixId = input.matrixId || 'default';

    // 1. Laudo 2: Recuperación soberana del estado previo desde la persistencia del backend
    const priorPayload =
      (await this.matrixRepo.getMatrixPayload(input.sessionId, matrixId)) ?? {};

    // 2. Preparar contexto inmutable para Jev AI (System One)
    const stateContext = JSON.stringify({
      sessionId: input.sessionId,
      prompt: trimmedPrompt,
      matrixId,
      accumulated: priorPayload,
    });

    // 3. Evaluación Perimetral (System One - Scope Barcelona)
    const isExplicitlyForeign = this.detectForbiddenEntity(trimmedPrompt);

    let isBarcelonaScope = true;
    let rejectedEntity = isExplicitlyForeign ?? undefined;

    if (isExplicitlyForeign) {
      isBarcelonaScope = false;
    } else {
      try {
        const scopeEval = await this.decisionEngine.evaluateNoul(
          stateContext,
          '¿La intención o consulta del usuario pertenece o se desarrolla dentro de la ciudad de Barcelona?',
          0.5,
        );
        isBarcelonaScope = scopeEval.isAffirmative;
        if (!isBarcelonaScope) {
          rejectedEntity = 'Ubicación foránea';
        }
      } catch (err: unknown) {
        // Política Fail-Soft (Assume-Barcelona-Default) ante degradación de Jev AI
        this.emitTelemetry({
          level: 'WARN',
          context: 'SECURITY_PERIMETER',
          message: `[Aduana Jev Fall-Soft] Fallo en motor de triaje. Activada política Assume-Barcelona-Default: ${err instanceof Error ? err.message : 'Error desconocido'}`,
          statusCode: 500,
          durationMs: Date.now() - startTime,
          payload: { prompt: trimmedPrompt, sessionId: input.sessionId },
        });
        isBarcelonaScope = true;
      }
    }

    // FLUJO 1: REBOTE GEOGRÁFICO (< 200 ms)
    if (!isBarcelonaScope) {
      const entityToBounce = rejectedEntity ?? 'Ubicación foránea';
      const bounceMessage = await this.conversationalSlm.generateBounceMessage(
        entityToBounce,
        trimmedPrompt,
      );
      const durationMs = Date.now() - startTime;

      this.emitTelemetry({
        level: 'WARN',
        context: 'SECURITY_PERIMETER',
        message: `[Aduana] Rebote geográfico táctico: '${entityToBounce}' fuera de perímetro`,
        statusCode: 422,
        durationMs,
        payload: {
          tag: 'GEOGRAPHIC_REBOUND',
          rejectedEntity: entityToBounce,
          prompt: trimmedPrompt,
          sessionId: input.sessionId,
        },
      });

      return TriageOutcome.createReboundOutOfScope({
        sessionId: input.sessionId,
        matrixId,
        bounceMessage,
        rejectedEntity: entityToBounce,
        durationMs,
      });
    }

    // 4. Extracción de Variables y Fusión con el Estado Previo
    const mergedPayload = await this.extractMatrixVariables(
      trimmedPrompt,
      stateContext,
      priorPayload,
    );

    // 5. Evaluación del Peaje Termodinámico (Reglas de Matriz HU 6)
    const density = calculateMatrixDensity(matrixId, mergedPayload);

    // FLUJO 2A: REPREGUNTA ATÓMICA POR UMBRAL INSUFICIENTE (< 60%)
    if (!density.isThresholdSatisfied) {
      // Laudo 2: Persistir el progreso acumulado en el backend
      await this.matrixRepo.saveMatrixPayload(
        input.sessionId,
        matrixId,
        mergedPayload,
      );

      const missingVar = density.highestMissingVariable ?? 'time_window';
      const repromptMessage =
        await this.conversationalSlm.generateRepromptMessage(
          missingVar,
          trimmedPrompt,
          JSON.stringify(mergedPayload),
        );

      const durationMs = Date.now() - startTime;
      return TriageOutcome.createIncompleteReprompt({
        sessionId: input.sessionId,
        matrixId,
        score: density.score,
        survivalThreshold: density.survivalThreshold,
        missingVariable: missingVar,
        repromptMessage,
        partialPayload: mergedPayload,
        durationMs,
      });
    }

    // FLUJO 2B: DESPACHO DIRECTO AL ORQUESTADOR PESADO (>= 60%)
    // Laudo 1: Despacho interno unificado hacia el orquestador pesado (Gemini)
    let forgedRoute: unknown = undefined;
    if (this.routeUseCase) {
      const enrichedPrompt = `[Geo: Barcelona] ${trimmedPrompt} | Contexto de Matriz: ${JSON.stringify(mergedPayload)}`;
      forgedRoute = await this.routeUseCase.execute({
        prompt: enrichedPrompt,
        environment: {
          localTime: new Date().toISOString(),
        },
      });
    }

    // Laudo 2: Limpieza de la matriz completada en la sesión
    await this.matrixRepo.clearMatrixPayload(input.sessionId, matrixId);

    const durationMs = Date.now() - startTime;
    return TriageOutcome.createDispatchReady({
      sessionId: input.sessionId,
      matrixId,
      score: density.score,
      survivalThreshold: density.survivalThreshold,
      payload: mergedPayload,
      route: forgedRoute,
      durationMs,
    });
  }

  private detectForbiddenEntity(prompt: string): string | null {
    const normalized = prompt.toLowerCase();
    for (const pattern of TriageInputUseCase.FORBIDDEN_GEO_PATTERNS) {
      const regex = new RegExp(`\\b${pattern}\\b`, 'i');
      if (regex.test(normalized)) {
        return pattern.charAt(0).toUpperCase() + pattern.slice(1);
      }
    }
    return null;
  }

  private async extractMatrixVariables(
    prompt: string,
    stateContext: string,
    priorPayload: Partial<DefaultDensityPayload>,
  ): Promise<DefaultDensityPayload> {
    const payload: DefaultDensityPayload = {
      constraints: [],
      ...priorPayload,
    };

    // 1. time_window (Vector Crítico de 60%)
    if (!payload.time_window) {
      const hasExplicitTime =
        /\b(\d+\s*(horas?|h|días?)|todo el \w+|por la (mañana|tarde|noche)|fin de semana|sábado|domingo|hoy|mañana)\b/i.test(
          prompt,
        );

      if (hasExplicitTime) {
        payload.time_window = prompt;
      } else {
        try {
          const evalResult = await this.decisionEngine.evaluateNoul(
            stateContext,
            '¿El usuario indica expresamente una ventana de tiempo, número de horas, día o momento para realizar el plan?',
            0.5,
          );
          if (evalResult.isAffirmative) {
            payload.time_window = prompt;
          }
        } catch {
          // Fail-soft en extracción heurística
        }
      }
    }

    // 2. group_size (15%)
    if (!payload.group_size) {
      const match = prompt.match(/\b(\d+)\s*(personas?|amigos?|pax)\b/i);
      if (match && match[1]) {
        payload.group_size = parseInt(match[1], 10);
      } else if (/\b(en pareja|con mi pareja|dos personas|con un amigo)\b/i.test(prompt)) {
        payload.group_size = 2;
      } else if (/\b(solo|sola|por mi cuenta)\b/i.test(prompt)) {
        payload.group_size = 1;
      }
    }

    // 3. vibe (15%)
    if (!payload.vibe) {
      const vibeMatch = prompt.match(
        /\b(modernis\w+|gótico|gotico|tapas|gastronom\w+|fiesta|nocturn\w+|cultural|relax|playa)\b/i,
      );
      if (vibeMatch) {
        payload.vibe = vibeMatch[0];
      }
    }

    return payload;
  }

  private emitTelemetry(params: {
    level: 'WARN' | 'ERROR';
    context: 'SECURITY_PERIMETER';
    message: string;
    statusCode: number;
    durationMs: number;
    payload: Record<string, unknown>;
  }): void {
    if (!this.telemetryRepo) return;

    const entry = new TelemetryEntry(
      params.level,
      params.context,
      params.message,
      params.payload,
      params.statusCode,
      params.durationMs,
    );

    this.telemetryRepo.log(entry).catch(() => {
      // Aislamiento perimetral silencioso
    });
  }
}
