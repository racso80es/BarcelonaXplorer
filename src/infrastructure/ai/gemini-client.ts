import { GoogleGenAI } from '@google/genai';
import { AiGeneratorPort } from '@/application/ports/out/ai-generator.port';
import { TacticalRoute, TacticalWaypoint, GeoCoordinates, TimeSpan } from '@/domain/entities/tactical-route.entity';
import { TacticalRouteZodSchema } from '@/infrastructure/ai/schemas/tactical-route.schema';
import { DomainException } from '@/domain/exceptions/domain.exception';
import { TelemetryRepositoryPort } from '@/application/ports/out/telemetry-repository.port';

/**
 * Adaptador de Infraestructura: Cliente de Google Gemini AI.
 * 
 * Cumple con el Principio de No Auto-Auditoría:
 * Se enfoca exclusivamente en la interacción con el proveedor externo de IA,
 * la validación del Escudo Zod y la instanciación de Entidades Puras de Dominio.
 * La telemetría y clasificación termodinámica recaen en la capa de aplicación.
 */
export class GeminiClient implements AiGeneratorPort {
  private ai: GoogleGenAI;
  private models: string[];

  constructor(_telemetryRepo?: TelemetryRepositoryPort) {
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
  }

  async generateTacticalRoute(prompt: string): Promise<TacticalRoute> {
    let lastError: unknown;
    
    const systemPrompt =
      'Eres el Orquestador Táctico de BarcelonaXplorer. Genera una ruta táctica circunscrita estricta y exclusivamente a la ciudad de Barcelona (España) y sus distritos oficiales. Todas las coordenadas (lat, lng), puntos de interés, actividades y recomendaciones deben ubicarse físicamente dentro del término municipal de Barcelona o sus accesos de tránsito autorizados. Queda terminantemente prohibido generar paradas en Madrid u otras ciudades foráneas. Devuelve EXCLUSIVAMENTE un objeto JSON con la estructura { id, summary, waypoints: [{ id, title, description, coordinates: { lat, lng }, timeSpan: { start, end }, recommendations: ["recomendación 1", "recomendación 2"] }] }.';
    
    for (const model of this.models) {
      try {
        const response = await this.ai.models.generateContent({
          model: model,
          contents: `${systemPrompt}\n\nRequerimiento: ${prompt}`,
          config: {
            responseMimeType: "application/json",
          }
        });
        
        const rawText = response.text ?? '{}';
        const rawJson = JSON.parse(rawText);
        
        // Escudo Zod (Sintaxis)
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

        return new TacticalRoute(
          parsed.id,
          parsed.summary,
          waypoints
        );
      } catch (error) {
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
