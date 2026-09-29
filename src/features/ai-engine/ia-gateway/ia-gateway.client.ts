import type {
  AiGeneratorPort,
  ITypedDecisionEngine,
  JevChoiceEvaluation,
  JevDecisionProbeResult,
  JevNoulEvaluation,
} from '@/features/ai-engine';
import {
  GeoCoordinates,
  TacticalRoute,
  TacticalRouteZodSchema,
  TacticalWaypoint,
  TimeSpan,
} from '@/features/planner';
import { TelemetryEntry } from '@/features/telemetry';
import type { TelemetryRepositoryPort } from '@/features/telemetry';
import type { IaGatewayMetrics } from './ia-gateway-common.schema';
import {
  IaGatewayChoiceEnvelopeSchema,
  IaGatewayHealthEnvelopeSchema,
  IaGatewayNoulEnvelopeSchema,
} from './ia-gateway-decision.schema';
import { IaGatewayLlmEnvelopeSchema } from './ia-gateway-llm.schema';

export interface IaGatewayClientConfig {
  baseUrl?: string;
  gatewaySecret?: string;
  timeoutMs?: number;
}

export class IaGatewayClient implements ITypedDecisionEngine, AiGeneratorPort {
  private readonly baseUrl: string;
  private readonly gatewaySecret: string;
  private readonly timeoutMs: number;

  constructor(
    config: IaGatewayClientConfig = {},
    private readonly telemetryRepo?: TelemetryRepositoryPort,
    private readonly fetchFn: typeof fetch = fetch
  ) {
    this.baseUrl = (config.baseUrl ?? process.env.IA_GATEWAY_URL ?? 'http://ia-gateway:3001').replace(
      /\/+$/,
      ''
    );
    this.gatewaySecret = config.gatewaySecret ?? process.env.IA_GATEWAY_SECRET ?? '';
    this.timeoutMs = config.timeoutMs ?? 15000;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-ia-gateway-secret': this.gatewaySecret,
    };
  }

  private recordTelemetry(
    metrics: IaGatewayMetrics,
    statusCode = 200,
    errorMessage?: string
  ): void {
    if (process.env.TELEMETRY_LLM_ENABLED === 'false' || !this.telemetryRepo) {
      return;
    }

    const level: 'INFO' | 'WARN' | 'ERROR' = errorMessage
      ? 'ERROR'
      : metrics.fallbackTriggered
        ? 'WARN'
        : 'INFO';

    const message = errorMessage
      ? `[IA Gateway ${metrics.engineType}] Fallo: ${errorMessage}`
      : metrics.fallbackTriggered
        ? `[IA Gateway ${metrics.engineType}] Inferencia servida mediante anclaje base | Modelo: ${metrics.modelId}`
        : `[IA Gateway ${metrics.engineType}] Inferencia completada con éxito | Modelo: ${metrics.modelId}`;

    const payload = {
      engineType: metrics.engineType,
      provider: metrics.provider,
      modelId: metrics.modelId,
      promptTokens: metrics.promptTokens,
      completionTokens: metrics.completionTokens,
      totalTokens: metrics.totalTokens,
      fallbackTriggered: metrics.fallbackTriggered,
      attemptedProviders: metrics.attemptedProviders,
      ...(errorMessage ? { error: errorMessage } : {}),
    };

    void this.telemetryRepo
      .log(
        new TelemetryEntry(
          level,
          'LLM_ENGINE',
          message,
          payload,
          statusCode,
          metrics.durationMs
        )
      )
      .catch((err) => console.warn('[IA Gateway Telemetry Fire-and-Forget Error]', err));
  }

  // ─────────────────────────────────────────────────────────────
  // 1. ITypedDecisionEngine Implementation
  // ─────────────────────────────────────────────────────────────

  async evaluateHealth(): Promise<JevDecisionProbeResult> {
    const t0 = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await this.fetchFn(`${this.baseUrl}/healthz`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - t0);

      if (!response.ok) {
        return {
          isHealthy: false,
          latencyMs,
          statusCode: response.status,
          error: `HTTP ${response.status} en IA Gateway /healthz`,
        };
      }

      const rawData: unknown = await response.json();
      const parsed = IaGatewayHealthEnvelopeSchema.parse(rawData);

      return {
        isHealthy: parsed.success && parsed.result?.status === 'healthy',
        latencyMs,
        statusCode: response.status,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - t0);
      const isAbort =
        (err instanceof Error && err.name === 'AbortError') ||
        (err as { type?: string })?.type === 'aborted';

      return {
        isHealthy: false,
        latencyMs,
        error: isAbort
          ? `Timeout en healthcheck de IA Gateway (3000ms)`
          : err instanceof Error
            ? err.message
            : 'Fallo desconocido en sonda de salud IA Gateway',
      };
    }
  }

  async evaluateNoul(
    state: string,
    instruction: string,
    threshold = 0.5
  ): Promise<JevNoulEvaluation> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(`${this.baseUrl}/v1/decision/evaluate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          primitive: 'noul',
          state,
          instruction,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rawJson: unknown = await response.json();
      const envelope = IaGatewayNoulEnvelopeSchema.parse(rawJson);

      if (!envelope.success || !envelope.result) {
        const errorMsg = envelope.errors?.join('; ') || envelope.feedback || 'Fallo en evaluación noul';
        throw new Error(`IA Gateway error (${envelope.exitCode}): ${errorMsg}`);
      }

      this.recordTelemetry(envelope.result.metrics, response.status);

      return {
        probability: envelope.result.probability,
        isAffirmative: envelope.result.probability >= threshold,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  async evaluateChoice<T extends string>(
    state: string,
    instruction: string,
    choices: readonly T[]
  ): Promise<JevChoiceEvaluation<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(`${this.baseUrl}/v1/decision/evaluate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          primitive: 'choice',
          state,
          instruction,
          choices: Array.from(choices),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rawJson: unknown = await response.json();
      const envelope = IaGatewayChoiceEnvelopeSchema.parse(rawJson);

      if (!envelope.success || !envelope.result) {
        const errorMsg = envelope.errors?.join('; ') || envelope.feedback || 'Fallo en evaluación choice';
        throw new Error(`IA Gateway error (${envelope.exitCode}): ${errorMsg}`);
      }

      this.recordTelemetry(envelope.result.metrics, response.status);

      return {
        selectedChoice: envelope.result.selectedChoice as T,
        confidence: envelope.result.confidence,
        probabilities: envelope.result.probabilities as Record<T, number>,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. AiGeneratorPort Implementation
  // ─────────────────────────────────────────────────────────────

  async generateTacticalRoute(prompt: string): Promise<TacticalRoute> {
    const systemPrompt =
      'Eres el Orquestador Táctico de BarcelonaXplorer. Genera una ruta táctica circunscrita estricta y exclusivamente a la ciudad de Barcelona (España) y sus distritos oficiales. Todas las coordenadas (lat, lng), puntos de interés, actividades y recomendaciones deben ubicarse físicamente dentro del término municipal de Barcelona o sus accesos de tránsito autorizados. Queda terminantemente prohibido generar paradas en Madrid u otras ciudades foráneas. Devuelve EXCLUSIVAMENTE un objeto JSON con la estructura { id, summary, waypoints: [{ id, title, description, coordinates: { lat, lng }, timeSpan: { start, end }, recommendations: ["recomendación 1", "recomendación 2"] }] }.';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(`${this.baseUrl}/v1/llm/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          prompt,
          engineType: 'REASONING_LLM',
          responseFormat: 'json',
          schemaId: 'tactical-route',
          systemInstruction: systemPrompt,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rawJson: unknown = await response.json();
      const envelope = IaGatewayLlmEnvelopeSchema.parse(rawJson);

      if (!envelope.success || !envelope.result) {
        const errorMsg =
          envelope.errors?.join('; ') || envelope.feedback || 'Fallo en generación de ruta táctica';
        throw new Error(`IA Gateway error (${envelope.exitCode}): ${errorMsg}`);
      }

      this.recordTelemetry(envelope.result.metrics, response.status);

      // Validación del Escudo Zod sobre el JSON retornado
      const parsed = TacticalRouteZodSchema.parse(envelope.result.json);

      // Mapeo a Entidades de Dominio puras
      const waypoints = parsed.waypoints.map((wp) => {
        const coords = wp.coordinates
          ? new GeoCoordinates(wp.coordinates.lat, wp.coordinates.lng)
          : undefined;
        const time = wp.timeSpan ? new TimeSpan(wp.timeSpan.start, wp.timeSpan.end) : undefined;
        return new TacticalWaypoint(wp.id, wp.title, wp.description, coords, time, wp.recommendations);
      });

      return new TacticalRoute(parsed.id, parsed.summary, waypoints);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  async generateText(
    prompt: string,
    engineType: 'FAST_LLM' | 'REASONING_LLM' = 'FAST_LLM'
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(`${this.baseUrl}/v1/llm/generate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          prompt,
          engineType,
          responseFormat: 'text',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rawJson: unknown = await response.json();
      const envelope = IaGatewayLlmEnvelopeSchema.parse(rawJson);

      if (!envelope.success || !envelope.result) {
        const errorMsg = envelope.errors?.join('; ') || envelope.feedback || 'Fallo en generateText';
        throw new Error(`IA Gateway error (${envelope.exitCode}): ${errorMsg}`);
      }

      this.recordTelemetry(envelope.result.metrics, response.status);

      return envelope.result.text;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      throw err;
    }
  }
}
