import Groq from 'groq-sdk';
import type {
  FastContextDto,
  FastInteractionAiPort,
} from '@/application/ports/out/fast-interaction-ai.port';

/**
 * Mensaje genérico devuelto cuando la API de Groq falla.
 * Degradación elegante: el usuario recibe un consejo útil, nunca un error crudo.
 */
const FALLBACK_MESSAGE =
  '⚠️ Radar BX temporalmente fuera de alcance. Consejo general: confirma horarios en la web oficial antes de desplazarte.';

/**
 * Fallback del System Prompt si la variable de entorno no está configurada.
 */
const DEFAULT_SYSTEM_PROMPT =
  'Eres el Radar de BarcelonaXplorer. Da un único consejo directo de 1 frase.';

/**
 * Fallback de max_tokens si la variable de entorno no está configurada.
 */
const DEFAULT_MAX_TOKENS = 100;

/**
 * Adaptador de infraestructura para inferencia rápida via Groq.
 *
 * Implementa el puerto FastInteractionAiPort convirtiendo la respuesta
 * streaming de Groq en un ReadableStream (Web Streams API) compatible
 * con el consumo SSE en Next.js App Router.
 */
export class GroqFastAiAdapter implements FastInteractionAiPort {
  private readonly client: Groq;
  private readonly model: string;

  constructor(client?: Groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GROQ_API_KEY no está configurada en las variables de entorno.',
      );
    }
    this.model = process.env.GROQ_FAST_MODEL ?? 'qwen/qwen3.8-27b';
    this.client = client ?? new Groq({ apiKey });
  }

  async generateImmediateContextStream(
    context: FastContextDto,
  ): Promise<ReadableStream> {
    try {
      const systemPrompt =
        process.env.GROQ_RADAR_SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT;

      const maxTokens = parseInt(
        process.env.GROQ_RADAR_MAX_TOKENS || String(DEFAULT_MAX_TOKENS),
        10,
      );

      const userMessage = this.buildUserMessage(context);

      const stream = await this.client.chat.completions.create({
        model: this.model,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.6,
        max_tokens: maxTokens,
      });

      return this.toReadableStream(stream);
    } catch {
      return this.createFallbackStream();
    }
  }

  /**
   * Construye el mensaje de usuario en formato compacto.
   * Estructura: "Contexto: {hora} - {ubicación}. Intención: {intención}"
   */
  private buildUserMessage(context: FastContextDto): string {
    const contextParts: string[] = [];

    if (context.localTime) {
      contextParts.push(context.localTime);
    }
    if (context.currentLocation) {
      contextParts.push(context.currentLocation);
    }

    const contextStr = contextParts.length > 0
      ? `Contexto: ${contextParts.join(' - ')}. `
      : '';

    return `${contextStr}Intención: ${context.intention}`;
  }

  /**
   * Convierte el AsyncIterable de Groq en un ReadableStream (Web Streams API).
   * Cada chunk de contenido delta se codifica como texto UTF-8.
   */
  private toReadableStream(
    groqStream: AsyncIterable<Groq.Chat.Completions.ChatCompletionChunk>,
  ): ReadableStream {
    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of groqStream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch {
          // Si el streaming falla a mitad de transmisión,
          // cerramos el stream limpiamente sin tumbar el servidor.
          controller.close();
        }
      },
    });
  }

  /**
   * Crea un ReadableStream con el mensaje de degradación elegante.
   * Se devuelve cuando cualquier error impide la conexión con Groq.
   */
  private createFallbackStream(): ReadableStream {
    const encoder = new TextEncoder();

    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(FALLBACK_MESSAGE));
        controller.close();
      },
    });
  }
}
