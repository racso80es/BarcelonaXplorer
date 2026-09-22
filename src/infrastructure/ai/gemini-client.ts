import { GoogleGenAI } from '@google/genai';
import { AiGeneratorPort } from '@/application/ports/out/ai-generator.port';
import { TacticalRoute, TacticalWaypoint, GeoCoordinates, TimeSpan } from '@/domain/entities/tactical-route.entity';
import { TacticalRouteZodSchema } from '@/infrastructure/ai/schemas/tactical-route.schema';
import { DomainException } from '@/domain/exceptions/domain.exception';
import { TelemetryRepositoryPort } from '@/application/ports/out/telemetry-repository.port';
import { PrismaTelemetryRepository } from '@/infrastructure/repositories/prisma-telemetry.repository';
import { TelemetryEntry } from '@/domain/entities/telemetry-entry.entity';

export class GeminiClient implements AiGeneratorPort {
  private ai: GoogleGenAI;
  private models: string[];
  private telemetryRepo?: TelemetryRepositoryPort;

  constructor(telemetryRepo?: TelemetryRepositoryPort) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno.');
    }
    const modelsStr = process.env.GEMINI_MODELS || 'gemini-1.5-flash';
    this.models = modelsStr.split(',').map((m) => m.trim()).filter(Boolean);
    
    if (this.models.length === 0) {
      this.models = ['gemini-1.5-flash'];
    }

    this.ai = new GoogleGenAI({ apiKey });
    this.telemetryRepo = telemetryRepo ?? new PrismaTelemetryRepository();
  }

  async generateTacticalRoute(prompt: string): Promise<TacticalRoute> {
    let lastError: unknown;
    
    const systemPrompt = "Eres el Orquestador Táctico. Genera una ruta táctica. Devuelve EXCLUSIVAMENTE un objeto JSON con la estructura { id, summary, waypoints: [{ id, title, description, coordinates: { lat, lng }, timeSpan: { start, end }, recommendations }] }.";
    
    for (const model of this.models) {
      const startTime = Date.now();
      try {
        const response = await this.ai.models.generateContent({
          model: model,
          contents: `${systemPrompt}\n\nRequerimiento: ${prompt}`,
          config: {
            responseMimeType: "application/json",
          }
        });
        
        const durationMs = Date.now() - startTime;
        const rawText = response.text ?? '{}';
        const rawJson = JSON.parse(rawText);
        
        // Zod Shield (Sintaxis)
        const parsed = TacticalRouteZodSchema.parse(rawJson);
        
        // Mapeo a Entidades de Dominio puras (Reglas de Negocio)
        const waypoints = parsed.waypoints.map(wp => {
          const coords = wp.coordinates ? new GeoCoordinates(wp.coordinates.lat, wp.coordinates.lng) : undefined;
          const time = wp.timeSpan ? new TimeSpan(wp.timeSpan.start, wp.timeSpan.end) : undefined;
          return new TacticalWaypoint(
            wp.id,
            wp.title,
            wp.description,
            coords,
            time,
            wp.recommendations
          );
        });

        const tacticalRoute = new TacticalRoute(
          parsed.id,
          parsed.summary,
          waypoints
        );

        // Telemetría Cognitiva Fire-and-Forget (Interruptor Térmico)
        if (process.env.TELEMETRY_LLM_ENABLED === 'true' && this.telemetryRepo) {
          void this.telemetryRepo.log(
            new TelemetryEntry(
              'INFO',
              'LLM_ENGINE',
              `Inferencia Gemini exitosa (${model})`,
              {
                model,
                durationMs,
                promptSnippet: prompt.slice(0, 200),
                waypointsCount: waypoints.length,
              },
              200,
              durationMs
            )
          ).catch((e) => console.warn('[Telemetry LLM Fire-and-Forget Error]', e));
        }

        return tacticalRoute;
      } catch (error) {
        const durationMs = Date.now() - startTime;
        if (process.env.TELEMETRY_LLM_ENABLED === 'true' && this.telemetryRepo) {
          void this.telemetryRepo.log(
            new TelemetryEntry(
              error instanceof DomainException ? 'WARN' : 'ERROR',
              'LLM_ENGINE',
              `Fallo inferencia Gemini (${model}): ${error instanceof Error ? error.message : 'Error desconocido'}`,
              {
                model,
                durationMs,
                isDomainException: error instanceof DomainException,
                promptSnippet: prompt.slice(0, 200),
              },
              500,
              durationMs
            )
          ).catch((e) => console.warn('[Telemetry LLM Fire-and-Forget Error]', e));
        }

        if (error instanceof DomainException) {
          console.warn(`[GeminiClient] Excepción de Dominio en el modelo ${model} (IA alucinó lógica de negocio):`, error.message);
        } else {
          console.warn(`[GeminiClient] Falló el modelo ${model}:`, error);
        }
        lastError = error;
      }
    }
    
    throw lastError || new Error('Fallback chain falló: Todos los modelos de Gemini están saturados, falló el escudo Zod o las validaciones de Dominio.');
  }

  async generateText(prompt: string): Promise<string> {
    for (const model of this.models) {
      try {
        const response = await this.ai.models.generateContent({
          model: model,
          contents: prompt,
        });
        return response.text ?? '';
      } catch (error) {
        console.warn(`[GeminiClient generateText] Falló el modelo ${model}:`, error);
      }
    }
    throw new Error('Todos los modelos fallaron en generateText');
  }
}
