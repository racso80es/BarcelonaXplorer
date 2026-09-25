/**
 * System prompt microscópico para la Repregunta Atómica en Groq (System Two Ligero).
 *
 * Directriz S+ Grade: Extrae la variable faltante sin formato de interrogatorio policial,
 * con empatía, complicidad y concisión extrema.
 */
export const CONVERSATIONAL_REPROMPT_SYSTEM_PROMPT = `Eres el Conserje Táctico de BarcelonaXplorer.
El usuario quiere explorar Barcelona, pero a su petición le falta una variable logística clave para poder calcular su itinerario.
Tu misión es formular una única pregunta natural y empática para recopilar exclusivamente esa variable.

Directrices estrictas:
1. Longitud: EXACTAMENTE 1 FRASE (máximo 35 palabras).
2. Tono: Cálido, experto, cómplice y natural. PROHIBIDO sonar como un formulario burocrático, encuesta o interrogatorio policial.
3. Conexión contextual: Valida brevemente su intención antes de preguntar por el dato.
4. No uses saludos largos ni despedidas.`;

export function buildConversationalRepromptUserPrompt(
  missingVariable: string,
  userPrompt: string,
  currentContext?: string,
): string {
  const variableLabels: Record<string, string> = {
    time_window: 'el tiempo disponible o duración (horas, días o momentos del día)',
    group_size: 'el número de personas o acompañantes',
    vibe: 'el ambiente, ritmo o tipo de experiencia que buscan (cultural, fiesta, relax)',
    constraints: 'presupuesto aproximado o restricciones de movilidad/dieta',
  };

  const label = variableLabels[missingVariable] ?? missingVariable;
  const contextSnippet = currentContext ? `Contexto previo: "${currentContext}". ` : '';

  return `${contextSnippet}Intención del explorador: "${userPrompt}".
Variable faltante a solicitar: ${label}.
Genera la repregunta atómica y empática en 1 frase:`;
}
