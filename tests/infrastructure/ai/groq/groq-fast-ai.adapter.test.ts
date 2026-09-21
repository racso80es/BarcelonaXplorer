import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GroqFastAiAdapter } from '@/infrastructure/ai/groq/groq-fast-ai.adapter';

/**
 * Helper: Consume un ReadableStream completo y devuelve el texto concatenado.
 */
async function readStreamToString(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  return result;
}

/**
 * Helper: Crea un AsyncIterable mock que simula el streaming de Groq.
 * Cada string en `chunks` se emite como un chunk de contenido delta.
 */
function createMockGroqStream(
  chunks: string[],
): AsyncIterable<{ choices: Array<{ delta: { content: string | null } }> }> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const content of chunks) {
        yield {
          choices: [{ delta: { content } }],
        };
      }
    },
  };
}

/**
 * Crea un mock del cliente Groq con el método chat.completions.create mockeado.
 * Se inyecta al adaptador via constructor (Dependency Inversion).
 */
function createMockGroqClient(createFn: ReturnType<typeof vi.fn>) {
  return {
    chat: {
      completions: {
        create: createFn,
      },
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('GroqFastAiAdapter', () => {
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate = vi.fn();
    // Simular variables de entorno necesarias
    vi.stubEnv('GROQ_API_KEY', 'gsk_test_key_fake');
    vi.stubEnv('GROQ_FAST_MODEL', 'qwen/qwen3.8-27b');
  });

  it('debe convertir el stream de Groq en un ReadableStream legible', async () => {
    const expectedChunks = ['Evita ', 'las Ramblas ', 'a medianoche.'];
    mockCreate.mockResolvedValue(createMockGroqStream(expectedChunks));

    const adapter = new GroqFastAiAdapter(createMockGroqClient(mockCreate));

    const stream = await adapter.generateImmediateContextStream({
      intention: 'cenar en zona turística',
    });

    expect(stream).toBeInstanceOf(ReadableStream);

    const text = await readStreamToString(stream);
    expect(text).toBe('Evita las Ramblas a medianoche.');
  });

  it('debe incluir ubicación y hora local en el mensaje cuando se proporcionan', async () => {
    mockCreate.mockResolvedValue(createMockGroqStream(['Consejo test.']));

    const adapter = new GroqFastAiAdapter(createMockGroqClient(mockCreate));

    await adapter.generateImmediateContextStream({
      intention: 'visitar la Sagrada Familia',
      currentLocation: 'Eixample',
      localTime: '14:30',
    });

    // Verificar que create fue llamado con los mensajes correctos
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.stream).toBe(true);
    expect(callArgs.messages).toHaveLength(2);

    const userMessage: string = callArgs.messages[1].content;
    expect(userMessage).toContain('visitar la Sagrada Familia');
    expect(userMessage).toContain('Eixample');
    expect(userMessage).toContain('14:30');
  });

  it('debe devolver un stream con mensaje fallback ante error de autenticación', async () => {
    mockCreate.mockRejectedValue(
      new Error('Authentication error: invalid API key'),
    );

    const adapter = new GroqFastAiAdapter(createMockGroqClient(mockCreate));

    const stream = await adapter.generateImmediateContextStream({
      intention: 'encontrar metro cercano',
    });

    // No debe lanzar excepción
    expect(stream).toBeInstanceOf(ReadableStream);

    const text = await readStreamToString(stream);
    expect(text).toContain('Radar BX temporalmente fuera de alcance');
  });

  it('debe devolver un stream con mensaje fallback ante error de cuota (rate limit)', async () => {
    mockCreate.mockRejectedValue(
      new Error('Rate limit exceeded: too many requests'),
    );

    const adapter = new GroqFastAiAdapter(createMockGroqClient(mockCreate));

    const stream = await adapter.generateImmediateContextStream({
      intention: 'buscar restaurante barato',
    });

    expect(stream).toBeInstanceOf(ReadableStream);

    const text = await readStreamToString(stream);
    expect(text).toContain('Radar BX temporalmente fuera de alcance');
  });

  it('debe devolver un stream con mensaje fallback ante timeout genérico', async () => {
    mockCreate.mockRejectedValue(new Error('Request timed out'));

    const adapter = new GroqFastAiAdapter(createMockGroqClient(mockCreate));

    const stream = await adapter.generateImmediateContextStream({
      intention: 'llegar al aeropuerto',
    });

    expect(stream).toBeInstanceOf(ReadableStream);

    const text = await readStreamToString(stream);
    expect(text).toContain('Radar BX temporalmente fuera de alcance');
    expect(text).toContain('confirma horarios en la web oficial');
  });

  it('debe lanzar error si GROQ_API_KEY no está configurada', () => {
    vi.stubEnv('GROQ_API_KEY', '');

    expect(() => new GroqFastAiAdapter()).toThrow(
      'GROQ_API_KEY no está configurada',
    );
  });
});
