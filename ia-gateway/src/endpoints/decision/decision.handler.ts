import type { IncomingMessage, ServerResponse } from 'node:http';
import { DecisionInputSchema } from '../../schemas/decision.schema.js';
import { parseJsonBody, sendJson } from '../../server.js';
import { createErrorEnvelope, createSuccessEnvelope } from '../../shared/envelope.js';
import { JevAdapter, JevAdapterError } from './jev.adapter.js';

export function createDecisionHandler(adapter: JevAdapter) {
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

    const validation = DecisionInputSchema.safeParse(rawBody);
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
          'Cuerpo de petición no conforme al esquema de System One'
        )
      );
      return;
    }

    try {
      const evaluationResult = await adapter.evaluate(validation.data);
      sendJson(res, 200, createSuccessEnvelope(evaluationResult));
    } catch (err) {
      if (err instanceof JevAdapterError) {
        // En lugar de 500 incontrolado, emitimos sobre determinista con su código de estado
        sendJson(
          res,
          err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 502,
          createErrorEnvelope(
            [err.message],
            err.statusCode,
            `Fallo en el motor System One (${err.code})`
          )
        );
        return;
      }

      sendJson(
        res,
        500,
        createErrorEnvelope(
          [err instanceof Error ? err.message : 'Error interno desconocido'],
          500,
          'Error interno en el procesamiento de decisión tipada'
        )
      );
    }
  };
}
