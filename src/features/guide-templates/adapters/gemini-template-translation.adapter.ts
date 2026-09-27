import { GoogleGenAI } from '@google/genai';
import { ITemplateTranslationServicePort } from '../ports/template-translation-service.port';
import { GuideTemplateDetailDTO } from '../domain/guide-template.schema';
import {
  SupportedLanguage,
  LocalizedTemplateTranslation,
  LocalizedTemplateTranslationSchema,
} from '@/features/i18n';
import { TelemetryRepositoryPort, TelemetryEntry } from '@/features/telemetry';

export interface GeminiTemplateTranslationAdapterOptions {
  timeoutMs?: number;
  model?: string;
}

/**
 * Adaptador de Infraestructura: Traducción Reactiva de Templates con Google Gemini.
 * 
 * Cumple con los Axiomas S+ Grade:
 * 1. SingleFlight (Anti-Thundering Herd): Mapa en memoria para reutilizar promesas
 *    activas sobre la misma tupla (templateId, language).
 * 2. Ventana de Inferencia Resiliente: Timeout por defecto de 8000ms.
 * 3. Tolerancia Cero a la Inferencia: Validación estricta con LocalizedTemplateTranslationSchema.
 */
export class GeminiTemplateTranslationAdapter implements ITemplateTranslationServicePort {
  private static readonly inFlightTranslations = new Map<
    string,
    Promise<LocalizedTemplateTranslation>
  >();

  private readonly ai: GoogleGenAI;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly telemetryRepo?: TelemetryRepositoryPort;

  constructor(
    clientOrTelemetry?: GoogleGenAI | TelemetryRepositoryPort,
    telemetryRepo?: TelemetryRepositoryPort,
    options?: GeminiTemplateTranslationAdapterOptions,
  ) {
    if (clientOrTelemetry && 'log' in clientOrTelemetry) {
      this.telemetryRepo = clientOrTelemetry;
    } else {
      this.telemetryRepo = telemetryRepo;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const hasInjectedClient = Boolean(clientOrTelemetry && 'models' in clientOrTelemetry);

    if (!apiKey && !hasInjectedClient) {
      throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno.');
    }

    this.model = options?.model || process.env.GEMINI_MODELS?.split(',')[0]?.trim() || 'gemini-1.5-flash';
    this.timeoutMs = options?.timeoutMs ?? 8000;

    if (hasInjectedClient) {
      this.ai = clientOrTelemetry as GoogleGenAI;
    } else {
      this.ai = new GoogleGenAI({ apiKey: apiKey! });
    }
  }

  public async translateTemplate(
    template: GuideTemplateDetailDTO,
    targetLanguage: SupportedLanguage,
  ): Promise<LocalizedTemplateTranslation> {
    const flightKey = `${template.id}:${targetLanguage}`;

    // 1. SingleFlight: si ya hay una traducción en curso para este template e idioma, reutilizar
    const existingFlight = GeminiTemplateTranslationAdapter.inFlightTranslations.get(flightKey);
    if (existingFlight) {
      return existingFlight;
    }

    const flightPromise = this.executeTranslationWithTimeout(template, targetLanguage);
    GeminiTemplateTranslationAdapter.inFlightTranslations.set(flightKey, flightPromise);

    try {
      return await flightPromise;
    } finally {
      GeminiTemplateTranslationAdapter.inFlightTranslations.delete(flightKey);
    }
  }

  private async executeTranslationWithTimeout(
    template: GuideTemplateDetailDTO,
    targetLanguage: SupportedLanguage,
  ): Promise<LocalizedTemplateTranslation> {
    const startTime = Date.now();

    const itemsPayload = template.items.map((item) => ({
      itemId: item.id,
      title: item.title,
      description: item.description,
    }));

    const systemPrompt = `Eres el Traductor Editorial Especializado de BarcelonaXplorer.
Tu misión es traducir con precisión hiperlocal y elegancia cultural el contenido de una guía temática de Barcelona al idioma objetivo: '${targetLanguage}'.
Conserva intactos nombres propios geográficos canónicos de Barcelona (ej. "Sagrada Família", "Barri Gòtic", "Passeig de Gràcia", "La Boqueria", "Rambla").
Devuelve EXCLUSIVAMENTE un objeto JSON válido con la estructura:
{
  "templateId": "${template.id}",
  "language": "${targetLanguage}",
  "title": "título traducido",
  "abstract": "resumen traducido",
  "items": [
    { "itemId": "id_del_item", "title": "título traducido", "description": "descripción traducida" }
  ]
}`;

    const userPrompt = JSON.stringify({
      templateId: template.id,
      title: template.title,
      abstract: template.abstract,
      items: itemsPayload,
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `Timeout de ${this.timeoutMs}ms excedido durante la traducción del template ${template.id} al idioma ${targetLanguage}`,
          ),
        );
      }, this.timeoutMs);
    });

    const generationPromise = (async () => {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: `${systemPrompt}\n\nContenido a traducir:\n${userPrompt}`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text ?? '{}';
      const parsedJson = JSON.parse(rawText);
      return LocalizedTemplateTranslationSchema.parse(parsedJson);
    })();

    try {
      const result = await Promise.race([generationPromise, timeoutPromise]);
      const durationMs = Date.now() - startTime;

      if (this.telemetryRepo) {
        void this.telemetryRepo.log(
          new TelemetryEntry(
            'INFO',
            'LLM_ENGINE',
            `[GeminiTemplateTranslation] Traducción completada con éxito para template ${template.id} [${targetLanguage}]`,
            { templateId: template.id, targetLanguage, durationMs },
            200,
            durationMs,
          ),
        ).catch(() => {});
      }

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      if (this.telemetryRepo) {
        void this.telemetryRepo.log(
          new TelemetryEntry(
            'WARN',
            'LLM_ENGINE',
            `[GeminiTemplateTranslation] Fallo en traducción de template ${template.id} [${targetLanguage}]: ${error instanceof Error ? error.message : String(error)}`,
            { templateId: template.id, targetLanguage, durationMs },
            500,
            durationMs,
          ),
        ).catch(() => {});
      }
      throw error;
    }
  }
}
