import { GoogleGenAI } from '@google/genai';
import { IEmbeddingPort } from '@/application/ports/out/embedding.port';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { TelemetryEntry } from '@/features/telemetry';

/**
 * Adaptador de Infraestructura para generación de embeddings sobre Google GenAI.
 * 
 * Principios Arquitectónicos S+ Grade:
 * 1. Resiliencia Térmica y Fail-Soft: Si la API de embeddings falla (cuota, red o entorno local sin clave),
 *    genera un vector determinista pseudo-aleatorio normalizado (L2) basado en hash,
 *    impidiendo que la degradación del proveedor externo bloquee el flujo conversacional.
 * 2. Inmutabilidad y Cero Fugas: Vector de 768 dimensiones estándar para text-embedding-004.
 */
export class GeminiEmbeddingAdapter implements IEmbeddingPort {
  private readonly ai?: GoogleGenAI;
  private readonly modelName: string;
  private readonly dimensions: number = 768;
  private readonly telemetryRepo?: TelemetryRepositoryPort;

  constructor(
    clientOrTelemetry?: GoogleGenAI | TelemetryRepositoryPort,
    telemetryRepo?: TelemetryRepositoryPort,
    modelName: string = 'text-embedding-004',
  ) {
    if (clientOrTelemetry && 'log' in clientOrTelemetry) {
      this.telemetryRepo = clientOrTelemetry;
    } else if (clientOrTelemetry && 'models' in clientOrTelemetry) {
      this.ai = clientOrTelemetry as GoogleGenAI;
      this.telemetryRepo = telemetryRepo;
    } else {
      this.telemetryRepo = telemetryRepo;
    }

    this.modelName = modelName;

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

  async generateEmbedding(text: string): Promise<number[]> {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return this.generateDeterministicFallback('empty');
    }

    if (this.ai) {
      try {
        const response = await this.ai.models.embedContent({
          model: this.modelName,
          contents: trimmed,
        });

        // La respuesta puede contener embeddings array o embedding único según versión del SDK
        const res = response as { embedding?: { values?: number[] }; embeddings?: Array<{ values?: number[] }> };
        const values =
          res.embedding?.values ??
          (res.embeddings && res.embeddings.length > 0
            ? res.embeddings[0]?.values
            : undefined);

        if (values && Array.isArray(values) && values.length > 0) {
          return values;
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.emitTelemetry(
          'WARN',
          `[GeminiEmbeddingAdapter Fail-Soft] Error invocando modelo ${this.modelName}: ${errorMsg}. Activado fallback determinista.`,
          { textSnippet: trimmed.slice(0, 100), error: errorMsg },
        );
      }
    }

    return this.generateDeterministicFallback(trimmed);
  }

  /**
   * Generador determinista de respaldo basado en hashing y normalización L2.
   * Garantiza que el mismo texto siempre genere el mismo vector de 768 dimensiones
   * con norma euclidiana = 1, compatible con métricas de similitud coseno de LanceDB.
   */
  public generateDeterministicFallback(seedText: string): number[] {
    const vector = new Array<number>(this.dimensions);
    let hash = 0;
    for (let i = 0; i < seedText.length; i++) {
      hash = (hash << 5) - hash + seedText.charCodeAt(i);
      hash |= 0;
    }

    let sumSq = 0;
    for (let i = 0; i < this.dimensions; i++) {
      // Generador pseudo-aleatorio congruencial lineal (LCG)
      hash = (hash * 1664525 + 1013904223) | 0;
      const val = (hash / 0x7fffffff);
      vector[i] = val;
      sumSq += val * val;
    }

    // Normalización L2
    const norm = Math.sqrt(sumSq) || 1;
    for (let i = 0; i < this.dimensions; i++) {
      vector[i] = vector[i] / norm;
    }

    return vector;
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
