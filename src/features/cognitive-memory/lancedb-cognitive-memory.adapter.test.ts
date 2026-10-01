import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LanceDbCognitiveMemoryAdapter } from './lancedb-cognitive-memory.adapter';
import { LanceDbVectorAdapter } from './lancedb-vector.adapter';
import { resetLanceDbConnection } from './lancedb-client';
import { DenseSemanticMatrix } from './dense-semantic-matrix.vo';
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
    const vector2 = Array.from({ length: 768 }, (_, i) => (i === 1 ? 1 : 0));
    await adapter.persistMemory(matrix2, vector2);

    const queryVector = Array.from({ length: 768 }, (_, i) => (i === 1 ? 1 : 0));
    const matches = await adapter.searchSimilarMemories(queryVector, { sessionId: 'sess-user-2', limit: 2 });
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches[0].matrix.propsSnapshot.sessionId).toBe('sess-user-2');
    expect(matches[0].score).toBeGreaterThan(0.5);
  });

  it('CA-2: debe aislar estrictamente las memorias por sessionId sin fuga cross-sesión', async () => {
    const matrixA = DenseSemanticMatrix.create({
      sessionId: 'sess-alpha',
      matrixId: 'gastronomy',
      payload: { vibe: 'tapas', group_size: 2 },
      score: 80,
    });
    const matrixB = DenseSemanticMatrix.create({
      sessionId: 'sess-beta',
      matrixId: 'nightlife',
      payload: { vibe: 'cocktails', group_size: 2 },
      score: 80,
    });
    const vector = Array.from({ length: 768 }, () => 0.05);

    await adapter.persistMemory(matrixA, vector);
    await adapter.persistMemory(matrixB, vector);

    const resultsA = await adapter.searchSimilarMemories(vector, {
      sessionId: 'sess-alpha',
      limit: 10,
    });
    expect(resultsA.length).toBe(1);
    expect(resultsA[0].matrix.propsSnapshot.sessionId).toBe('sess-alpha');
    expect(resultsA[0].matrix.propsSnapshot.matrixId).toBe('gastronomy');

    const resultsB = await adapter.searchSimilarMemories(vector, {
      sessionId: 'sess-beta',
      limit: 10,
    });
    expect(resultsB.length).toBe(1);
    expect(resultsB[0].matrix.propsSnapshot.sessionId).toBe('sess-beta');
    expect(resultsB[0].matrix.propsSnapshot.matrixId).toBe('nightlife');
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

  describe('PBI-MEM-002: Contrato Zod y Rehidratación Fiel', () => {
    it('debe persistir y recuperar fielmente mood y language con el contrato Zod', async () => {
      const matrix = DenseSemanticMatrix.create({
        sessionId: 'sess-zod-1',
        matrixId: 'default',
        payload: {
          group_size: 3,
          vibe: 'gastronómico',
          mood: 'relaxed',
          language: 'es',
        },
        score: 60,
      });

      const vector = new Array(768).fill(0.02);
      await adapter.persistMemory(matrix, vector);

      const recovered = await adapter.getLatestSessionMemory('sess-zod-1', 'default');
      expect(recovered).not.toBeNull();
      expect(recovered?.propsSnapshot.mood).toBe('relaxed');
      expect(recovered?.propsSnapshot.language).toBe('es');
      expect(recovered?.propsSnapshot.groupSize).toBe(3);
    });

    it('CA-4: debe retornar null ante fila con metadatos inválidos sin romper el flujo', async () => {
      // Inyectar directamente documento corrupto en LanceDB
      const corruptDoc = {
        id: 'sess-corrupt:default',
        vector: new Array(768).fill(0.01),
        text: 'Corrupt',
        metadata: {
          sessionId: '', // Inválido según el esquema (min: 1)
        },
      };
      await vectorStore.upsert(LanceDbCognitiveMemoryAdapter.TABLE_NAME, [corruptDoc]);

      const recovered = await adapter.getLatestSessionMemory('sess-corrupt', 'default');
      expect(recovered).toBeNull();
    });
  });
});
