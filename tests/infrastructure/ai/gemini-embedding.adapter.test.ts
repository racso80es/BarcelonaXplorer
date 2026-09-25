import { describe, it, expect, vi } from 'vitest';
import { GeminiEmbeddingAdapter } from '@/infrastructure/ai/gemini-embedding.adapter';
import { GoogleGenAI } from '@google/genai';
import { TelemetryRepositoryPort } from '@/application/ports/out/telemetry-repository.port';

describe('GeminiEmbeddingAdapter', () => {
  it('debe reportar 768 dimensiones estándar', () => {
    const adapter = new GeminiEmbeddingAdapter();
    expect(adapter.getDimensions()).toBe(768);
  });

  it('debe generar un vector determinista con norma L2 unitaria en fallback', () => {
    const adapter = new GeminiEmbeddingAdapter();
    const vector1 = adapter.generateDeterministicFallback('Visita a Gràcia');
    const vector2 = adapter.generateDeterministicFallback('Visita a Gràcia');

    expect(vector1.length).toBe(768);
    expect(vector1).toEqual(vector2);

    // Comprobar norma L2 aproximada a 1
    const norm = Math.sqrt(vector1.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1, 4);
  });

  it('debe utilizar GoogleGenAI si está disponible', async () => {
    const mockEmbedContent = vi.fn().mockResolvedValue({
      embedding: { values: new Array(768).fill(0.123) },
    });
    const mockGenAi = {
      models: {
        embedContent: mockEmbedContent,
      },
    } as unknown as GoogleGenAI;

    const adapter = new GeminiEmbeddingAdapter(mockGenAi);
    const result = await adapter.generateEmbedding('Ruta gótica');

    expect(mockEmbedContent).toHaveBeenCalledWith({
      model: 'text-embedding-004',
      contents: 'Ruta gótica',
    });
    expect(result.length).toBe(768);
    expect(result[0]).toBe(0.123);
  });

  it('debe activar Fail-Soft ante error de GoogleGenAI y registrar telemetría WARN', async () => {
    const mockEmbedContent = vi.fn().mockRejectedValue(new Error('Quota exceeded 429'));
    const mockGenAi = {
      models: {
        embedContent: mockEmbedContent,
      },
    } as unknown as GoogleGenAI;

    const mockTelemetry: TelemetryRepositoryPort = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    const adapter = new GeminiEmbeddingAdapter(mockGenAi, mockTelemetry);
    const result = await adapter.generateEmbedding('Plan nocturno');

    // Debe retornar el vector determinista sin lanzar excepción
    expect(result.length).toBe(768);
    expect(mockTelemetry.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'WARN',
        context: 'AI_ENGINE',
      }),
    );
  });
});
