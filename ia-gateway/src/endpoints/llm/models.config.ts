import { z } from 'zod';
import type { ProviderId } from '../../health/types.js';

export interface ProviderModelsConfig {
  geminiModels: string[];
  groqModels: string[];
}

export const ModelListSchema = z
  .array(z.string().min(1, 'El nombre de modelo no puede estar vacío'))
  .min(1, 'La lista de modelos debe tener al menos un elemento');

export function parseModelList(raw: string): string[] {
  const clean = raw.trim().replace(/^["']|["']$/g, '');
  const items = clean.split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
  return ModelListSchema.parse(items);
}

export function resolveProviderModels(
  env: Record<string, string | undefined> = process.env
): ProviderModelsConfig {
  const geminiRaw =
    env['GEMINI_MODELS']?.trim() ||
    env['GEMINI_REASONING_MODEL']?.trim() ||
    'gemini-2.5-flash';

  const groqRaw =
    env['GROQ_MODELS']?.trim() ||
    env['GROQ_FAST_MODEL']?.trim() ||
    'llama-3.3-70b-versatile';

  return {
    geminiModels: parseModelList(geminiRaw),
    groqModels: parseModelList(groqRaw),
  };
}

export function getModelsForProvider(
  provider: ProviderId,
  config: ProviderModelsConfig
): string[] {
  if (provider === 'GOOGLE') {
    return config.geminiModels;
  }
  if (provider === 'GROQ') {
    return config.groqModels;
  }
  return [];
}
