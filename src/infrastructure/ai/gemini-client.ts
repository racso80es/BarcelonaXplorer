import { GoogleGenAI } from '@google/genai';
import { AiGeneratorPort } from '@/application/ports/out/ai-generator.port';

export class GeminiClient implements AiGeneratorPort {
  private ai: GoogleGenAI;
  private models: string[];

  constructor() {
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

  async generateText(prompt: string): Promise<string> {
    let lastError: unknown;
    
    for (const model of this.models) {
      try {
        const response = await this.ai.models.generateContent({
          model: model,
          contents: prompt,
        });
        return response.text ?? '';
      } catch (error) {
        lastError = error;
        // Si falla por cuota o saturación, captura silenciosamente y avanza al siguiente modelo
      }
    }
    
    // Si la matriz se agota por completo, lanza la excepción a la capa de aplicación
    throw lastError || new Error('Fallback chain falló: Todos los modelos de Gemini están saturados.');
  }
}
