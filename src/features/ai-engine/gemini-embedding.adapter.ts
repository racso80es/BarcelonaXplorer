import { GoogleGenAI } from '@google/genai';
import { IEmbeddingPort, EmbeddingGenerationResult } from '@/features/ai-engine/embedding.port';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { TelemetryEntry } from '@/features/telemetry';
import {
  buildDeterministicFallbackVector,
  EMBEDDING_DIMENSIONS,
} from '@/features/ai-engine/deterministic-embedding-fallback';

const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-001';

type EmbeddingFailureKind = 'permanent' | 'transient';

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

  async generateEmbedding(text: string): Promise<EmbeddingGenerationResult> {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return this.fallbackResult('empty');
    }

    if (this.ai) {
      try {
        const response = await this.ai.models.embedContent({
          model: this.modelName,
          contents: trimmed,
          config: {
            outputDimensionality: this.dimensions,
          },
        });

        const res = response as {
          embedding?: { values?: number[] };
          embeddings?: Array<{ values?: number[] }>;
        };
        const values =
          res.embedding?.values ??
          (res.embeddings && res.embeddings.length > 0
            ? res.embeddings[0]?.values
            : undefined);

        if (values && Array.isArray(values) && values.length === this.dimensions) {
          return { vector: values, source: 'provider' };
        }

        if (values && Array.isArray(values) && values.length > 0) {
          this.emitTelemetry(
            'ERROR',
            `[GeminiEmbeddingAdapter] Dimensión inesperada del proveedor (${values.length} ≠ ${this.dimensions}). Vector descartado.`,
            {
              model: this.modelName,
              provider: 'google_genai',
              receivedLength: values.length,
            },
          );
        }
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
      }
    }

    return this.fallbackResult(trimmed);
  }

  /** Expuesto para purga LanceDB y tests (PBI-STEEL-002). */
  public generateDeterministicFallback(seedText: string): number[] {
    return buildDeterministicFallbackVector(seedText, this.dimensions);
  }

  private fallbackResult(seedText: string): EmbeddingGenerationResult {
    return {
      vector: buildDeterministicFallbackVector(seedText, this.dimensions),
      source: 'fallback',
    };
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
