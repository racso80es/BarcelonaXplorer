import { z } from 'zod';
import type { ProviderId } from '../../health/types.js';

export interface AnchorDefinition {
  provider: 'GOOGLE' | 'GROQ';
  modelId: string;
}

export const AnchorConfigStringSchema = z
  .string()
  .regex(/^(google|groq):[\w\.\-\/]+$/i, {
    message: 'El formato de anclaje base debe ser <proveedor>:<modelo> (ej: google:gemini-2.5-flash)',
  });

export function parseAnchorString(raw: string): AnchorDefinition {
  const validated = AnchorConfigStringSchema.parse(raw);
  const colonIndex = validated.indexOf(':');
  const rawProvider = validated.slice(0, colonIndex).toUpperCase();
  const modelId = validated.slice(colonIndex + 1);

  const provider: 'GOOGLE' | 'GROQ' = rawProvider === 'GOOGLE' ? 'GOOGLE' : 'GROQ';
  return { provider, modelId };
}

export interface FallbackConfig {
  defaultFastLlm: AnchorDefinition;
  defaultReasoningLlm: AnchorDefinition;
}

export function resolveFallbackConfig(env: NodeJS.ProcessEnv = process.env): FallbackConfig {
  const fastRaw = env['DEFAULT_FAST_LLM'] ?? 'google:gemini-2.5-flash';
  const reasoningRaw = env['DEFAULT_REASONING_LLM'] ?? 'groq:llama-3.3-70b-versatile';

  const defaultFastLlm = parseAnchorString(fastRaw);
  const defaultReasoningLlm = parseAnchorString(reasoningRaw);

  // CA-2: Restricción de proveedor distinto al principal de la matriz
  // Matriz FAST_LLM principal es GROQ -> Anclaje debe ser GOOGLE
  if (defaultFastLlm.provider === 'GROQ') {
    console.warn(
      '[IA Gateway Config WARNING] DEFAULT_FAST_LLM comparte proveedor (GROQ) con el principal de su matriz. Se recomienda usar GOOGLE como anclaje.'
    );
  }

  // Matriz REASONING_LLM principal es GOOGLE -> Anclaje debe ser GROQ
  if (defaultReasoningLlm.provider === 'GOOGLE') {
    console.warn(
      '[IA Gateway Config WARNING] DEFAULT_REASONING_LLM comparte proveedor (GOOGLE) con el principal de su matriz. Se recomienda usar GROQ como anclaje.'
    );
  }

  return {
    defaultFastLlm,
    defaultReasoningLlm,
  };
}
