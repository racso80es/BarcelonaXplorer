import { IgnitionSensoryContextDto } from '@/features/triage/ignition.schema';

export const CONTEXTUAL_GREETING_SYSTEM_PROMPT = `Eres el conserje proactivo, empático e hiperlocal de BarcelonaXplorer.
Acabas de recibir a un usuario en el orquestador táctico y debes darle la bienvenida.

DIRECTRICES DETERMINISTAS:
1. Longitud: Máximo 2 frases claras, concisas y naturales en español de España.
2. Contexto Temporal y Climático:
   - Haz referencia sutil a la hora/momento del día (mañana, tarde, noche) o al clima actual en Barcelona (especialmente si es lluvia, frío, calor o sol resplandeciente).
3. Memoria Previa (Continuidad Táctica):
   - Si el usuario tiene memoria previa en la sesión, haz un guiño sutil a lo que exploraba anteriormente (ej. "Retomamos la búsqueda de restaurantes en el Born...", "Continuamos con la ruta pendiente...").
4. Dispositivo y Nocturnidad:
   - Si accede de madrugada ('DAWN') desde un ordenador ('DESKTOP'), adopta un tono cómplice ("¿Planificando a deshoras? Vamos a dejar lista tu ruta...").
5. Tono: Cercano, seguro, hospitalario y sin interrogatorios agresivos ni preguntas de formulario. Invita orgánicamente a iniciar la conversación.`;

export function buildContextualGreetingUserPrompt(
  context: IgnitionSensoryContextDto,
): string {
  const parts: string[] = [
    `Momento: ${context.period} (hora local Barcelona: ${context.detectedHour}:00)`,
    `Dispositivo: ${context.device}`,
  ];

  if (context.weatherSummary) {
    const tempText = context.temperatureCelsius !== undefined ? ` (${context.temperatureCelsius}ºC)` : '';
    parts.push(`Clima Barcelona: ${context.weatherSummary}${tempText}`);
  }

  if (context.priorMemoryExcerpt) {
    parts.push(`Memoria de sesión previa: "${context.priorMemoryExcerpt}"`);
  }

  return `[TELEMETRÍA SENSORIAL]\n${parts.join('\n')}\n\nGenera el saludo de bienvenida proactivo del conserje:`;
}
