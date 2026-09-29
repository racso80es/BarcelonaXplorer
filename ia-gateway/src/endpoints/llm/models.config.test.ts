import { describe, expect, it } from 'vitest';
import { parseModelList, resolveProviderModels } from './models.config.js';

describe('Provider Models Configuration (PBI-GW-010)', () => {
  it('CA-1: debe parsear lista de modelos separados por comas y sanitizar espacios', () => {
    const list = parseModelList('gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-pro');
    expect(list).toEqual(['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro']);
  });

  it('CA-1: debe rechazar lista vacía o con elementos vacíos mediante Zod', () => {
    expect(() => parseModelList('')).toThrow();
    expect(() => parseModelList('m1,,m2')).toThrow();
    expect(() => parseModelList('   ')).toThrow();
  });

  it('CA-1: fallback a GEMINI_REASONING_MODEL y GROQ_FAST_MODEL si no se proveen listas', () => {
    const config = resolveProviderModels({
      GEMINI_REASONING_MODEL: 'gemini-custom-reasoning',
      GROQ_FAST_MODEL: 'groq-custom-fast',
    });

    expect(config.geminiModels).toEqual(['gemini-custom-reasoning']);
    expect(config.groqModels).toEqual(['groq-custom-fast']);
  });

  it('CA-1: prioriza GEMINI_MODELS y GROQ_MODELS sobre las variables unitarias', () => {
    const config = resolveProviderModels({
      GEMINI_MODELS: 'gemini-3.5-flash,gemini-3-flash-preview',
      GEMINI_REASONING_MODEL: 'gemini-legacy',
      GROQ_MODELS: 'llama-3.3-70b-versatile,llama-3.1-8b-instant',
      GROQ_FAST_MODEL: 'llama-legacy',
    });

    expect(config.geminiModels).toEqual(['gemini-3.5-flash', 'gemini-3-flash-preview']);
    expect(config.groqModels).toEqual(['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']);
  });
});
