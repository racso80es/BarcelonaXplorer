import { describe, expect, it } from 'vitest';
import { DecisionInputSchema, DecisionOutputSchema } from './decision.schema.js';
import { LlmGenerateInputSchema, LlmGenerateOutputSchema } from './llm.schema.js';
import { TacticalRouteSchema } from '../endpoints/llm/schemas-registry.js';

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

  describe('TacticalRouteSchema (PBI-ORCH-PRO-002 CA-6)', () => {
    it('debe rechazar timeSpan.start con formato 10:00 AM', () => {
      const routeWithAm = {
        id: 'route-test-1',
        summary: 'Ruta con hora AM',
        waypoints: [
          {
            id: 'wp-1',
            title: 'Sagrada Família',
            timeSpan: {
              start: '10:00 AM',
              end: '12:00',
            },
          },
        ],
      };
      const result = TacticalRouteSchema.safeParse(routeWithAm);
      expect(result.success).toBe(false);
    });

    it('debe aceptar 09:30 y 14:30 en timeSpan.start y timeSpan.end', () => {
      const validRoute = {
        id: 'route-test-2',
        summary: 'Ruta válida',
        waypoints: [
          {
            id: 'wp-1',
            title: 'Parc Güell',
            timeSpan: {
              start: '09:30',
              end: '14:30',
            },
          },
        ],
      };
      const result = TacticalRouteSchema.safeParse(validRoute);
      expect(result.success).toBe(true);
    });

    it('mantiene description como opcional', () => {
      const routeNoDesc = {
        id: 'route-test-3',
        summary: 'Sin descripción',
        waypoints: [
          {
            id: 'wp-1',
            title: 'Plaça Catalunya',
          },
        ],
      };
      const result = TacticalRouteSchema.safeParse(routeNoDesc);
      expect(result.success).toBe(true);
    });
  });
});
