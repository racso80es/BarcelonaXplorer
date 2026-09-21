import { GoogleGenAI } from '@google/genai';
import { AiGeneratorPort } from '@/application/ports/out/ai-generator.port';

export class GeminiClient implements AiGeneratorPort {
  private ai: GoogleGenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno.');
    }
    this.model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateText(prompt: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
    });

    return response.text ?? '';
  }
}
