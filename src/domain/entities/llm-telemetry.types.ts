/**
 * Entidades y tipos estrictos para la auditoría termodinámica y telemetría del motor LLM.
 * Cumple con los preceptos de la Vía del Yunque y la Aduana Cognitiva.
 */

/**
 * Variables del contexto ambiental y logístico inyectadas en la orquestación.
 */
export interface LlmEnvironmentContext {
  weather?: string;
  localTime: string;
  userLocation?: { lat: number; lng: number };
  constraints?: string[];
  [key: string]: unknown;
}

/**
 * Representación serializada de un Waypoint devuelto por el modelo.
 */
export interface LlmReturnedRouteWaypoint {
  id: string;
  title: string;
  description: string;
  coordinates?: { lat: number; lng: number };
  timeSpan?: { start: string; end?: string };
  recommendations?: string[];
}

/**
 * Datos estructurados de la ruta devuelta por el motor LLM (Éxito).
 */
export interface LlmReturnedRouteData {
  id: string;
  summary: string;
  waypointsCount: number;
  waypoints: LlmReturnedRouteWaypoint[];
  [key: string]: unknown;
}

/**
 * Datos devueltos ante claudicación cognitiva (WARN).
 */
export interface LlmReturnedClaudicationData {
  status: 'CLAUDICATION';
  message: string;
  rawOutput?: string;
  [key: string]: unknown;
}

/**
 * Datos devueltos ante error periférico de infraestructura (ERROR).
 */
export interface LlmReturnedErrorData {
  statusCode: number;
  error: string;
  stackTraceSnippet?: string;
  [key: string]: unknown;
}

/**
 * Solicitud formal inyectada hacia el motor LLM.
 */
export interface LlmRequestData<TContext extends LlmEnvironmentContext | undefined = LlmEnvironmentContext> {
  prompt: string;
  promptLength: number;
  environmentVariables?: TContext;
  [key: string]: unknown;
}

/**
 * Base común compartida por todos los payloads de telemetría del motor LLM.
 */
export interface BaseLlmTelemetryPayload {
  model: string;
  prompt: string;
  promptLength: number;
  request: {
    prompt: string;
    promptLength: number;
    environmentVariables?: LlmEnvironmentContext;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Payload para inferencias exitosas (DEBUG):
 * Registra la solicitud íntegra y los datos devueltos estructurados (itinerario completo).
 */
export interface LlmSuccessTelemetryPayload extends BaseLlmTelemetryPayload {
  routeId: string;
  waypointsCount: number;
  environmentVariables?: LlmEnvironmentContext;
  request: {
    prompt: string;
    promptLength: number;
    environmentVariables?: LlmEnvironmentContext;
    [key: string]: unknown;
  };
  response: LlmReturnedRouteData;
}

/**
 * Payload forense para claudicaciones cognitivas del modelo (WARN: "No se pudo forjar la ruta."):
 * INVARIANTE FORENSE ESTRICTO: environmentVariables es OBLIGATORIO a nivel de compilador
 * tanto en la raíz como en request.environmentVariables.
 */
export interface LlmWarningTelemetryPayload extends BaseLlmTelemetryPayload {
  reason: 'NO_ROUTE_FORGED' | string;
  /** Estrictamente obligatorio sin modificador (?): contexto ambiental causal */
  environmentVariables: LlmEnvironmentContext;
  rawResponse?: string;
  request: {
    prompt: string;
    promptLength: number;
    environmentVariables: LlmEnvironmentContext;
    [key: string]: unknown;
  };
  response: LlmReturnedClaudicationData;
}

/**
 * Payload para caídas de red, cuotas agotadas o excepciones de infraestructura (ERROR):
 * Registra la solicitud y los datos de error devueltos por el proveedor externo.
 */
export interface LlmErrorTelemetryPayload extends BaseLlmTelemetryPayload {
  errorMessage: string;
  statusCode: number;
  environmentVariables?: LlmEnvironmentContext;
  stackTraceSnippet?: string;
  request: {
    prompt: string;
    promptLength: number;
    environmentVariables?: LlmEnvironmentContext;
    [key: string]: unknown;
  };
  response?: LlmReturnedErrorData;
}

/**
 * Unión discriminada polimórfica para el payload del motor LLM.
 */
export type LlmTelemetryPayload =
  | LlmSuccessTelemetryPayload
  | LlmWarningTelemetryPayload
  | LlmErrorTelemetryPayload;

/**
 * Contrato formal discriminado para la emisión del evento de telemetría en la capa de aplicación.
 */
export type LlmTelemetryEvent =
  | {
      level: 'DEBUG';
      context: 'LLM_ENGINE';
      message: string;
      statusCode: 200;
      durationMs: number;
      payload: LlmSuccessTelemetryPayload;
    }
  | {
      level: 'WARN';
      context: 'LLM_ENGINE';
      message: string;
      statusCode: 422 | 200;
      durationMs: number;
      payload: LlmWarningTelemetryPayload; // Exige environmentVariables a nivel estático
    }
  | {
      level: 'ERROR';
      context: 'LLM_ENGINE';
      message: string;
      statusCode: number;
      durationMs: number;
      payload: LlmErrorTelemetryPayload;
    };
