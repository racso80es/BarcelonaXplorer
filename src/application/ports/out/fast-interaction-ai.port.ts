/**
 * Value Object inmutable que encapsula el contexto necesario
 * para una consulta de inferencia rápida del Radar BX.
 *
 * Prohibido el uso de `any`. Todos los campos son tipados y readonly.
 */
export interface FastContextDto {
  /** Intención principal del usuario (obligatorio). */
  readonly intention: string;
  /** Ubicación actual del usuario en Barcelona (opcional). */
  readonly currentLocation?: string;
  /** Hora local del usuario en formato ISO o legible (opcional). */
  readonly localTime?: string;
}

/**
 * Puerto de salida (driven port) para el motor de inferencia rápida.
 *
 * El contrato garantiza la devolución de un ReadableStream compatible
 * con la Web Streams API, permitiendo consumo SSE sin bloqueo.
 *
 * La implementación concreta reside en la capa de infraestructura.
 */
export interface FastInteractionAiPort {
  generateImmediateContextStream(
    context: FastContextDto,
  ): Promise<ReadableStream>;
}
