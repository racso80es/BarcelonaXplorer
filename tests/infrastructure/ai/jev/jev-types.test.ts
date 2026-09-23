import { describe, it, expect } from 'vitest';
import {
  JevModelItemSchema,
  JevModelsResponseSchema,
  JevNoulAnswerSchema,
  JevChoiceAnswerSchema,
  JevAnswerItemSchema,
  JevSystemOneResponseSchema,
} from '@/infrastructure/ai/jev/types';

describe('Jev Types & Zod Schemas (HU-INFRA-JEV-001)', () => {
  it('debe validar items individuales de modelo con y sin descripción', () => {
    expect(JevModelItemSchema.safeParse({ name: 'laya-multilingual', description: 'Multilingual' }).success).toBe(true);
    expect(JevModelItemSchema.safeParse({ name: 'laya-english' }).success).toBe(true);
    expect(JevModelItemSchema.safeParse({ description: 'Sin nombre' }).success).toBe(false);
  });

  it('debe validar el listado de modelos de /api/v1/models', () => {
    const raw = {
      models: [
        { name: 'jev-latest', description: 'Default Jev alias' },
        { name: 'laya-english' },
      ],
    };

    const parsed = JevModelsResponseSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.models).toHaveLength(2);
      expect(parsed.data.models[0].name).toBe('jev-latest');
    }
  });

  it('debe rechazar listados de modelos malformados', () => {
    expect(JevModelsResponseSchema.safeParse({}).success).toBe(false);
    expect(JevModelsResponseSchema.safeParse({ models: 'no-es-array' }).success).toBe(false);
    expect(JevModelsResponseSchema.safeParse({ models: [{ invalid: true }] }).success).toBe(false);
  });

  it('debe validar respuestas de tipo noul con probabilidad calibrada entre 0 y 1', () => {
    const validNoul = { type: 'noul', noul: 0.88 };
    expect(JevNoulAnswerSchema.safeParse(validNoul).success).toBe(true);

    const boundaryNoul0 = { type: 'noul', noul: 0 };
    const boundaryNoul1 = { type: 'noul', noul: 1 };
    expect(JevNoulAnswerSchema.safeParse(boundaryNoul0).success).toBe(true);
    expect(JevNoulAnswerSchema.safeParse(boundaryNoul1).success).toBe(true);

    const invalidNoulHigh = { type: 'noul', noul: 1.05 };
    const invalidNoulLow = { type: 'noul', noul: -0.1 };
    expect(JevNoulAnswerSchema.safeParse(invalidNoulHigh).success).toBe(false);
    expect(JevNoulAnswerSchema.safeParse(invalidNoulLow).success).toBe(false);
  });

  it('debe validar respuestas de tipo choice con mapa de probabilidades', () => {
    const validChoice = {
      type: 'choice',
      choice: 'supported',
      probabilities: { supported: 0.92, contradicted: 0.05, not_addressed: 0.03 },
      confidence: 0.92,
    };

    const parsed = JevChoiceAnswerSchema.safeParse(validChoice);
    expect(parsed.success).toBe(true);

    // Invalid choice con confidence fuera de rango
    expect(JevChoiceAnswerSchema.safeParse({ ...validChoice, confidence: 1.5 }).success).toBe(false);
    expect(JevChoiceAnswerSchema.safeParse({ ...validChoice, confidence: -0.1 }).success).toBe(false);
  });

  it('debe validar la unión discriminada JevAnswerItemSchema para noul y choice', () => {
    expect(JevAnswerItemSchema.safeParse({ type: 'noul', noul: 0.75 }).success).toBe(true);
    expect(JevAnswerItemSchema.safeParse({
      type: 'choice',
      choice: 'a',
      probabilities: { a: 1 },
      confidence: 1,
    }).success).toBe(true);

    expect(JevAnswerItemSchema.safeParse({ type: 'unsupported_type', value: 1 }).success).toBe(false);
  });

  it('debe validar un payload completo de /v1/systemone con o sin métricas de uso', () => {
    const rawWithUsage = {
      model: 'jev-1.13.0',
      answers: {
        is_bcn: { type: 'noul', noul: 0.99 },
      },
      usage: { input_tokens: 110, output_tokens: 12 },
    };
    expect(JevSystemOneResponseSchema.safeParse(rawWithUsage).success).toBe(true);

    const rawWithoutUsage = {
      model: 'laya-multilingual',
      answers: {
        is_bcn: { type: 'noul', noul: 0.85 },
      },
    };
    expect(JevSystemOneResponseSchema.safeParse(rawWithoutUsage).success).toBe(true);
  });
});
