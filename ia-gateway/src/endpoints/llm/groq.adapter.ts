import Groq from 'groq-sdk';
import type { LlmAdapterResult, LlmInvocationParams } from './gemini.adapter.js';

export interface GroqAdapterConfig {
  apiKey?: string;
  defaultModel?: string;
}

export class GroqAdapter {
  private client: Groq | null = null;
  private readonly defaultModel: string;

  constructor(
    private readonly config: GroqAdapterConfig = {},
    customClient?: Groq
  ) {
    this.defaultModel = config.defaultModel ?? 'llama-3.3-70b-versatile';
    if (customClient) {
      this.client = customClient;
    } else if (config.apiKey) {
      this.client = new Groq({ apiKey: config.apiKey });
    }
  }

  async generate(params: LlmInvocationParams): Promise<LlmAdapterResult> {
    if (!this.client) {
      if (!this.config.apiKey) {
        throw new Error('GROQ_API_KEY no configurada en el gateway');
      }
      this.client = new Groq({ apiKey: this.config.apiKey });
    }

    const model = params.modelId ?? this.defaultModel;
    const t0 = performance.now();

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (params.systemInstruction) {
      messages.push({ role: 'system', content: params.systemInstruction });
    }
    messages.push({ role: 'user', content: params.prompt });

    const completion = await this.client.chat.completions.create({
      model,
      messages,
      response_format: params.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      temperature: params.temperature,
    });

    const durationMs = Math.round(performance.now() - t0);
    const text = completion.choices[0]?.message?.content ?? '';

    const usage = completion.usage;
    const promptTokens = usage?.prompt_tokens ?? null;
    const completionTokens = usage?.completion_tokens ?? null;
    const totalTokens = usage?.total_tokens ?? null;

    return {
      text,
      modelId: model,
      promptTokens,
      completionTokens,
      totalTokens,
      durationMs,
    };
  }
}
