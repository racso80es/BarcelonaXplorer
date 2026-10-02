import { z } from 'zod';
import type { DecisionInput, DecisionOutput } from '../../schemas/decision.schema.js';
import type { GatewayMetrics } from '../../schemas/llm.schema.js';

export interface JevAdapterConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

const JevNoulAnswerSchema = z.object({
  type: z.literal('noul'),
  noul: z.number().min(0).max(1),
});

const JevChoiceAnswerSchema = z.object({
  type: z.literal('choice'),
  choice: z.string(),
  probabilities: z.record(z.string(), z.number()),
  confidence: z.number().min(0).max(1).optional().default(1),
});

const JevSystemOneResponseSchema = z.object({
  model: z.string(),
  answers: z.record(z.string(), z.union([JevNoulAnswerSchema, JevChoiceAnswerSchema, z.record(z.string(), z.unknown())])),
  usage: z
    .object({
      input_tokens: z.number().optional(),
      output_tokens: z.number().optional(),
    })
    .optional(),
});

export class JevAdapterError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 502,
    public readonly code: string = 'JEV_ERROR'
  ) {
    super(message);
    this.name = 'JevAdapterError';
  }
}

export class JevAdapter {
  constructor(
    private readonly config: JevAdapterConfig,
    private readonly fetchFn: typeof fetch = fetch
  ) {}

  async evaluate(input: DecisionInput): Promise<DecisionOutput> {
    if (!this.config.apiKey) {
      throw new JevAdapterError('JEV_API_KEY no configurada en el gateway', 503, 'JEV_KEY_MISSING');
    }

    const t0 = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    const questionsPayload =
      input.primitive === 'noul'
        ? {
            eval_question: {
              type: 'noul',
              instructions: input.instruction,
            },
          }
        : {
            eval_question: {
              type: 'choice',
              instructions: input.instruction,
              choices: input.choices,
            },
          };

    const requestBody = {
      model: this.config.model,
      state: input.state,
      questions: questionsPayload,
    };

    try {
      const url = `${this.config.baseUrl.replace(/\/+$/, '')}/v1/systemone`;
      const response = await this.fetchFn(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const durationMs = Math.round(performance.now() - t0);

      if (!response.ok) {
        let errorDetail = '';
        try {
          const body = (await response.json()) as { error?: { message?: string } };
          if (typeof body?.error?.message === 'string') {
            errorDetail = body.error.message;
          }
        } catch {
          // Si no es json se descarta
        }

        const statusLabels: Record<number, string> = {
          401: 'Clave de API de Jev inválida o revocada',
          402: 'Saldo de tokens o créditos insuficiente en Jev AI',
          429: 'Límite de cuota excedido en Jev AI',
          502: 'Gateway de Jev AI no disponible upstream',
          503: 'Servicio Jev AI en mantenimiento',
        };

        const errorMsg =
          errorDetail ||
          statusLabels[response.status] ||
          `Error HTTP ${response.status} de Jev AI`;

        throw new JevAdapterError(errorMsg, response.status, 'JEV_UPSTREAM_ERROR');
      }

      const rawJson: unknown = await response.json();
      const parsed = JevSystemOneResponseSchema.safeParse(rawJson);

      if (!parsed.success) {
        throw new JevAdapterError(
          'Respuesta de Jev AI con estructura inválida',
          502,
          'JEV_MALFORMED_RESPONSE'
        );
      }

      const answerRaw = parsed.data.answers['eval_question'];
      const inputTokens = parsed.data.usage?.input_tokens ?? null;
      const outputTokens = parsed.data.usage?.output_tokens ?? null;
      const totalTokens =
        inputTokens !== null && outputTokens !== null
          ? inputTokens + outputTokens
          : null;

      const metrics: GatewayMetrics = {
        engineType: 'TYPED_DECISION',
        provider: 'JEV',
        modelId: parsed.data.model || this.config.model,
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens,
        fallbackTriggered: false,
        attemptedProviders: ['JEV'],
        attemptedModels: [`JEV:${parsed.data.model || this.config.model}`],
        durationMs,
        grounded: false,
      };

      if (input.primitive === 'noul') {
        const noulParsed = JevNoulAnswerSchema.safeParse(answerRaw);
        if (!noulParsed.success) {
          throw new JevAdapterError(
            'Respuesta noul de Jev AI malformada',
            502,
            'JEV_MALFORMED_ANSWER'
          );
        }
        return {
          primitive: 'noul',
          probability: noulParsed.data.noul,
          isAffirmative: noulParsed.data.noul >= 0.5,
          metrics,
        };
      } else {
        const choiceParsed = JevChoiceAnswerSchema.safeParse(answerRaw);
        if (!choiceParsed.success) {
          throw new JevAdapterError(
            'Respuesta choice de Jev AI malformada',
            502,
            'JEV_MALFORMED_ANSWER'
          );
        }
        return {
          primitive: 'choice',
          selectedChoice: choiceParsed.data.choice,
          confidence: choiceParsed.data.confidence,
          probabilities: choiceParsed.data.probabilities,
          metrics,
        };
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof JevAdapterError) {
        throw err;
      }
      const isAbort =
        (err instanceof Error && err.name === 'AbortError') ||
        (err as { type?: string })?.type === 'aborted';

      const message = isAbort
        ? `Timeout en comunicación con Jev AI (${this.config.timeoutMs}ms)`
        : err instanceof Error
          ? err.message
          : 'Fallo desconocido al conectar con Jev AI';

      throw new JevAdapterError(message, 504, isAbort ? 'JEV_TIMEOUT' : 'JEV_NETWORK_ERROR');
    }
  }
}
