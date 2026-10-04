import { describe, it, expect, vi } from 'vitest';
import { GeminiEmbeddingAdapter } from './gemini-embedding.adapter';
import { GoogleGenAI } from '@google/genai';
import { TelemetryRepositoryPort } from '@/features/telemetry';

describe('GeminiEmbeddingAdapter (PBI-MEM-006 Fail-Closed Contract)', () => {
  it('debe reportar 768 dimensiones estándar', () => {
    const adapter = new GeminiEmbeddingAdapter();
    expect(adapter.getDimensions()).toBe(768);
  });

  it('no debe exponer generateDeterministicFallback (erradicación en origen)', () => {
    const adapter = new GeminiEmbeddingAdapter();
    expect('generateDeterministicFallback' in adapter).toBe(false);
  });

  it('debe fallar con exitCode 400 si el texto está vacío sin llamar a la API', async () => {
    const mockGenAi = {
      models: { embedContent: vi.fn() },
    } as unknown as GoogleGenAI;
    const adapter = new GeminiEmbeddingAdapter(mockGenAi);

    const result = await adapter.generateEmbedding('   ');

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(400);
    expect(result.result).toBeUndefined();
    expect(mockGenAi.models.embedContent).not.toHaveBeenCalled();
  });

  it('debe utilizar GoogleGenAI si está disponible y retornar envelope success con vector validado', async () => {
    const mockEmbedContent = vi.fn().mockResolvedValue({
      embedding: { values: new Array(768).fill(0.123) },
    });
    const mockGenAi = {
      models: {
        embedContent: mockEmbedContent,
      },
    } as unknown as GoogleGenAI;

    const adapter = new GeminiEmbeddingAdapter(mockGenAi, undefined, 'gemini-embedding-001');
    const result = await adapter.generateEmbedding('Ruta gótica');

    expect(mockEmbedContent).toHaveBeenCalledWith({
      model: 'gemini-embedding-001',
      contents: 'Ruta gótica',
      config: { outputDimensionality: 768 },
    });
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.result).toBeDefined();
    expect(result.result?.length).toBe(768);
    expect(result.result?.[0]).toBe(0.123);
  });

  it('debe usar gemini-embedding-001 por defecto y extraer vector desde res.embeddings[0].values', async () => {
    const mockEmbedContent = vi.fn().mockResolvedValue({
      embeddings: [{ values: new Array(768).fill(0.456) }],
    });
    const mockGenAi = {
      models: {
        embedContent: mockEmbedContent,
      },
    } as unknown as GoogleGenAI;

    const adapter = new GeminiEmbeddingAdapter(mockGenAi);
    const result = await adapter.generateEmbedding('Parc de la Ciutadella');

    expect(mockEmbedContent).toHaveBeenCalledWith({
      model: 'gemini-embedding-001',
      contents: 'Parc de la Ciutadella',
      config: { outputDimensionality: 768 },
    });
    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.result?.length).toBe(768);
    expect(result.result?.[0]).toBe(0.456);
  });

  it('debe rechazar respuesta con dimensión distinta de 768 y fallar closed sin entregar vector', async () => {
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

    expect(result.success).toBe(false);
    expect(result.result).toBeUndefined();
    expect(result.exitCode).toBe(502);
    expect(mockTelemetry.log).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'ERROR', context: 'LLM_ENGINE' }),
    );
  });

  it('debe fallar closed ante error transitorio y registrar telemetría WARN', async () => {
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

    expect(result.success).toBe(false);
    expect(result.result).toBeUndefined();
    expect(result.exitCode).toBe(429);
    expect(mockTelemetry.log).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'WARN', context: 'LLM_ENGINE' }),
    );
  });

  it('debe registrar ERROR ante 404 permanente del proveedor y fallar closed', async () => {
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

    expect(result.success).toBe(false);
    expect(result.result).toBeUndefined();
    expect(result.exitCode).toBe(404);
    expect(mockTelemetry.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'ERROR',
        context: 'LLM_ENGINE',
      }),
    );
  });
});
