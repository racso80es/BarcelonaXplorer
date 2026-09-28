import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { purgeFallbackVectors } from './purge-fallback-vectors';
import { LanceDbVectorAdapter } from './lancedb-vector.adapter';
import { LanceDbCognitiveMemoryAdapter } from './lancedb-cognitive-memory.adapter';
import { buildDeterministicFallbackVector } from '@/features/ai-engine/deterministic-embedding-fallback';
import { resetLanceDbConnection } from './lancedb-client';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('purgeFallbackVectors', () => {
  const testDir = path.join(os.tmpdir(), `lancedb_purge_${Date.now()}`);
  let vectorStore: LanceDbVectorAdapter;

  beforeAll(() => {
    resetLanceDbConnection();
    vectorStore = new LanceDbVectorAdapter(testDir);
  });

  afterAll(() => {
    resetLanceDbConnection();
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch {
      // ignore
    }
  });

  it('debe detectar vectores fallback en dry-run y eliminarlos con --apply', async () => {
    const text = 'prompt de prueba para purga';
    const fallbackVector = buildDeterministicFallbackVector(text);
    const providerLikeVector = Array.from({ length: 768 }, (_, i) =>
      i === 0 ? 1 : 0,
    );

    await vectorStore.upsert(LanceDbCognitiveMemoryAdapter.TABLE_NAME, [
      {
        id: 'fallback-row',
        vector: fallbackVector,
        text,
        metadata: {},
      },
      {
        id: 'real-row',
        vector: providerLikeVector,
        text: 'otro texto distinto',
        metadata: {},
      },
    ]);

    const dryRun = await purgeFallbackVectors({ dryRun: true, uri: testDir });
    const cognitive = dryRun.tables.find(
      (t) => t.tableName === LanceDbCognitiveMemoryAdapter.TABLE_NAME,
    );
    expect(cognitive?.matches).toBe(1);

    const applied = await purgeFallbackVectors({ dryRun: false, uri: testDir });
    expect(applied.tables[0]?.deleted).toBe(1);

    const secondDry = await purgeFallbackVectors({ dryRun: true, uri: testDir });
    expect(secondDry.tables[0]?.matches).toBe(0);
  });
});
