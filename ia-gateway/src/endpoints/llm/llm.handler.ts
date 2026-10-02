import type { IncomingMessage, ServerResponse } from 'node:http';
import type { HealthSensor } from '../../health/health-sensor.js';
import type { ProviderId } from '../../health/types.js';
import { LlmGenerateInputSchema } from '../../schemas/llm.schema.js';
import type { GatewayMetrics, LlmGenerateOutput } from '../../schemas/llm.schema.js';
import { parseJsonBody, sendJson } from '../../server.js';
import { createErrorEnvelope, createSuccessEnvelope } from '../../shared/envelope.js';
import { resolveFallbackConfig } from './fallback.config.js';
import type { FallbackConfig } from './fallback.config.js';
import type { GeminiAdapter } from './gemini.adapter.js';
import type { GroqAdapter } from './groq.adapter.js';
import { getModelsForProvider, resolveProviderModels } from './models.config.js';
import type { ProviderModelsConfig } from './models.config.js';
import { getZodSchemaById } from './schemas-registry.js';

export function createLlmHandler(
  geminiAdapter: GeminiAdapter,
  groqAdapter: GroqAdapter,
  healthSensor: HealthSensor,
  fallbackConfig: FallbackConfig = resolveFallbackConfig(),
  providerModels: ProviderModelsConfig = resolveProviderModels()
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

    const {
      prompt,
      engineType,
      responseFormat,
      schemaId,
      systemInstruction,
      temperature,
      grounding,
    } = validation.data;

    // Matriz declarativa acordada en D-3. Si grounding es true, solo GOOGLE es apto (CA-4)
    const candidateOrder: ProviderId[] = grounding
      ? ['GOOGLE']
      : engineType === 'FAST_LLM'
        ? ['GROQ', 'GOOGLE']
        : ['GOOGLE', 'GROQ'];

    // Filtramos proveedores sanos (CLOSED o HALF_OPEN)
    const healthyCandidates = candidateOrder.filter((p) =>
      healthSensor.getBreaker(p).canExecute()
    );

    const attemptedProviders: string[] = [];
    const attemptedModels: string[] = [];
    const collectedErrors: string[] = [];

    // 1. Intentar candidatos sanos de la matriz con degradación intra-proveedor (CA-2)
    for (const provider of healthyCandidates) {
      attemptedProviders.push(provider);
      const configuredModels = getModelsForProvider(provider, providerModels);
      const modelsToTry = configuredModels.length > 0 ? configuredModels : ['default'];
      let providerSucceeded = false;
      let lastFailureDurationMs = 0;

      for (const modelId of modelsToTry) {
        const modelTag = `${provider}:${modelId}`;
        attemptedModels.push(modelTag);
        const t0 = performance.now();

        try {
          const adapter = provider === 'GOOGLE' ? geminiAdapter : groqAdapter;

          // Manejo especial con grounding: true (CA-3, CA-5, CA-8)
          if (grounding && provider === 'GOOGLE') {
            if (responseFormat === 'json') {
              // Plan de contingencia de dos pasos (CA-8):
              // Paso 1: Búsqueda con respuesta de texto y captura de groundingSources
              const step1 = await geminiAdapter.generate({
                prompt,
                systemInstruction,
                responseFormat: 'text',
                temperature,
                modelId,
                grounding: true,
              });

              // Paso 2: Estructuración JSON sin grounding a partir del texto y las fuentes obtenidas
              const structuringPrompt = `A partir de la siguiente información recuperada en tiempo real de la web:\n\n${step1.text}\n\nEstructura los datos para cumplir con la siguiente petición original:\n${prompt}\n\nDevuelve exclusivamente un JSON conforme al esquema requerido.`;
              const step2 = await geminiAdapter.generate({
                prompt: structuringPrompt,
                systemInstruction:
                  systemInstruction ??
                  'Eres un extractor y estructurador de datos en formato JSON estricto.',
                responseFormat: 'json',
                temperature: 0,
                modelId,
                grounding: false,
              });

              let parsedUnknown: unknown;
              try {
                parsedUnknown = JSON.parse(step2.text);
              } catch {
                lastFailureDurationMs = Math.round(performance.now() - t0);
                collectedErrors.push(`${modelTag}: El paso de estructuración JSON devolvió texto inválido`);
                continue;
              }

              const schema = getZodSchemaById(schemaId);
              const schemaValidation = schema.safeParse(parsedUnknown);
              if (!schemaValidation.success) {
                lastFailureDurationMs = Math.round(performance.now() - t0);
                collectedErrors.push(
                  `${modelTag}: El JSON estructurado no cumple el esquema ${schemaId}`
                );
                continue;
              }

              const parsedJsonRecord = schemaValidation.data as Record<string, unknown>;
              if (step1.groundingSources && step1.groundingSources.length > 0) {
                parsedJsonRecord['groundingSources'] = step1.groundingSources;
              }

              const durationMs = step1.durationMs + step2.durationMs;
              const promptTokens = (step1.promptTokens ?? 0) + (step2.promptTokens ?? 0);
              const completionTokens = (step1.completionTokens ?? 0) + (step2.completionTokens ?? 0);
              const totalTokens = (step1.totalTokens ?? 0) + (step2.totalTokens ?? 0);

              healthSensor.recordSuccess(provider, durationMs, 200);
              providerSucceeded = true;

              const metrics: GatewayMetrics = {
                engineType,
                provider,
                modelId,
                promptTokens: promptTokens > 0 ? promptTokens : null,
                completionTokens: completionTokens > 0 ? completionTokens : null,
                totalTokens: totalTokens > 0 ? totalTokens : null,
                fallbackTriggered: false,
                attemptedProviders,
                attemptedModels,
                durationMs,
                grounded: true,
              };

              const output: LlmGenerateOutput = {
                text: step2.text,
                json: parsedJsonRecord,
                metrics,
              };

              sendJson(res, 200, createSuccessEnvelope(output));
              return;
            } else {
              // Búsqueda directa en texto libre
              const result = await geminiAdapter.generate({
                prompt,
                systemInstruction,
                responseFormat: 'text',
                temperature,
                modelId,
                grounding: true,
              });

              let parsedJsonRecord: Record<string, unknown> | undefined = undefined;
              if (result.groundingSources && result.groundingSources.length > 0) {
                parsedJsonRecord = { groundingSources: result.groundingSources };
              }

              healthSensor.recordSuccess(provider, result.durationMs, 200);
              providerSucceeded = true;

              const metrics: GatewayMetrics = {
                engineType,
                provider,
                modelId: result.modelId,
                promptTokens: result.promptTokens,
                completionTokens: result.completionTokens,
                totalTokens: result.totalTokens,
                fallbackTriggered: false,
                attemptedProviders,
                attemptedModels,
                durationMs: result.durationMs,
                grounded: true,
              };

              const output: LlmGenerateOutput = {
                text: result.text,
                json: parsedJsonRecord,
                metrics,
              };

              sendJson(res, 200, createSuccessEnvelope(output));
              return;
            }
          }

          // Generación estándar sin grounding
          const result = await adapter.generate({
            prompt,
            systemInstruction,
            responseFormat,
            temperature,
            modelId,
          });

          let parsedJsonRecord: Record<string, unknown> | undefined = undefined;

          // Conformidad estructural Zod si responseFormat es 'json'
          if (responseFormat === 'json') {
            let parsedUnknown: unknown;
            try {
              parsedUnknown = JSON.parse(result.text);
            } catch {
              lastFailureDurationMs = Math.round(performance.now() - t0);
              collectedErrors.push(`${modelTag}: La respuesta generada no es un JSON válido`);
              continue;
            }

            const schema = getZodSchemaById(schemaId);
            const schemaValidation = schema.safeParse(parsedUnknown);

            if (!schemaValidation.success) {
              lastFailureDurationMs = Math.round(performance.now() - t0);
              collectedErrors.push(
                `${modelTag}: El JSON generado no cumple el esquema ${schemaId}`
              );
              continue;
            }

            parsedJsonRecord = schemaValidation.data as Record<string, unknown>;
          }

          healthSensor.recordSuccess(provider, result.durationMs, 200);
          providerSucceeded = true;

          const metrics: GatewayMetrics = {
            engineType,
            provider,
            modelId: result.modelId,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            totalTokens: result.totalTokens,
            fallbackTriggered: false,
            attemptedProviders,
            attemptedModels,
            durationMs: result.durationMs,
            grounded: false,
          };

          const output: LlmGenerateOutput = {
            text: result.text,
            json: parsedJsonRecord,
            metrics,
          };

          sendJson(res, 200, createSuccessEnvelope(output));
          return;
        } catch (err) {
          lastFailureDurationMs = Math.round(performance.now() - t0);
          const errMsg = err instanceof Error ? err.message : String(err);
          collectedErrors.push(`${modelTag}: ${errMsg}`);
        }
      }

      if (!providerSucceeded) {
        healthSensor.recordFailure(provider, lastFailureDurationMs, 502);
      }
    }

    // Fail-Closed para grounding (CA-4): Omitir Groq y anclaje
    if (grounding) {
      sendJson(
        res,
        501,
        createErrorEnvelope(
          [
            'UNSUPPORTED_CAPABILITY: grounding requiere proveedor GOOGLE disponible',
            ...collectedErrors,
          ],
          501,
          'Capacidad no disponible'
        )
      );
      return;
    }

    // 2. Jerarquía de Anclaje Base (PBI-GW-005): Si todos los proveedores sanos fallaron
    const anchor =
      engineType === 'FAST_LLM'
        ? fallbackConfig.defaultFastLlm
        : fallbackConfig.defaultReasoningLlm;

    const anchorTag = `${anchor.provider}:${anchor.modelId} (anchor)`;
    attemptedProviders.push(anchorTag);
    attemptedModels.push(anchorTag);
    const t0Anchor = performance.now();

    try {
      const anchorAdapter = anchor.provider === 'GOOGLE' ? geminiAdapter : groqAdapter;
      const result = await anchorAdapter.generate({
        prompt,
        systemInstruction,
        responseFormat,
        temperature,
        modelId: anchor.modelId,
      });

      let parsedJsonRecord: Record<string, unknown> | undefined = undefined;

      if (responseFormat === 'json') {
        let parsedUnknown: unknown;
        try {
          parsedUnknown = JSON.parse(result.text);
        } catch {
          const durationMs = Math.round(performance.now() - t0Anchor);
          healthSensor.recordFailure(anchor.provider, durationMs, 422);
          throw new Error('Anclaje base devolvió JSON malformado');
        }

        const schema = getZodSchemaById(schemaId);
        const schemaValidation = schema.safeParse(parsedUnknown);

        if (!schemaValidation.success) {
          const durationMs = Math.round(performance.now() - t0Anchor);
          healthSensor.recordFailure(anchor.provider, durationMs, 422);
          throw new Error(`Anclaje base no cumplió esquema Zod ${schemaId}`);
        }

        parsedJsonRecord = schemaValidation.data as Record<string, unknown>;
      }

      healthSensor.recordSuccess(anchor.provider, result.durationMs, 200);

      const metrics: GatewayMetrics = {
        engineType,
        provider: anchor.provider,
        modelId: result.modelId,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
        fallbackTriggered: true, // CA-4: Anclaje base activado
        attemptedProviders,
        attemptedModels,
        durationMs: result.durationMs,
        grounded: false,
      };

      const output: LlmGenerateOutput = {
        text: result.text,
        json: parsedJsonRecord,
        metrics,
      };

      sendJson(res, 200, createSuccessEnvelope(output, 'Respuesta servida mediante anclaje base'));
      return;
    } catch (anchorErr) {
      const durationMs = Math.round(performance.now() - t0Anchor);
      healthSensor.recordFailure(anchor.provider, durationMs, 503);
      const errMsg = anchorErr instanceof Error ? anchorErr.message : String(anchorErr);
      collectedErrors.push(`Anchor ${anchor.provider}: ${errMsg}`);
    }

    // 3. CA-3: Agotamiento total (todos los proveedores y el anclaje base fallaron) -> 503
    sendJson(
      res,
      503,
      createErrorEnvelope(
        [
          `Agotamiento total de proveedores en ${engineType}: fallaron ${attemptedProviders.join(
            ', '
          )}`,
          ...collectedErrors,
        ],
        503,
        'Servicio de inferencia temporalmente no disponible (agotamiento total de proveedores)'
      )
    );
  };
}
