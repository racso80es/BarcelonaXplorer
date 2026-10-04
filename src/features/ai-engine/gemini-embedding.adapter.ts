import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { IEmbeddingPort } from '@/features/ai-engine/embedding.port';
import { TelemetryRepositoryPort, TelemetryEntry } from '@/features/telemetry';
import { EMBEDDING_DIMENSIONS } from '@/features/ai-engine/deterministic-embedding-fallback';
import {
  OperationEnvelope,
  createSuccessEnvelope,
  createErrorEnvelope,
} from '@/shared/operation-envelope';

const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-001';

type EmbeddingFailureKind = 'permanent' | 'transient';

const GeminiEmbeddingResponseSchema = z.object({
  embedding: z
    .object({
      values: z.array(z.number()),
    })
    .optional(),
  embeddings: z
    .array(
      z.object({
        values: z.array(z.number()),
      }),
    )
    .optional(),
});

function resolveEmbeddingModelName(override?: string): string {
  const fromEnv = process.env.GEMINI_EMBEDDING_MODEL?.trim();
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }
  if (override && override.trim().length > 0) {
    return override.trim();
  }
  return DEFAULT_EMBEDDING_MODEL;
}

function classifyEmbeddingError(err: unknown): {
  kind: EmbeddingFailureKind;
  httpCode?: number;
  message: string;
} {
  const message = err instanceof Error ? err.message : String(err);
  const codeMatch = message.match(/\b(401|403|404|429|5\d{2})\b/);
  const httpCode = codeMatch ? Number.parseInt(codeMatch[1], 10) : undefined;

  if (httpCode === 401 || httpCode === 403 || httpCode === 404) {
    return { kind: 'permanent', httpCode, message };
  }

  const lower = message.toLowerCase();
  if (
    lower.includes('fetch failed') ||
    lower.includes('timeout') ||
    lower.includes('econnreset') ||
    lower.includes('network') ||
    (httpCode !== undefined && httpCode >= 500) ||
    httpCode === 429
  ) {
    return { kind: 'transient', httpCode, message };
  }

  return { kind: 'transient', httpCode, message };
}

/**
 * Adaptador de Infraestructura para generación de embeddings sobre Google GenAI.
 * Implementa contrato fail-closed con OperationEnvelope (PBI-MEM-006).
 */
export class GeminiEmbeddingAdapter implements IEmbeddingPort {
  private readonly ai?: GoogleGenAI;
  private readonly modelName: string;
  private readonly dimensions: number = EMBEDDING_DIMENSIONS;
  private readonly telemetryRepo?: TelemetryRepositoryPort;

  constructor(
    clientOrTelemetry?: GoogleGenAI | TelemetryRepositoryPort,
    telemetryRepo?: TelemetryRepositoryPort,
    modelName?: string,
  ) {
    if (clientOrTelemetry && 'log' in clientOrTelemetry) {
      this.telemetryRepo = clientOrTelemetry;
    } else if (clientOrTelemetry && 'models' in clientOrTelemetry) {
      this.ai = clientOrTelemetry as GoogleGenAI;
      this.telemetryRepo = telemetryRepo;
    } else {
      this.telemetryRepo = telemetryRepo;
    }

    this.modelName = resolveEmbeddingModelName(modelName);

    if (!this.ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey.trim().length > 0) {
        this.ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      }
    }
  }

  getDimensions(): number {
    return this.dimensions;
  }

  async generateEmbedding(text: string): Promise<OperationEnvelope<number[]>> {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return createErrorEnvelope<number[]>(
        ['Texto vacío proporcionado para vectorización'],
        400,
        'El texto debe contener caracteres no vacíos.',
      );
    }

    if (!this.ai) {
      return createErrorEnvelope<number[]>(
        ['Proveedor Gemini no inicializado (sin API key)'],
        503,
        'Servicio de embeddings no disponible',
      );
    }

    try {
      const rawResponse = await this.ai.models.embedContent({
        model: this.modelName,
        contents: trimmed,
        config: {
          outputDimensionality: this.dimensions,
        },
      });

      const parsedResponse = GeminiEmbeddingResponseSchema.safeParse(rawResponse);
      if (parsedResponse.success) {
        const values =
          parsedResponse.data.embedding?.values ??
          parsedResponse.data.embeddings?.[0]?.values;

        if (values) {
          const VectorSchema = z.array(z.number().finite()).length(this.dimensions);
          const parsedVector = VectorSchema.safeParse(values);

          if (parsedVector.success) {
            return createSuccessEnvelope<number[]>(parsedVector.data);
          }

          this.emitTelemetry(
            'ERROR',
            `[GeminiEmbeddingAdapter] Dimensión inesperada del proveedor (${values.length} ≠ ${this.dimensions}). Vector descartado.`,
            {
              model: this.modelName,
              provider: 'google_genai',
              receivedLength: values.length,
            },
          );

          return createErrorEnvelope<number[]>(
            [`Dimensión inesperada del proveedor (${values.length} ≠ ${this.dimensions})`],
            502,
            'El proveedor devolvió una dimensión de vector inválida',
          );
        }
      }

      this.emitTelemetry(
        'ERROR',
        `[GeminiEmbeddingAdapter] Respuesta del proveedor con esquema inválido. Vector descartado.`,
        {
          model: this.modelName,
          provider: 'google_genai',
        },
      );

      return createErrorEnvelope<number[]>(
        ['Respuesta del proveedor con formato no reconocible'],
        502,
        'Esquema de respuesta no conforme',
      );
    } catch (err: unknown) {
      const classified = classifyEmbeddingError(err);
      const level = classified.kind === 'permanent' ? 'ERROR' : 'WARN';
      const prefix =
        classified.kind === 'permanent'
          ? '[GeminiEmbeddingAdapter] Error permanente del proveedor'
          : '[GeminiEmbeddingAdapter Fail-Soft] Error transitorio';

      this.emitTelemetry(level, `${prefix} (${this.modelName}): ${classified.message}`, {
        textSnippet: trimmed.slice(0, 100),
        error: classified.message,
        provider: 'google_genai',
        model: this.modelName,
        httpCode: classified.httpCode,
      });

      const exitCode = classified.httpCode ?? (classified.kind === 'permanent' ? 500 : 503);
      return createErrorEnvelope<number[]>([classified.message], exitCode, prefix);
    }
  }

  private emitTelemetry(
    level: 'WARN' | 'ERROR',
    message: string,
    payload: Record<string, unknown>,
  ): void {
    if (!this.telemetryRepo) return;
    const entry = new TelemetryEntry(level, 'LLM_ENGINE', message, payload, 500, 0);
    this.telemetryRepo.log(entry).catch(() => {});
  }
}
