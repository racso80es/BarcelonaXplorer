import { ITriageInputUseCasePort } from './triage-input.use-case.port';
import { ITypedDecisionEngine } from '@/application/ports/out/ITypedDecisionEngine';
import { IConversationalSLMPort } from '@/application/ports/out/conversational-slm.port';
import { DensityMatrixRepositoryPort } from '@/application/ports/out/density-matrix-repository.port';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { GeographicDecisionEnginePort } from '@/application/ports/out/geographic-decision-engine.port';
import { HeuristicGeographicDecisionEngine } from '@/infrastructure/ai/rules/heuristic-geographic-decision-engine';
import { GenerateTacticalRouteUseCase } from '@/application/use-cases/generate-tactical-route.use-case';
import {
  TriageInputDto,
  TriageInputSchema,
} from './triage.schema';
import {
  calculateMatrixDensity,
  DefaultDensityPayload,
} from '@/domain/schemas/matrix';
import { TriageOutcome } from './triage-outcome.vo';
import { GeographicScope } from '@/domain/value-objects/geographic-scope.vo';
import { TelemetryEntry } from '@/features/telemetry';

import { ICognitiveMemoryPort } from '@/application/ports/out/cognitive-memory.port';
import { IEmbeddingPort } from '@/application/ports/out/embedding.port';
import { DenseSemanticMatrix } from '@/domain/value-objects/dense-semantic-matrix.vo';

/**
 * Caso de Uso: Aduana Universal y Triaje Entrópico (HU-CORE-TRIAGE-002 / PBI-COG-MEM-005).
 *
 * Refactorizado bajo:
 * - Laudo 1 (Unificación de la Aduana): Si la matriz alcanza el umbral (>= 60%),
 *   despacha internamente la ejecución hacia GenerateTacticalRouteUseCase (Gemini).
 * - Laudo 2 (Gobernanza del Estado Multivuelta): El estado acumulado se recupera
 *   y persiste soberanamente en el backend vía DensityMatrixRepositoryPort ligado a bx_session_id.
 * - Anclaje Perimetral Barcelona (HU-PERIM-GEO-001): Validación de Bounding Box GPS,
 *   reconocimiento de los 10 distritos canónicos y excepciones logísticas periurbanas.
 * - Memoria Cognitiva Vectorial (PBI-COG-MEM-005): Recuperación RAG silenciosa y
 *   persistencia en LanceDB con formato hiper-denso (DenseSemanticMatrix).
 */
export class TriageInputUseCase implements ITriageInputUseCasePort {
  constructor(
    private readonly decisionEngine: ITypedDecisionEngine,
    private readonly conversationalSlm: IConversationalSLMPort,
    private readonly matrixRepo: DensityMatrixRepositoryPort,
    private readonly routeUseCase?: GenerateTacticalRouteUseCase,
    private readonly telemetryRepo?: TelemetryRepositoryPort,
    private readonly geoEngine: GeographicDecisionEnginePort = new HeuristicGeographicDecisionEngine(),
    private readonly cognitiveMemory?: ICognitiveMemoryPort,
    private readonly embeddingPort?: IEmbeddingPort,
  ) {}

  async execute(rawInput: TriageInputDto): Promise<TriageOutcome> {
    const startTime = Date.now();
    const input = TriageInputSchema.parse(rawInput);
    const trimmedPrompt = input.prompt.trim();
    const matrixId = input.matrixId || 'default';

    // 1. Laudo 2: Recuperación soberana del estado previo desde la persistencia del backend
    let priorPayload =
      (await this.matrixRepo.getMatrixPayload(input.sessionId, matrixId)) ?? {};

    // 1.1 Si el borrador de sesión está vacío, rescatar la memoria cognitiva consolidada desde LanceDB (RAG)
    if (Object.keys(priorPayload).length === 0 && this.cognitiveMemory) {
      try {
        const historical = await this.cognitiveMemory.getLatestSessionMemory(
          input.sessionId,
          matrixId,
        );
        if (historical) {
          priorPayload = historical.toPayload();
        }
      } catch {
        // Fail-soft en lectura de memoria histórica LanceDB
      }
    }

    // 2. Preparar contexto inmutable para Jev AI (System One)
    const stateContext = JSON.stringify({
      sessionId: input.sessionId,
      prompt: trimmedPrompt,
      matrixId,
      accumulated: priorPayload,
    });

    // 3. Evaluación Perimetral y Anclaje Geográfico de Barcelona (HU-PERIM-GEO-001)
    let isBarcelonaScope = true;
    let rejectedEntity: string | undefined = undefined;
    const detectedDistricts: string[] = [];

    // 3.1 Verificación de coordenadas GPS (si se proporcionan)
    if (input.userLocation) {
      const { lat, lng } = input.userLocation;
      const isGpsWithinBox =
        lat >= GeographicScope.BOUNDING_BOX.minLat &&
        lat <= GeographicScope.BOUNDING_BOX.maxLat &&
        lng >= GeographicScope.BOUNDING_BOX.minLng &&
        lng <= GeographicScope.BOUNDING_BOX.maxLng;

      if (!isGpsWithinBox) {
        // Si el GPS está fuera del Bounding Box de Barcelona, comprobar si el prompt
        // ancla explícitamente a Barcelona (planificación remota, p.ej. preparar viaje desde casa)
        const normalizedPrompt = trimmedPrompt.toLowerCase();
        const hasExplicitBarcelonaTarget =
          normalizedPrompt.includes('barcelona') ||
          GeographicScope.CANONICAL_DISTRICTS.some((d) =>
            normalizedPrompt.includes(d.toLowerCase()),
          ) ||
          GeographicScope.PERIURBAN_EXCEPTIONS.some((h) =>
            normalizedPrompt.includes(h.toLowerCase()),
          );

        if (!hasExplicitBarcelonaTarget) {
          isBarcelonaScope = false;
          rejectedEntity = 'Ubicación GPS fuera de perímetro';
        }
      }
    }

    // 3.2 Evaluación semántica/heurística del texto si no fue rechazado por GPS
    if (isBarcelonaScope) {
      const geoResult = await this.geoEngine.evaluateScope(trimmedPrompt);

      if (!geoResult.is_barcelona_scope) {
        isBarcelonaScope = false;
        rejectedEntity = geoResult.out_of_scope_entity ?? 'Ubicación foránea';
      } else {
        // Registrar distritos o excepciones periurbanas identificadas
        for (const district of geoResult.detected_districts) {
          if (!detectedDistricts.includes(district)) {
            detectedDistricts.push(district);
          }
        }

        // Fricción Cero (HU-PERIM-GEO-001): Si el prompt no menciona una entidad foránea,
        // se asume Barcelona por defecto (Implicit Barcelona).
        // Solo invocamos a Jev AI si no hay anclaje explícito para descartar desvíos foráneos sutiles.
        const normalizedPrompt = trimmedPrompt.toLowerCase();
        const hasExplicitAnchor =
          normalizedPrompt.includes('barcelona') ||
          detectedDistricts.length > 0;

        if (!hasExplicitAnchor) {
          try {
            const foreignEval = await this.decisionEngine.evaluateNoul(
              stateContext,
              '¿El usuario solicita explícitamente viajar o realizar actividades fuera del municipio de Barcelona (en otra ciudad, región o país)?',
              0.6,
            );
            // Solo si Jev AI afirma positivamente (> 0.6) que es un destino fuera de Barcelona, se activa el rebote
            if (foreignEval.isAffirmative) {
              isBarcelonaScope = false;
              rejectedEntity = 'Destino foráneo';
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
      }
    }

    // Creación del Value Object GeographicScope
    const geographicScope = !isBarcelonaScope
      ? GeographicScope.createOutOfScope(rejectedEntity ?? 'Ubicación foránea')
      : detectedDistricts.length > 0 || trimmedPrompt.toLowerCase().includes('barcelona')
      ? GeographicScope.createExplicitInScope(detectedDistricts)
      : GeographicScope.createImplicitBarcelona();

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
        geographicScope,
        durationMs,
      });
    }

    // 4. Extracción de Variables y Fusión con el Estado Previo
    const mergedPayload = await this.extractMatrixVariables(
      trimmedPrompt,
      stateContext,
      priorPayload,
      detectedDistricts,
      input.mood,
    );

    // 5. Evaluación del Peaje Termodinámico (Reglas de Matriz HU 6)
    const density = calculateMatrixDensity(matrixId, mergedPayload);

    // Registro de Telemetría Triage (incluyendo mood y densidad)
    this.emitTelemetry({
      level: 'INFO',
      context: 'SECURITY_PERIMETER',
      message: `[Aduana] Evaluación de triaje (Score: ${density.score}/${density.survivalThreshold}, Mood: ${mergedPayload.mood ?? 'none'})`,
      statusCode: density.isThresholdSatisfied ? 200 : 422,
      durationMs: Date.now() - startTime,
      payload: {
        sessionId: input.sessionId,
        matrixId,
        score: density.score,
        mood: mergedPayload.mood,
        isThresholdSatisfied: density.isThresholdSatisfied,
      },
    });

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
        geographicScope,
        detectedDistricts,
        durationMs,
      });
    }

    // FLUJO 2B: DESPACHO DIRECTO AL ORQUESTADOR PESADO (>= 60%)
    // PBI-COG-MEM-005: Transmutación semántica hiper-densa y consolidación en LanceDB
    const denseMatrix = DenseSemanticMatrix.create({
      sessionId: input.sessionId,
      matrixId,
      payload: mergedPayload,
      score: density.score,
      survivalThreshold: density.survivalThreshold,
    });

    if (this.cognitiveMemory && this.embeddingPort) {
      try {
        const vector = await this.embeddingPort.generateEmbedding(
          denseMatrix.toDensePromptString(),
        );
        await this.cognitiveMemory.persistMemory(denseMatrix, vector);
      } catch (err) {
        // Fail-soft: la falla de persistencia vectorial no debe abortar la generación del itinerario
        this.emitTelemetry({
          level: 'WARN',
          context: 'SECURITY_PERIMETER',
          message: `[Triage Fail-Soft] No se pudo persistir memoria cognitiva en LanceDB: ${err instanceof Error ? err.message : String(err)}`,
          statusCode: 500,
          durationMs: Date.now() - startTime,
          payload: { sessionId: input.sessionId, matrixId },
        });
      }
    }

    // Laudo 1: Despacho interno unificado hacia el orquestador pesado (Gemini) con inyección densa RAG
    let forgedRoute: unknown = undefined;
    if (this.routeUseCase) {
      const districtsLabel =
        detectedDistricts.length > 0 ? detectedDistricts.join(', ') : 'Global';
      const gpsLabel = input.userLocation
        ? ` | GPS: ${input.userLocation.lat},${input.userLocation.lng}`
        : '';
      const enrichedPrompt = `[Geo: Barcelona | Distritos: ${districtsLabel}${gpsLabel}] ${trimmedPrompt} | Contexto Semántico: ${denseMatrix.toDensePromptString()}`;
      forgedRoute = await this.routeUseCase.execute({
        prompt: enrichedPrompt,
        environment: {
          localTime: new Date().toISOString(),
        },
      });
    }

    // Laudo 2: Limpieza del borrador efímero en la sesión (la memoria consolidada permanece en LanceDB)
    await this.matrixRepo.clearMatrixPayload(input.sessionId, matrixId);

    const durationMs = Date.now() - startTime;
    return TriageOutcome.createDispatchReady({
      sessionId: input.sessionId,
      matrixId,
      score: density.score,
      survivalThreshold: density.survivalThreshold,
      payload: mergedPayload,
      route: forgedRoute,
      geographicScope,
      detectedDistricts,
      durationMs,
    });
  }

  private async extractMatrixVariables(
    prompt: string,
    stateContext: string,
    priorPayload: Partial<DefaultDensityPayload>,
    detectedDistricts: readonly string[] = [],
    inputMood?: 'relaxed' | 'adventurous' | 'cultural' | 'gastronomic',
  ): Promise<DefaultDensityPayload> {
    const combinedDistricts = Array.from(
      new Set([...(priorPayload.districts ?? []), ...detectedDistricts]),
    );

    const payload: DefaultDensityPayload = {
      constraints: [],
      ...priorPayload,
      districts: combinedDistricts,
    };

    // 1. time_window (Vector Crítico de 60%)
    if (!payload.time_window) {
      const hasExplicitTime =
        /\b(\d+\s*(horas?|h|d[ií]as?)|todo el \w+|por la (ma[ñn]ana|tarde|noche)|fin de semana|s[aá]bado|domingo|hoy|ma[ñn]ana|(el|del|durante el)\s*d[ií]a|durante el d[ií]a)\b/i.test(
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
      } else if (/\b(dos parejas)\b/i.test(prompt)) {
        payload.group_size = 4;
      } else if (/\b(tres parejas)\b/i.test(prompt)) {
        payload.group_size = 6;
      } else if (/\b(en pareja|con mi pareja|dos personas|con un amigo|una pareja)\b/i.test(prompt)) {
        payload.group_size = 2;
      } else if (/\b(solo|sola|por mi cuenta)\b/i.test(prompt)) {
        payload.group_size = 1;
      } else if (/\b(familia)\b/i.test(prompt)) {
        payload.group_size = 4;
      }
    }

    // 3. vibe (15%)
    if (!payload.vibe) {
      const vibeMatch = prompt.match(
        /\b(modernis\w+|g[oó]tico|tapas|gastronom\w+|comida|restauran\w+|fiesta|nocturn\w+|cultural|relax|playa|deport\w+|m[uú]sic\w+|espect[aá]cul\w+|ocio|arte|museo\w*)\b/i,
      );
      if (vibeMatch) {
        payload.vibe = vibeMatch[0];
      }
    }

    // 4. mood (Vector de Personalidad 10%)
    if (!payload.mood) {
      if (inputMood) {
        payload.mood = inputMood;
      } else if (/\b(mood|ánimo|estado anímico)\s*(:|es)?\s*(relajad\w*|relax\w*|tranquil\w*)\b/i.test(prompt) || /\b(en plan|modo)\s+(relax|tranquil\w*)\b/i.test(prompt)) {
        payload.mood = 'relaxed';
      } else if (/\b(mood|ánimo|estado anímico)\s*(:|es)?\s*(aventur\w*|explore)\b/i.test(prompt) || /\b(en plan|modo)\s+aventur\w*\b/i.test(prompt)) {
        payload.mood = 'adventurous';
      } else if (/\b(mood|ánimo|estado anímico)\s*(:|es)?\s*(cultural\w*)\b/i.test(prompt) || /\b(en plan|modo)\s+cultural\w*\b/i.test(prompt)) {
        payload.mood = 'cultural';
      } else if (/\b(mood|ánimo|estado anímico)\s*(:|es)?\s*(gastron[oó]mic\w*|foodie)\b/i.test(prompt) || /\b(en plan|modo)\s+foodie\b/i.test(prompt)) {
        payload.mood = 'gastronomic';
      }
    }

    return payload;
  }

  private emitTelemetry(params: {
    level: 'INFO' | 'WARN' | 'ERROR';
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

