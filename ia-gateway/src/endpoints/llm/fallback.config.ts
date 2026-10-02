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
  const clean = raw.trim().replace(/^["']|["']$/g, '');
  const validated = AnchorConfigStringSchema.parse(clean);
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

export function resolveFallbackConfig(
  env: Record<string, string | undefined> = process.env
): FallbackConfig {
  const fastRaw = env['DEFAULT_FAST_LLM'] ?? 'google:gemini-2.5-flash';
  const reasoningRaw = env['DEFAULT_REASONING_LLM'] ?? 'groq:llama-3.3-70b-versatile';

  const defaultFastLlm = parseAnchorString(fastRaw);
  const defaultReasoningLlm = parseAnchorString(reasoningRaw);

  // CA-3: Restricción estricta de proveedor distinto al principal de la matriz (D-1: Fail-fast)
  // Matriz FAST_LLM principal es GROQ -> Anclaje debe ser GOOGLE
  if (defaultFastLlm.provider === 'GROQ') {
    throw new Error(
      '[IA Gateway Config Error] DEFAULT_FAST_LLM comparte proveedor (GROQ) con el principal de su matriz FAST_LLM. Se exige un proveedor distinto como anclaje base (ej: GOOGLE).'
    );
  }

  // Matriz REASONING_LLM principal es GOOGLE -> Anclaje debe ser GROQ
  if (defaultReasoningLlm.provider === 'GOOGLE') {
    throw new Error(
      '[IA Gateway Config Error] DEFAULT_REASONING_LLM comparte proveedor (GOOGLE) con el principal de su matriz REASONING_LLM. Se exige un proveedor distinto como anclaje base (ej: GROQ).'
    );
  }

  return {
    defaultFastLlm,
    defaultReasoningLlm,
  };
}
