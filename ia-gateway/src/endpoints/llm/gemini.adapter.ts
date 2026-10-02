import { GoogleGenAI } from '@google/genai';

export interface GeminiAdapterConfig {
  apiKey?: string;
  defaultModel?: string;
}

export interface GroundingSource {
  uri: string;
  title?: string;
}

export interface LlmAdapterResult {
  text: string;
  modelId: string;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  durationMs: number;
  groundingSources?: GroundingSource[];
}

export interface LlmInvocationParams {
  prompt: string;
  systemInstruction?: string;
  responseFormat?: 'text' | 'json';
  modelId?: string;
  temperature?: number;
  grounding?: boolean;
}

export class GeminiAdapter {
  private client: GoogleGenAI | null = null;
  private readonly defaultModel: string;

  constructor(
    private readonly config: GeminiAdapterConfig = {},
    customClient?: GoogleGenAI
  ) {
    this.defaultModel = config.defaultModel ?? 'gemini-2.5-flash';
    if (customClient) {
      this.client = customClient;
    } else if (config.apiKey) {
      this.client = new GoogleGenAI({ apiKey: config.apiKey });
    }
  }

  async generate(params: LlmInvocationParams): Promise<LlmAdapterResult> {
    if (!this.client) {
      if (!this.config.apiKey) {
        throw new Error('GEMINI_API_KEY no configurada en el gateway');
      }
      this.client = new GoogleGenAI({ apiKey: this.config.apiKey });
    }

    const model = params.modelId ?? this.defaultModel;
    const t0 = performance.now();

    const configPayload: Record<string, unknown> = {};
    if (params.responseFormat === 'json') {
      configPayload['responseMimeType'] = 'application/json';
    }
    if (params.temperature !== undefined) {
      configPayload['temperature'] = params.temperature;
    }
    if (params.systemInstruction) {
      configPayload['systemInstruction'] = params.systemInstruction;
    }
    if (params.grounding === true) {
      configPayload['tools'] = [{ googleSearch: {} }];
    }

    const response = await this.client.models.generateContent({
      model,
      contents: params.prompt,
      config: Object.keys(configPayload).length > 0 ? configPayload : undefined,
    });

    const durationMs = Math.round(performance.now() - t0);
    const text = response.text ?? '';

    const usage = response.usageMetadata;
    const promptTokens = usage?.promptTokenCount ?? null;
    const completionTokens = usage?.candidatesTokenCount ?? null;
    const totalTokens = usage?.totalTokenCount ?? null;

    const groundingSources: GroundingSource[] = [];
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata as
      | {
          groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
        }
      | undefined;

    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri) {
          groundingSources.push({
            uri: chunk.web.uri,
            title: chunk.web.title ?? undefined,
          });
        }
      }
    }

    return {
      text,
      modelId: model,
      promptTokens,
      completionTokens,
      totalTokens,
      durationMs,
      groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
    };
  }
}
