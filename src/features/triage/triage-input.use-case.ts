import { ITriageInputUseCasePort } from './triage-input.use-case.port';
import { ITypedDecisionEngine } from '@/features/ai-engine';
import { IConversationalSLMPort } from '@/features/ai-engine';
import { DensityMatrixRepositoryPort } from '@/features/planner';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { GeographicDecisionEnginePort } from '@/features/planner';
import { HeuristicGeographicDecisionEngine } from '@/features/planner';
import { GenerateTacticalRouteUseCase } from '@/features/planner';
import {
  TriageInputDto,
  TriageInputSchema,
} from './triage.schema';
import {
  calculateMatrixDensity,
  DefaultDensityPayload,
  TacticalRoute,
  AffiliateEnricherService,
  IAffiliateEnricherService,
  ItineraryPersistencePort,
} from '@/features/planner';
import { TriageOutcome } from './triage-outcome.vo';
import { GeographicScope } from '@/features/planner';
import { TelemetryEntry } from '@/features/telemetry';

import { ICognitiveMemoryPort } from '@/features/cognitive-memory';
import { IEmbeddingPort } from '@/features/ai-engine';
import { DenseSemanticMatrix } from '@/features/cognitive-memory';

/**
 * Caso de Uso: Aduana Universal y Triaje Entrópico (HU-CORE-TRIAGE-002 / PBI-ARCH-ORCH-001).
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
 * - Enrutamiento Semántico y Empatía (CA-1): Diálogo casual interceptado por Jev AI
 *   sin forzar la Matriz de Densidad ni preguntas logísticas.
 * - Cruce con Afiliados y Persistencia MySQL (CA-3 & CA-4): TheFork / Civitatis y Prisma ORM.
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
    private readonly affiliateEnricher: IAffiliateEnricherService = new AffiliateEnricherService(),
    private readonly itineraryRepo?: ItineraryPersistencePort,
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

    // 3.3 Enrutamiento Semántico y Empatía Táctica (CA-1: Jev AI / Triaje de Intención)
    const isCasualDialogue = await this.isCasualDialogueIntent(
      trimmedPrompt,
      stateContext,
    );

    if (isCasualDialogue) {
      const dialogueMessage =
        await this.conversationalSlm.generateEmpatheticDialogue(
          trimmedPrompt,
          stateContext,
        );
      const durationMs = Date.now() - startTime;

      this.emitTelemetry({
        level: 'INFO',
        context: 'SECURITY_PERIMETER',
        message: `[Aduana] Diálogo casual interceptado con empatía`,
        statusCode: 200,
        durationMs,
        payload: {
          eventType: 'TRIAGE_ROUTED',
          tag: 'CASUAL_DIALOGUE',
          sessionId: input.sessionId,
          intent: 'dialogue',
          decisionEngine: 'jev-ai',
          model: 'groq/qwen3.8-27b',
          promptLength: trimmedPrompt.length,
          durationMs,
          statusCode: 200,
          tokenEstimate: 45,
          tokensSaved: 850,
          prompt: trimmedPrompt,
          dialogueMessage,
        },
      });

      return TriageOutcome.createCasualDialogue({
        sessionId: input.sessionId,
        matrixId,
        dialogueMessage,
        durationMs,
        score: calculateMatrixDensity(matrixId, priorPayload).score,
        survivalThreshold: 60,
        partialPayload: priorPayload,
        geographicScope,
        detectedDistricts,
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
        eventType: 'DENSITY_THRESHOLD_CHECK',
        sessionId: input.sessionId,
        matrixId,
        score: density.score,
        survivalThreshold: density.survivalThreshold,
        isSatisfied: density.isThresholdSatisfied,
        missingVariable: density.highestMissingVariable,
        mood: mergedPayload.mood,
        durationMs: Date.now() - startTime,
        statusCode: density.isThresholdSatisfied ? 200 : 422,
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

    // CA-3: Cruce asíncrono con Proveedores de Afiliados (TheFork / Civitatis)
    let enrichedItinerary: unknown = undefined;
    if (
      forgedRoute &&
      typeof forgedRoute !== 'string' &&
      (forgedRoute as TacticalRoute).waypoints
    ) {
      try {
        const enriched = await this.affiliateEnricher.enrichRoute(
          forgedRoute as TacticalRoute,
        );
        enrichedItinerary = enriched;

        // Registro de Telemetría Sensorial de Afiliados (PBI-OPS-TELEM-002)
        const totalOptions = enriched.waypoints.reduce(
          (acc, w) => acc + (w.options?.length ?? 0),
          0,
        );
        const primaryProvider =
          enriched.waypoints.find((w) => w.affiliateProvider !== 'NONE')
            ?.affiliateProvider ?? 'NONE';

        this.emitTelemetry({
          level: 'INFO',
          context: 'SECURITY_PERIMETER',
          message: `[Afiliados Enriquecimiento] ${enriched.waypoints.length} parcelas cruzadas`,
          statusCode: 200,
          durationMs: Date.now() - startTime,
          payload: {
            eventType: 'PROVIDER_AFFILIATE_FETCH',
            sessionId: input.sessionId,
            provider: primaryProvider,
            query: trimmedPrompt.slice(0, 100),
            optionsGenerated: totalOptions,
            durationMs: Date.now() - startTime,
            statusCode: 200,
          },
        });

        // CA-4: Persistencia Relacional MySQL en Prisma
        if (this.itineraryRepo) {
          try {
            await this.itineraryRepo.saveItinerary(input.sessionId, enriched);
          } catch (dbErr) {
            // Fail-soft en persistencia relacional
            this.emitTelemetry({
              level: 'WARN',
              context: 'SECURITY_PERIMETER',
              message: `[Persistencia MySQL] Fallo al almacenar itinerario: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`,
              statusCode: 500,
              durationMs: Date.now() - startTime,
              payload: { sessionId: input.sessionId, matrixId },
            });
          }
        }
      } catch (enrichErr) {
        this.emitTelemetry({
          level: 'WARN',
          context: 'SECURITY_PERIMETER',
          message: `[Afiliados Enriquecimiento] Fallo al enriquecer ruta: ${enrichErr instanceof Error ? enrichErr.message : String(enrichErr)}`,
          statusCode: 500,
          durationMs: Date.now() - startTime,
          payload: { sessionId: input.sessionId, matrixId },
        });
      }
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
      itinerary: enrichedItinerary,
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

  private async isCasualDialogueIntent(
    prompt: string,
    stateContext: string,
  ): Promise<boolean> {
    const normalized = prompt.toLowerCase();

    // Palabras clave inequívocas de planificación turística o logística
    const hasLogisticsKeywords =
      /\b(ruta|itinerario|plan|gu[ií]a|visitar?|conocer|pasear?|recorrer?|museo|sagrada|park|güell|guell|batll[oó]|pedrera|catedral|restaurante|comer|cenar?|almorzar?|tapas|barrio|distrito|g[oó]tico|born|raval|eixample|gr[aà]cia|barceloneta|hotel|cu[aá]nto|precio|coste|presupuesto|horario|\d+\s*(horas?|h|d[ií]as?))\b/i.test(
        normalized,
      );

    if (hasLogisticsKeywords) {
      return false;
    }

    // Saludos puros, expresiones de ánimo, cansancio o comentarios casuales
    const isObviousCasual =
      /^(hola|buenos d[ií]as|buenas tardes|buenas noches|buenas|hey|qu[eé] tal|c[oó]mo est[aá]s|qu[eé] pasa|qu[eé] hay)(\s*!|\s*\?|\s*\.)*$/i.test(
        normalized,
      ) ||
      /\b(uf|estoy agotad[oa]|estoy cansad[oa]|qu[eé] cansancio|menudo d[ií]a|vaya d[ií]a|qu[eé] sue[ñn]o|hace calor|qu[eé] fr[ií]o|gracias|muchas gracias)\b/i.test(
        normalized,
      );

    if (isObviousCasual) {
      return true;
    }

    // Si hay ambigüedad y no contiene keywords de logística, consultar al motor determinista Jev AI
    try {
      const evalResult = await this.decisionEngine.evaluateNoul(
        stateContext,
        '¿El mensaje del usuario es únicamente un saludo, charla informal o una expresión emocional/personal sin petición de itinerario, visita turística o plan?',
        0.6,
      );
      return evalResult.isAffirmative;
    } catch {
      return false;
    }
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

