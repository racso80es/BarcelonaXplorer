import Groq from 'groq-sdk';
import { GeographicBounceGeneratorPort } from '@/application/ports/out/geographic-bounce-generator.port';
import {
  GEOGRAPHIC_REBOUND_SYSTEM_PROMPT,
  buildGeographicReboundUserPrompt,
} from '@/infrastructure/ai/groq/prompts/geographic-rebound.prompt';

/**
 * Adaptador de Infraestructura para la generación de Rebotes Tácticos con Groq (SLM Ligero).
 *
 * Cuenta con degradación determinista elegante si la API de Groq no responde.
 */
export class GroqGeographicBounceGenerator implements GeographicBounceGeneratorPort {
  private readonly client?: Groq;
  private readonly model: string;

  constructor(client?: Groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      this.client = client ?? new Groq({ apiKey });
    }
    this.model = process.env.GROQ_FAST_MODEL ?? 'qwen/qwen3.8-27b';
  }

  async generateBounceMessage(rejectedEntity: string, prompt: string): Promise<string> {
    const fallbackMessage = `Mi radar táctico está calibrado exclusivamente para el asfalto de Barcelona. Si tienes planeado pasarte por la capital catalana, avísame y forjamos una ruta a medida.`;

    if (!this.client) {
      return fallbackMessage;
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: GEOGRAPHIC_REBOUND_SYSTEM_PROMPT },
          { role: 'user', content: buildGeographicReboundUserPrompt(rejectedEntity, prompt) },
        ],
        temperature: 0.3,
        max_tokens: 60,
      });

      const message = completion.choices[0]?.message?.content?.trim();
      return message && message.length > 0 ? message : fallbackMessage;
    } catch {
      return fallbackMessage;
    }
  }
}
