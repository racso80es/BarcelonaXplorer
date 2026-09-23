/**
 * Puerto de salida para el generador de Rebotes Tácticos (System Two Ligero / SLM Groq).
 *
 * Sintetiza un mensaje conversacional, empático y gamificado cuando el usuario
 * formula peticiones fuera de perímetro, reconduciendo la atención al asfalto de Barcelona.
 */
export interface GeographicBounceGeneratorPort {
  generateBounceMessage(rejectedEntity: string, prompt: string): Promise<string>;
}
