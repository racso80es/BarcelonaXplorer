import type { IncomingMessage, ServerResponse } from 'node:http';
import type { HealthSensor } from '../../health/health-sensor.js';
import type { ProviderId } from '../../health/types.js';
import { LlmGenerateInputSchema } from '../../schemas/llm.schema.js';
import type { GatewayMetrics, LlmGenerateOutput } from '../../schemas/llm.schema.js';
import { parseJsonBody, sendJson } from '../../server.js';
import { createErrorEnvelope, createSuccessEnvelope } from '../../shared/envelope.js';
import type { GeminiAdapter } from './gemini.adapter.js';
import type { GroqAdapter } from './groq.adapter.js';
import { getZodSchemaById } from './schemas-registry.js';

export function createLlmHandler(
  geminiAdapter: GeminiAdapter,
  groqAdapter: GroqAdapter,
  healthSensor: HealthSensor
) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    let rawBody: unknown;
    try {
      rawBody = await parseJsonBody(req);
    } catch (err) {
      sendJson(
        res,
        400,
        createErrorEnvelope(
          [err instanceof Error ? err.message : 'Error al parsear cuerpo JSON'],
          400,
          'Payload JSON inválido'
        )
      );
      return;
    }

    const validation = LlmGenerateInputSchema.safeParse(rawBody);
    if (!validation.success) {
      const errorMessages = validation.error.issues.map(
        (issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`
      );
      sendJson(
        res,
        400,
        createErrorEnvelope(
          errorMessages,
          400,
          'Cuerpo de petición no conforme al esquema de generación LLM'
        )
      );
      return;
    }

    const { prompt, engineType, responseFormat, schemaId, systemInstruction, temperature } =
      validation.data;

    // Matriz declarativa acordada en D-3
    const candidateOrder: ProviderId[] =
      engineType === 'FAST_LLM' ? ['GROQ', 'GOOGLE'] : ['GOOGLE', 'GROQ'];

    // Filtramos proveedores sanos (CLOSED o HALF_OPEN)
    let candidatesToTry = candidateOrder.filter((p) =>
      healthSensor.getBreaker(p).canExecute()
    );

    // Si todos los circuitos están abiertos, forzamos intentar el primer candidato antes de declarar agotamiento
    if (candidatesToTry.length === 0) {
      candidatesToTry = candidateOrder;
    }

    const attemptedProviders: string[] = [];
    const collectedErrors: string[] = [];

    for (const provider of candidatesToTry) {
      attemptedProviders.push(provider);
      const t0 = performance.now();

      try {
        const adapter = provider === 'GOOGLE' ? geminiAdapter : groqAdapter;
        const result = await adapter.generate({
          prompt,
          systemInstruction,
          responseFormat,
          temperature,
        });

        let parsedJsonRecord: Record<string, unknown> | undefined = undefined;

        // CA-4: Conformidad estructural Zod si responseFormat es 'json'
        if (responseFormat === 'json') {
          let parsedUnknown: unknown;
          try {
            parsedUnknown = JSON.parse(result.text);
          } catch {
            const durationMs = Math.round(performance.now() - t0);
            healthSensor.recordFailure(provider, durationMs, 422);
            collectedErrors.push(`${provider}: La respuesta generada no es un JSON válido`);
            continue; // Intenta siguiente proveedor
          }

          const schema = getZodSchemaById(schemaId);
          const schemaValidation = schema.safeParse(parsedUnknown);

          if (!schemaValidation.success) {
            const durationMs = Math.round(performance.now() - t0);
            healthSensor.recordFailure(provider, durationMs, 422);
            collectedErrors.push(
              `${provider}: El JSON generado no cumple el esquema ${schemaId}`
            );
            continue; // Falla validación estructural -> pasa al siguiente proveedor
          }

          parsedJsonRecord = schemaValidation.data as Record<string, unknown>;
        }

        // Éxito confirmado
        healthSensor.recordSuccess(provider, result.durationMs, 200);

        const metrics: GatewayMetrics = {
          engineType,
          provider,
          modelId: result.modelId,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          totalTokens: result.totalTokens,
          fallbackTriggered: false,
          attemptedProviders,
          durationMs: result.durationMs,
        };

        const output: LlmGenerateOutput = {
          text: result.text,
          json: parsedJsonRecord,
          metrics,
        };

        sendJson(res, 200, createSuccessEnvelope(output));
        return;
      } catch (err) {
        const durationMs = Math.round(performance.now() - t0);
        healthSensor.recordFailure(provider, durationMs, 502);
        const errMsg = err instanceof Error ? err.message : String(err);
        collectedErrors.push(`${provider}: ${errMsg}`);
      }
    }

    // Si se agotaron los proveedores de la matriz
    sendJson(
      res,
      502,
      createErrorEnvelope(
        [
          `Todos los proveedores de la matriz ${engineType} fallaron (${attemptedProviders.join(
            ', '
          )})`,
          ...collectedErrors,
        ],
        502,
        'Fallo de inferencia LLM en todos los proveedores disponibles'
      )
    );
  };
}
