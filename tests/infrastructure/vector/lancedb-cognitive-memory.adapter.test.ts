import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LanceDbCognitiveMemoryAdapter } from '@/infrastructure/vector/lancedb-cognitive-memory.adapter';
import { LanceDbVectorAdapter } from '@/infrastructure/vector/lancedb-vector.adapter';
import { resetLanceDbConnection } from '@/infrastructure/vector/lancedb-client';
import { DenseSemanticMatrix } from '@/domain/value-objects/dense-semantic-matrix.vo';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('LanceDbCognitiveMemoryAdapter (LanceDB RAG S+ Grade)', () => {
  const testDir = path.join(os.tmpdir(), `lancedb_cog_test_${Date.now()}`);
  let vectorStore: LanceDbVectorAdapter;
  let adapter: LanceDbCognitiveMemoryAdapter;

  beforeAll(() => {
    resetLanceDbConnection();
    vectorStore = new LanceDbVectorAdapter(testDir);
    adapter = new LanceDbCognitiveMemoryAdapter(vectorStore, testDir);
  });

  afterAll(() => {
    resetLanceDbConnection();
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch {
      // Ignorar limpieza
    }
  });

  it('debe retornar null si la tabla cognitive_memories no existe aún', async () => {
    const memory = await adapter.getLatestSessionMemory('non-existing-session');
    expect(memory).toBeNull();
  });

  it('debe persistir una matriz densa y recuperarla fielmente como DenseSemanticMatrix', async () => {
    const matrix = DenseSemanticMatrix.create({
      sessionId: 'sess-user-1',
      matrixId: 'default',
      payload: {
        time_window: '3 horas',
        group_size: 2,
        vibe: 'gastronomía',
        districts: ['Ciutat Vella'],
        constraints: ['terraza exterior'],
      },
      score: 75,
      survivalThreshold: 60,
    });

    const vector = new Array(768).fill(0.05);
    await adapter.persistMemory(matrix, vector);

    const recovered = await adapter.getLatestSessionMemory('sess-user-1', 'default');
    expect(recovered).not.toBeNull();
    expect(recovered?.propsSnapshot.sessionId).toBe('sess-user-1');
    expect(recovered?.propsSnapshot.groupSize).toBe(2);
    expect(recovered?.propsSnapshot.timeWindow).toBe('3 horas');
    expect(recovered?.propsSnapshot.vibe).toBe('gastronomía');
    expect(recovered?.propsSnapshot.districts).toContain('Ciutat Vella');
    expect(recovered?.toDensePromptString()).toContain('Grupo: 2 personas');
  });

  it('debe ejecutar búsqueda semántica K-NN y retornar matches con score', async () => {
    const matrix2 = DenseSemanticMatrix.create({
      sessionId: 'sess-user-2',
      matrixId: 'nightlife',
      payload: {
        time_window: 'toda la noche',
        group_size: 4,
        vibe: 'fiesta',
        districts: ['Eixample'],
      },
      score: 80,
      survivalThreshold: 60,
    });
    const vector2 = new Array(768).fill(0.8);
    await adapter.persistMemory(matrix2, vector2);

    const matches = await adapter.searchSimilarMemories(new Array(768).fill(0.8), { limit: 2 });
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches[0].matrix.propsSnapshot.sessionId).toBe('sess-user-2');
    expect(matches[0].score).toBeGreaterThan(0.5);
  });

  it('debe respetar el límite defensivo acotado (limit: 100) en getRecentMemories', async () => {
    const recent = await adapter.getRecentMemories({ limit: 50 });
    expect(Array.isArray(recent)).toBe(true);
    expect(recent.length).toBeLessThanOrEqual(50);
    if (recent.length > 0) {
      expect(recent[0].denseText).toBeDefined();
      expect(recent[0].timestamp).toBeGreaterThan(0);
    }
  });

  it('debe podar higiénicamente la memoria de una sesión con clearSessionMemory', async () => {
    await adapter.clearSessionMemory('sess-user-1');
    const recovered = await adapter.getLatestSessionMemory('sess-user-1', 'default');
    expect(recovered).toBeNull();
  });
});
