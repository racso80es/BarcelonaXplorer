import { ITriageInputUseCasePort } from './triage-input.use-case.port';
import { ITypedDecisionEngine } from '@/features/ai-engine';
import { IConversationalSLMPort } from '@/features/ai-engine';
import { DensityMatrixRepositoryPort } from '@/features/planner';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { GeographicDecisionEnginePort } from '@/features/planner';
import {
  HeuristicGeographicDecisionEngine,
  GenerateTacticalRouteUseCase,
  AffiliateEnricherService,
} from '@/features/planner/server';
import {
  TriageInputDto,
  TriageInputSchema,
} from './triage.schema';
import {
  calculateMatrixDensity,
  DefaultDensityPayload,
  TacticalRoute,
  EnrichedRoute,
  IAffiliateEnricherService,
  ItineraryPersistencePort,
} from '@/features/planner';
import { TriageOutcome } from './triage-outcome.vo';
import { GeographicScope } from '@/features/planner';
import { TelemetryEntry, TelemetryContext } from '@/features/telemetry';


import {
  ICognitiveMemoryPort,
  ISemanticCachePort,
  CachedSemanticTriageResult,
  TRIAGE_SEMANTIC_CACHE_POLICY,
  DenseSemanticMatrix,
  IndexSessionMemoryService,
  MEMORY_VARIABLE_DURABILITY,
  COGNITIVE_MEMORY_KNN_MIN_SIMILARITY,
} from '@/features/cognitive-memory';
import { IEmbeddingPort } from '@/features/ai-engine';
import { SupportedLanguage, SupportedLanguageVo } from '@/features/i18n';
import {
  buildRouteLanguageDirective,
  detectLanguageFromPrompt,
  looksLikeLanguageSwitch,
  resolveBaselineLanguage,
} from './language-detector';
import { DensityPresenceSentinel } from './density-presence-sentinel.use-case';
import { mergePresenceWithHeuristic } from './merge-presence-with-heuristic';
import { inFlightSentinelProbes } from './sentinel-flight-map';

export const DENSITY_SENTINEL_JOIN_TIMEOUT_MS = 1500;

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
 * - Caché Semántica Vectorial (PBI-COGN-CACHE-001): Interceptación previa en LanceDB
 *   para resolver consultas recurrentes en <50ms con 0 coste de tokens.
 */
export class TriageInputUseCase implements ITriageInputUseCasePort {
  private readonly sessionMemoryIndexer: IndexSessionMemoryService;
  private readonly sentinel?: DensityPresenceSentinel;

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
    private readonly semanticCache?: ISemanticCachePort,
    presenceSentinel?: DensityPresenceSentinel,
  ) {
    this.sessionMemoryIndexer = new IndexSessionMemoryService(
      this.cognitiveMemory,
      this.embeddingPort,
      this.telemetryRepo,
    );
    this.sentinel = presenceSentinel;
  }

  async execute(rawInput: TriageInputDto): Promise<TriageOutcome> {
    const startTime = Date.now();
    const input = TriageInputSchema.parse(rawInput);
    const trimmedPrompt = input.prompt.trim();
    const matrixId = input.matrixId || 'default';

    // 1. Laudo 2: Recuperación soberana del estado previo desde la persistencia del backend
    let priorPayload =
      (await this.matrixRepo.getMatrixPayload(input.sessionId, matrixId)) ?? {};

    // Pre-cálculo único de embedding del prompt por turno (PBI-MEM-003 CA-4)
    let promptVector: number[] | undefined;
    if (this.embeddingPort) {
      try {
        const embeddingResult = await this.embeddingPort.generateEmbedding(trimmedPrompt);
        if (embeddingResult.source !== 'fallback') {
          promptVector = embeddingResult.vector;
        }
      } catch {
        promptVector = undefined;
      }
    }

    // 1.1 Si el borrador de sesión está vacío, rescatar la memoria cognitiva consolidada desde LanceDB (RAG)
    // PBI-MEM-003: Cadena declarativa exact -> knn acotada a la sesión y telemetría COGNITIVE_MEMORY_RECALL
    if (Object.keys(priorPayload).length === 0 && this.cognitiveMemory) {
      let historical: DenseSemanticMatrix | null = null;
      let strategyUsed: 'exact' | 'knn' | 'none' = 'none';
      let recallSimilarity: number | undefined;

      try {
        // Estrategia 1: Búsqueda exacta por id (sessionId:matrixId)
        historical = await this.cognitiveMemory.getLatestSessionMemory(
          input.sessionId,
          matrixId,
        );
        if (historical) {
          strategyUsed = 'exact';
        } else if (promptVector) {
          // Estrategia 2: Búsqueda semántica K-NN acotada a la sesión (PBI-MEM-003 CA-2 y CA-3)
          const knnMatches = await this.cognitiveMemory.searchSimilarMemories(
            promptVector,
            {
              sessionId: input.sessionId,
              limit: 1,
              minSimilarity: COGNITIVE_MEMORY_KNN_MIN_SIMILARITY,
            },
          );
          if (knnMatches.length > 0) {
            historical = knnMatches[0].matrix;
            strategyUsed = 'knn';
            recallSimilarity = knnMatches[0].score;
          }
        }

        const memoryHit = historical !== null;
        this.emitTelemetry({
          level: 'INFO',
          context: 'LLM_ENGINE',
          message: `[Cognitive Memory] Recuperación de memoria: ${memoryHit ? `HIT (${strategyUsed})` : 'MISS'}`,
          statusCode: 200,
          durationMs: Date.now() - startTime,
          payload: {
            eventType: 'COGNITIVE_MEMORY_RECALL',
            sessionId: input.sessionId,
            matrixId,
            memoryHit,
            strategy: strategyUsed,
            ...(recallSimilarity !== undefined ? { similarity: recallSimilarity } : {}),
          },
        });

        if (historical) {
          const fullPayload = historical.toPayload();
          const durablePayload: Partial<DefaultDensityPayload> = {};
          (
            Object.keys(MEMORY_VARIABLE_DURABILITY) as Array<
              keyof DefaultDensityPayload
            >
          ).forEach((key) => {
            if (
              MEMORY_VARIABLE_DURABILITY[key] === 'durable' &&
              fullPayload[key] !== undefined
            ) {
              Object.assign(durablePayload, { [key]: fullPayload[key] });
            }
          });
          priorPayload = durablePayload;
        }
      } catch (err) {
        // Fail-soft en lectura de memoria histórica LanceDB (CA-6)
        this.emitTelemetry({
          level: 'WARN',
          context: 'LLM_ENGINE',
          message: `[Cognitive Memory] Fallo al recuperar memoria de sesión: ${err instanceof Error ? err.message : String(err)}`,
          statusCode: 500,
          durationMs: Date.now() - startTime,
          payload: {
            eventType: 'COGNITIVE_MEMORY_RECALL',
            sessionId: input.sessionId,
            matrixId,
            memoryHit: false,
            strategy: 'none',
          },
        });
      }
    }

    // 1.2 Transición Idempotente entre Matrices (PBI-CORE-TRIAGE-003):
    // Si la matriz solicitada carece de estado pero la sesión posee variables previas bajo 'default',
    // se migran de forma segura las variables universales consolidadas.
    if (Object.keys(priorPayload).length === 0 && matrixId !== 'default') {
      try {
        const defaultPrior = await this.matrixRepo.getMatrixPayload(
          input.sessionId,
          'default',
        );
        if (defaultPrior && Object.keys(defaultPrior).length > 0) {
          priorPayload = {
            time_window: defaultPrior.time_window,
            group_size: defaultPrior.group_size,
            districts: defaultPrior.districts ? [...defaultPrior.districts] : [],
            constraints: defaultPrior.constraints ? [...defaultPrior.constraints] : [],
            vibe: defaultPrior.vibe,
            mood: defaultPrior.mood,
            language: defaultPrior.language,
          };
        }
      } catch {
        // Fail-soft en migración de matriz
      }
    }

    const sovereignLang = await this.resolveSovereignLanguage(
      trimmedPrompt,
      priorPayload.language,
      input.clientLanguage,
    );

    const sessionAgnosticCacheWrites = Object.keys(priorPayload).length === 0;
    const cacheContext = {
      matrixId,
      language: sovereignLang,
      sessionAgnosticCacheWrites,
    };

    // 2. Preparar contexto inmutable para Jev AI (System One)
    const stateContext = JSON.stringify({
      sessionId: input.sessionId,
      prompt: trimmedPrompt,
      matrixId,
      accumulated: priorPayload,
      language: sovereignLang,
    });

    // 2.1 Interceptación por Caché Semántica Vectorial (PBI-COGN-CACHE-001)
    if (this.semanticCache && promptVector) {
      try {
        const cached = await this.semanticCache.get({
          vector: promptVector,
          matrixId,
          language: sovereignLang,
        });
        const cachedOutcome = this.buildOutcomeFromSemanticCache(cached?.result, {
          sessionId: input.sessionId,
          matrixId,
          sovereignLang,
          startTime,
        });

        if (cached && cachedOutcome) {
          await this.matrixRepo.saveMatrixPayload(input.sessionId, matrixId, {
            language: sovereignLang,
          });

          this.emitTelemetry({
            level: 'INFO',
            context: 'SECURITY_PERIMETER',
            message: '[Aduana] Consulta interceptada por Caché Semántica Vectorial',
            statusCode: 200,
            durationMs: Date.now() - startTime,
            payload: {
              eventType: 'TRIAGE_ROUTED',
              sessionId: input.sessionId,
              cacheHit: true,
              ...(cached.tokensSaved !== undefined
                ? { tokensSaved: cached.tokensSaved }
                : {}),
              similarity: cached.similarity,
              prompt: trimmedPrompt,
            },
          });

          return cachedOutcome;
        }

        if (cached && !cachedOutcome) {
          this.emitTelemetry({
            level: 'WARN',
            context: 'SECURITY_PERIMETER',
            message: '[Aduana] Acierto de caché semántica descartado por esquema inválido',
            statusCode: 200,
            durationMs: Date.now() - startTime,
            payload: { sessionId: input.sessionId, matrixId },
          });
        }
      } catch {
        // Fail-soft en lectura de caché semántica
      }
    }

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
        _sys_lang: sovereignLang,
      });
    }

    // 3.3 Enrutamiento Semántico y Empatía Táctica (CA-1: Jev AI / Triaje de Intención)
    const isCasualDialogue = await this.isCasualDialogueIntent(
      trimmedPrompt,
      stateContext,
    );

    if (isCasualDialogue) {
      const dialogueResult =
        await this.conversationalSlm.generateEmpatheticDialogue(
          trimmedPrompt,
          stateContext,
        );
      const dialogueMessage = dialogueResult.message;
      const durationMs = Date.now() - startTime;

      const casualTelemetryPayload: Record<string, unknown> = {
        eventType: 'TRIAGE_ROUTED',
        tag: 'CASUAL_DIALOGUE',
        sessionId: input.sessionId,
        intent: 'dialogue',
        decisionEngine: 'jev-ai',
        model: this.conversationalSlm.getActiveModelId(),
        promptLength: trimmedPrompt.length,
        durationMs,
        statusCode: 200,
        prompt: trimmedPrompt,
        dialogueMessage,
      };
      if (dialogueResult.totalTokens !== undefined) {
        casualTelemetryPayload.tokenEstimate = dialogueResult.totalTokens;
      }

      this.emitTelemetry({
        level: 'INFO',
        context: 'SECURITY_PERIMETER',
        message: `[Aduana] Diálogo casual interceptado con empatía`,
        statusCode: 200,
        durationMs,
        payload: casualTelemetryPayload,
      });

      const casualPayload = { ...priorPayload, language: sovereignLang };
      await this.matrixRepo.saveMatrixPayload(
        input.sessionId,
        matrixId,
        casualPayload,
      );

      const casualOutcome = TriageOutcome.createCasualDialogue({
        sessionId: input.sessionId,
        matrixId,
        dialogueMessage,
        durationMs,
        score: calculateMatrixDensity(matrixId, casualPayload).score,
        survivalThreshold: 60,
        partialPayload: casualPayload,
        geographicScope,
        detectedDistricts,
        _sys_lang: sovereignLang,
      });

      this.saveToSemanticCache(trimmedPrompt, promptVector, casualOutcome, cacheContext);
      return casualOutcome;
    }

    // 4. Extracción de Variables y Fusión con el Estado Previo
    let mergedPayload = await this.extractMatrixVariables(
      trimmedPrompt,
      stateContext,
      priorPayload,
      detectedDistricts,
      input.mood,
      sovereignLang,
    );

    // 5. Evaluación del Peaje Termodinámico (Reglas de Matriz HU 6)
    let density = calculateMatrixDensity(matrixId, mergedPayload);

    // PBI-ARCH-JEV-006: Consolidación de la Matriz antes del Despacho (Join Acotado)
    // El join existe solo en el camino de despacho (>= 60%). Los caminos INCOMPLETE_REPROMPT y CASUAL_DIALOGUE no esperan.
    const flightKey = `${input.sessionId}:${matrixId}`;
    const inFlightPromise = inFlightSentinelProbes.get(flightKey);

    if (density.isThresholdSatisfied && inFlightPromise) {
      const joinResolved = await this.awaitInFlightSentinel(
        inFlightPromise,
        input.sessionId,
        matrixId,
      );

      if (joinResolved) {
        const latestPayload = await this.matrixRepo.getMatrixPayload(
          input.sessionId,
          matrixId,
        );
        if (latestPayload) {
          mergedPayload = {
            ...mergedPayload,
            ...latestPayload,
          };
          density = calculateMatrixDensity(matrixId, mergedPayload);
        }
      }
    }

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

      if (this.sentinel) {
        this.launchSentinelProbe({
          prompt: trimmedPrompt,
          sessionId: input.sessionId,
          matrixId,
          heuristicPayload: mergedPayload,
          priorPayload,
        });
      } else {
        const partialMatrix = DenseSemanticMatrix.create({
          sessionId: input.sessionId,
          matrixId,
          payload: mergedPayload,
          score: density.score,
          survivalThreshold: density.survivalThreshold,
        });
        await this.sessionMemoryIndexer.index(
          partialMatrix,
          'INCOMPLETE_REPROMPT',
          priorPayload,
        );
      }

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
        _sys_lang: sovereignLang,
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

    // Laudo 1: Despacho interno unificado hacia el orquestador pesado (Gemini) con inyección densa RAG
    let forgedRoute: TacticalRoute | string | undefined = undefined;
    if (this.routeUseCase) {
      const districtsLabel =
        detectedDistricts.length > 0 ? detectedDistricts.join(', ') : 'Global';
      const gpsLabel = input.userLocation
        ? ` | GPS: ${input.userLocation.lat},${input.userLocation.lng}`
        : '';
      const enrichedPrompt = `${buildRouteLanguageDirective(sovereignLang)} [Geo: Barcelona | Distritos: ${districtsLabel}${gpsLabel}] ${trimmedPrompt} | Contexto Semántico: ${denseMatrix.toDensePromptString()}`;
      forgedRoute = await this.routeUseCase.execute({
        prompt: enrichedPrompt,
        environment: {
          localTime: new Date().toISOString(),
        },
      });
    }

    if (typeof forgedRoute === 'string') {
      await this.sessionMemoryIndexer.index(
        denseMatrix,
        'DISPATCH_CLAUDICATION',
        priorPayload,
      );

      const providerCodeMatch = forgedRoute.match(/\b(503|429)\b/);
      const providerStatusCode = providerCodeMatch
        ? Number.parseInt(providerCodeMatch[1], 10)
        : 503;
      this.emitTelemetry({
        level: 'WARN',
        context: 'SECURITY_PERIMETER',
        message: `[Triage] Claudicación del proveedor (${providerStatusCode}): ${forgedRoute.slice(0, 200)}`,
        statusCode: providerStatusCode,
        durationMs: Date.now() - startTime,
        payload: {
          eventType: 'LLM_ENGINE',
          sessionId: input.sessionId,
          matrixId,
          providerStatusCode,
        },
      });
      await this.matrixRepo.clearMatrixPayload(input.sessionId, matrixId);
      const durationMs = Date.now() - startTime;
      return TriageOutcome.createDispatchClaudication({
        sessionId: input.sessionId,
        matrixId,
        score: density.score,
        survivalThreshold: density.survivalThreshold,
        claudicationMessage: forgedRoute,
        payload: mergedPayload,
        geographicScope,
        detectedDistricts,
        durationMs,
        _sys_lang: sovereignLang,
      });
    }

    // CA-3: Cruce asíncrono con Proveedores de Afiliados (TheFork / Civitatis)
    let enrichedItinerary: EnrichedRoute | undefined = undefined;
    if (forgedRoute && forgedRoute.waypoints.length > 0) {
      try {
        const thermalState: 'operational' | 'saturated' =
          density.score >= 100 ? 'saturated' : 'operational';
        const enriched = await this.affiliateEnricher.enrichRoute(
          forgedRoute,
          thermalState,
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
          message: `[Afiliados Enriquecimiento] ${enriched.waypoints.length} parcelas cruzadas (${thermalState})`,
          statusCode: 200,
          durationMs: Date.now() - startTime,
          payload: {
            eventType: 'PROVIDER_AFFILIATE_FETCH',
            sessionId: input.sessionId,
            provider: primaryProvider,
            query: trimmedPrompt.slice(0, 100),
            optionsGenerated: totalOptions,
            thermalState,
            durationMs: Date.now() - startTime,
            statusCode: 200,
          },
        });


        // CA-4 & PBI-ARCH-ORCH-008: Persistencia Relacional MySQL en Prisma y correlación de CUIDs
        if (this.itineraryRepo) {
          try {
            const persisted = await this.itineraryRepo.saveItinerary(input.sessionId, enriched);
            if (persisted && Array.isArray(persisted.waypoints) && persisted.waypoints.length > 0) {
              enrichedItinerary = {
                ...enriched,
                id: persisted.id,
                waypoints: persisted.waypoints,
              };
            }
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

    // Persistencia explícita de la memoria consolidada en LanceDB antes de limpiar el borrador
    await this.sessionMemoryIndexer.index(
      denseMatrix,
      'DISPATCH_READY',
      priorPayload,
    );

    // Laudo 2: Limpieza del borrador efímero en la sesión (la memoria consolidada permanece en LanceDB)
    await this.matrixRepo.clearMatrixPayload(input.sessionId, matrixId);

    const durationMs = Date.now() - startTime;
    const dispatchOutcome = TriageOutcome.createDispatchReady({
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
      _sys_lang: sovereignLang,
    });

    this.saveToSemanticCache(trimmedPrompt, promptVector, dispatchOutcome, cacheContext);
    return dispatchOutcome;
  }

  private async extractMatrixVariables(
    prompt: string,
    stateContext: string,
    priorPayload: Partial<DefaultDensityPayload>,
    detectedDistricts: readonly string[] = [],
    inputMood?: 'relaxed' | 'adventurous' | 'cultural' | 'gastronomic',
    language: SupportedLanguage = 'es',
  ): Promise<DefaultDensityPayload> {
    const combinedDistricts = Array.from(
      new Set([...(priorPayload.districts ?? []), ...detectedDistricts]),
    );

    const payload: DefaultDensityPayload = {
      constraints: [],
      ...priorPayload,
      districts: combinedDistricts,
      language,
    };

    // 1. time_window (Vector Crítico de 60%)
    if (!payload.time_window) {
      const hasExplicitTime =
        /\b(\d+\s*(horas?|h|d[ií]as?)|todo el \w+|por la (ma[ñn]ana|tarde|noche)|fin de semana|s[aá]bado|domingo|hoy|ma[ñn]ana|(el|del|durante el)\s*d[ií]a|durante el d[ií]a)\b/i.test(
          prompt,
        );

      if (hasExplicitTime) {
        payload.time_window = prompt;
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

    // 5. constraints (10%)
    if (!payload.constraints || payload.constraints.length === 0) {
      const constraintMatches: string[] = [];
      if (/\b(sin prisas|sin prisa|tranquil\w*|calma)\b/i.test(prompt)) constraintMatches.push('sin prisas');
      if (/\b(barat\w+|econ[oó]mic\w+|bajo coste)\b/i.test(prompt)) constraintMatches.push('económico');
      if (/\b(accesible|movilidad reducida|en silla de ruedas)\b/i.test(prompt)) constraintMatches.push('accesible');
      if (constraintMatches.length > 0) {
        payload.constraints = constraintMatches;
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

  private async resolveSovereignLanguage(
    prompt: string,
    persistedLanguage?: string,
    clientLanguage?: string,
  ): Promise<SupportedLanguage> {
    const currentLanguage = resolveBaselineLanguage(
      persistedLanguage,
      clientLanguage,
    );
    const heuristicLang = detectLanguageFromPrompt(prompt, currentLanguage);

    if (heuristicLang !== currentLanguage) {
      return heuristicLang;
    }

    if (!looksLikeLanguageSwitch(prompt)) {
      return currentLanguage;
    }

    try {
      const slmLang = await this.conversationalSlm.detectLanguageIntent(
        prompt,
        currentLanguage,
      );
      return SupportedLanguageVo.from(slmLang).value;
    } catch {
      return currentLanguage;
    }
  }

  private emitTelemetry(params: {
    level: 'INFO' | 'WARN' | 'ERROR';
    context: TelemetryContext;
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

  private buildOutcomeFromSemanticCache(
    payload: CachedSemanticTriageResult | undefined,
    ctx: {
      sessionId: string;
      matrixId: string;
      sovereignLang: SupportedLanguage;
      startTime: number;
    },
  ): TriageOutcome | null {
    if (!payload) {
      return null;
    }

    const durationMs = Date.now() - ctx.startTime;

    if (payload.status === 'CASUAL_DIALOGUE' && payload.dialogueMessage) {
      return TriageOutcome.createCasualDialogue({
        sessionId: ctx.sessionId,
        matrixId: ctx.matrixId,
        dialogueMessage: payload.dialogueMessage,
        durationMs,
        partialPayload: { language: ctx.sovereignLang },
        _sys_lang: ctx.sovereignLang,
      });
    }

    if (payload.status === 'REBOUND_OUT_OF_SCOPE' && payload.bounceMessage) {
      return TriageOutcome.createReboundOutOfScope({
        sessionId: ctx.sessionId,
        matrixId: ctx.matrixId,
        bounceMessage: payload.bounceMessage,
        rejectedEntity: payload.rejectedEntity,
        durationMs,
        _sys_lang: ctx.sovereignLang,
      });
    }

    return null;
  }

  private toCacheablePayload(outcome: TriageOutcome): CachedSemanticTriageResult | null {
    if (!TRIAGE_SEMANTIC_CACHE_POLICY[outcome.status].cacheable) {
      return null;
    }

    if (outcome.status === 'CASUAL_DIALOGUE' && outcome.dialogueMessage) {
      return {
        status: 'CASUAL_DIALOGUE',
        dialogueMessage: outcome.dialogueMessage,
      };
    }

    if (outcome.status === 'REBOUND_OUT_OF_SCOPE' && outcome.bounceMessage) {
      return {
        status: 'REBOUND_OUT_OF_SCOPE',
        bounceMessage: outcome.bounceMessage,
        rejectedEntity: outcome.rejectedEntity,
      };
    }

    return null;
  }

  private saveToSemanticCache(
    prompt: string,
    vector: number[] | undefined,
    outcome: TriageOutcome,
    ctx: {
      matrixId: string;
      language: SupportedLanguage;
      sessionAgnosticCacheWrites: boolean;
    },
  ): void {
    if (!this.semanticCache || !vector || !ctx.sessionAgnosticCacheWrites) {
      return;
    }

    const payload = this.toCacheablePayload(outcome);
    if (!payload) {
      return;
    }

    this.semanticCache
      .set({
        prompt,
        vector,
        matrixId: ctx.matrixId,
        language: ctx.language,
        payload,
      })
      .catch(() => {});
  }

  private launchSentinelProbe(params: {
    prompt: string;
    sessionId: string;
    matrixId: string;
    heuristicPayload: DefaultDensityPayload;
    priorPayload: Partial<DefaultDensityPayload>;
  }): void {
    const sentinel = this.sentinel;
    if (!sentinel) {
      return;
    }

    const flightKey = `${params.sessionId}:${params.matrixId}`;

    const flightPromise = (async () => {
      try {
        const envelope = await sentinel.probe(params.prompt);
        if (!envelope.success || !envelope.result) {
          this.emitTelemetry({
            level: 'WARN',
            context: 'LLM_ENGINE',
            message: '[Sentinel] Sonda fallida o sin resultado en segundo plano',
            statusCode: 500,
            durationMs: 0,
            payload: {
              eventType: 'DENSITY_PRESENCE_SENTINEL',
              sessionId: params.sessionId,
              matrixId: params.matrixId,
              errors: envelope.errors,
            },
          });
          return;
        }

        // 1. Lee el payload vigente con matrixRepo.getMatrixPayload
        const currentPrior =
          (await this.matrixRepo.getMatrixPayload(
            params.sessionId,
            params.matrixId,
          )) ?? {};

        // 2. Aplica mergePresenceWithHeuristic sobre prior, heurístico de este turno y la sonda
        const fusedPayload = mergePresenceWithHeuristic({
          prior: currentPrior,
          heuristic: params.heuristicPayload,
          probe: envelope.result,
        });

        // 3. Escribe con matrixRepo.saveMatrixPayload
        await this.matrixRepo.saveMatrixPayload(
          params.sessionId,
          params.matrixId,
          fusedPayload,
        );

        // 4. Indexa con sessionMemoryIndexer.index hacia cognitive_memories
        const fusedDensity = calculateMatrixDensity(params.matrixId, fusedPayload);
        const denseMatrix = DenseSemanticMatrix.create({
          sessionId: params.sessionId,
          matrixId: params.matrixId,
          payload: fusedPayload,
          score: fusedDensity.score,
          survivalThreshold: fusedDensity.survivalThreshold,
        });

        await this.sessionMemoryIndexer.index(
          denseMatrix,
          'INCOMPLETE_REPROMPT',
          currentPrior,
        );
      } catch (error: unknown) {
        this.emitTelemetry({
          level: 'WARN',
          context: 'LLM_ENGINE',
          message: `[Sentinel] Error en segundo plano: ${error instanceof Error ? error.message : String(error)}`,
          statusCode: 500,
          durationMs: 0,
          payload: {
            eventType: 'DENSITY_PRESENCE_SENTINEL',
            sessionId: params.sessionId,
            matrixId: params.matrixId,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      } finally {
        inFlightSentinelProbes.delete(flightKey);
      }
    })();

    inFlightSentinelProbes.set(flightKey, flightPromise);
  }

  private async awaitInFlightSentinel(
    flightPromise: Promise<void>,
    sessionId: string,
    matrixId: string,
  ): Promise<boolean> {
    let timer: NodeJS.Timeout | undefined;
    let didTimeout = false;

    const timeoutPromise = new Promise<void>((_, reject) => {
      timer = setTimeout(() => {
        didTimeout = true;
        reject(new Error('SENTINEL_JOIN_TIMEOUT'));
      }, DENSITY_SENTINEL_JOIN_TIMEOUT_MS);
    });

    try {
      await Promise.race([flightPromise, timeoutPromise]);
      return true;
    } catch {
      if (didTimeout) {
        this.emitTelemetry({
          level: 'WARN',
          context: 'LLM_ENGINE',
          message: `[Sentinel Join] Tiempo de espera de consolidación agotado (${DENSITY_SENTINEL_JOIN_TIMEOUT_MS}ms)`,
          statusCode: 408,
          durationMs: DENSITY_SENTINEL_JOIN_TIMEOUT_MS,
          payload: {
            eventType: 'DENSITY_PRESENCE_SENTINEL_JOIN_TIMEOUT',
            sessionId,
            matrixId,
            timeoutMs: DENSITY_SENTINEL_JOIN_TIMEOUT_MS,
          },
        });
      }
      return false;
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }
}

