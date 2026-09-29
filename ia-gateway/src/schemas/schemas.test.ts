import { describe, expect, it } from 'vitest';
import { DecisionInputSchema, DecisionOutputSchema } from './decision.schema.js';
import { LlmGenerateInputSchema, LlmGenerateOutputSchema } from './llm.schema.js';

describe('IA Gateway Schemas', () => {
  describe('LlmGenerateInputSchema', () => {
    it('debe validar entrada válida para texto libre', () => {
      const input = {
        prompt: 'Hola mundo',
        engineType: 'FAST_LLM',
        responseFormat: 'text',
      };
      const result = LlmGenerateInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('debe exigir schemaId si responseFormat es json', () => {
      const invalid = {
        prompt: 'Genera ruta',
        engineType: 'REASONING_LLM',
        responseFormat: 'json',
      };
      const result = LlmGenerateInputSchema.safeParse(invalid);
      expect(result.success).toBe(false);

      const valid = {
        prompt: 'Genera ruta',
        engineType: 'REASONING_LLM',
        responseFormat: 'json',
        schemaId: 'tactical-route',
      };
      const validResult = LlmGenerateInputSchema.safeParse(valid);
      expect(validResult.success).toBe(true);
    });
  });

  describe('DecisionInputSchema', () => {
    it('debe validar entrada noul', () => {
      const noulInput = {
        primitive: 'noul',
        state: 'Contexto del usuario',
        instruction: '¿Desea continuar?',
      };
      const result = DecisionInputSchema.safeParse(noulInput);
      expect(result.success).toBe(true);
    });

    it('debe validar entrada choice requiriendo al menos 2 choices', () => {
      const invalidChoice = {
        primitive: 'choice',
        state: 'Contexto',
        instruction: 'Selecciona opción',
        choices: ['única'],
      };
      expect(DecisionInputSchema.safeParse(invalidChoice).success).toBe(false);

      const validChoice = {
        primitive: 'choice',
        state: 'Contexto',
        instruction: 'Selecciona opción',
        choices: ['opcion_a', 'opcion_b'],
      };
      expect(DecisionInputSchema.safeParse(validChoice).success).toBe(true);
    });
  });

  describe('Outputs and Metrics', () => {
    it('debe validar salida de decisión tipada noul', () => {
      const output = {
        primitive: 'noul',
        probability: 0.85,
        isAffirmative: true,
        metrics: {
          engineType: 'TYPED_DECISION',
          provider: 'JEV',
          modelId: 'jev-latest',
          promptTokens: 120,
          completionTokens: 5,
          totalTokens: 125,
          fallbackTriggered: false,
          attemptedProviders: ['JEV'],
          durationMs: 230,
        },
      };
      const result = DecisionOutputSchema.safeParse(output);
      expect(result.success).toBe(true);
    });

    it('debe validar salida LLM con tokens nulos', () => {
      const output = {
        text: 'Respuesta generada',
        metrics: {
          engineType: 'FAST_LLM',
          provider: 'GROQ',
          modelId: 'llama-3.3-70b-versatile',
          promptTokens: null,
          completionTokens: null,
          totalTokens: null,
          fallbackTriggered: false,
          attemptedProviders: ['GROQ'],
          durationMs: 145,
        },
      };
      const result = LlmGenerateOutputSchema.safeParse(output);
      expect(result.success).toBe(true);
    });
  });
});
