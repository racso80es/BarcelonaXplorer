import { describe, it, expect, vi } from 'vitest';
import { GeminiEmbeddingAdapter } from './gemini-embedding.adapter';
import { GoogleGenAI } from '@google/genai';
import { TelemetryRepositoryPort } from '@/features/telemetry';

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

    const norm = Math.sqrt(vector1.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1, 4);
  });

  it('debe utilizar GoogleGenAI si está disponible y marcar origen provider', async () => {
    const mockEmbedContent = vi.fn().mockResolvedValue({
      embedding: { values: new Array(768).fill(0.123) },
    });
    const mockGenAi = {
      models: {
        embedContent: mockEmbedContent,
      },
    } as unknown as GoogleGenAI;

    const adapter = new GeminiEmbeddingAdapter(mockGenAi, undefined, 'embedding-001');
    const result = await adapter.generateEmbedding('Ruta gótica');

    expect(mockEmbedContent).toHaveBeenCalledWith({
      model: 'embedding-001',
      contents: 'Ruta gótica',
      config: { outputDimensionality: 768 },
    });
    expect(result.source).toBe('provider');
    expect(result.vector.length).toBe(768);
    expect(result.vector[0]).toBe(0.123);
  });

  it('debe rechazar respuesta con dimensión distinta de 768 y usar fallback', async () => {
    const mockEmbedContent = vi.fn().mockResolvedValue({
      embedding: { values: [0.1, 0.2, 0.3] },
    });
    const mockGenAi = {
      models: { embedContent: mockEmbedContent },
    } as unknown as GoogleGenAI;

    const mockTelemetry: TelemetryRepositoryPort = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    const adapter = new GeminiEmbeddingAdapter(mockGenAi, mockTelemetry);
    const result = await adapter.generateEmbedding('Plan corto');

    expect(result.source).toBe('fallback');
    expect(mockTelemetry.log).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'ERROR', context: 'LLM_ENGINE' }),
    );
  });

  it('debe activar Fail-Soft ante error transitorio y registrar telemetría WARN', async () => {
    const mockEmbedContent = vi.fn().mockRejectedValue(new Error('Quota exceeded 429'));
    const mockGenAi = {
      models: { embedContent: mockEmbedContent },
    } as unknown as GoogleGenAI;

    const mockTelemetry: TelemetryRepositoryPort = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    const adapter = new GeminiEmbeddingAdapter(mockGenAi, mockTelemetry);
    const result = await adapter.generateEmbedding('Plan nocturno');

    expect(result.source).toBe('fallback');
    expect(result.vector.length).toBe(768);
    expect(mockTelemetry.log).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'WARN', context: 'LLM_ENGINE' }),
    );
  });

  it('debe registrar ERROR ante 404 permanente del proveedor', async () => {
    const mockEmbedContent = vi.fn().mockRejectedValue(
      new Error('models/text-embedding-004 is not found for API version v1beta, status 404'),
    );
    const mockGenAi = {
      models: { embedContent: mockEmbedContent },
    } as unknown as GoogleGenAI;

    const mockTelemetry: TelemetryRepositoryPort = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    const adapter = new GeminiEmbeddingAdapter(mockGenAi, mockTelemetry);
    const result = await adapter.generateEmbedding('Ruta');

    expect(result.source).toBe('fallback');
    expect(mockTelemetry.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'ERROR',
        context: 'LLM_ENGINE',
      }),
    );
  });
});
