/**
 * Ping empírico de modelos de embedding (PBI-STEEL-002 CA-1).
 * Ejecutar desde `src/`: npx --yes tsx ../scripts/gemini-embedding-ping.ts
 * No imprime la API key.
 */
import { GoogleGenAI } from '@google/genai';

const CANDIDATE_MODELS = ['text-embedding-004', 'embedding-001'] as const;
const PROBE_TEXT = 'BarcelonaXplorer embedding ping';
const DIMENSIONS = 768;

async function tryModel(ai: GoogleGenAI, model: string): Promise<boolean> {
  try {
    const response = await ai.models.embedContent({
      model,
      contents: PROBE_TEXT,
      config: { outputDimensionality: DIMENSIONS },
    });
    const res = response as {
      embedding?: { values?: number[] };
      embeddings?: Array<{ values?: number[] }>;
    };
    const values =
      res.embedding?.values ??
      (res.embeddings && res.embeddings.length > 0 ? res.embeddings[0]?.values : undefined);
    if (!values || values.length !== DIMENSIONS) {
      console.log(`[FAIL] ${model}: dimensión ${values?.length ?? 0} (esperado ${DIMENSIONS})`);
      return false;
    }
    console.log(`[OK] ${model}: HTTP 200, ${DIMENSIONS} dimensiones`);
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`[FAIL] ${model}: ${message.split('\n')[0]}`);
    return false;
  }
}

async function main(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error('GEMINI_API_KEY no definida en el entorno.');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });
  let winner: string | null = null;

  for (const model of CANDIDATE_MODELS) {
    const ok = await tryModel(ai, model);
    if (ok) {
      winner = model;
      break;
    }
  }

  if (!winner) {
    console.log('Ningún candidato fijo respondió; listando modelos embed vía API…');
    try {
      const pager = await ai.models.list();
      for await (const m of pager) {
        const name = m.name?.replace(/^models\//, '') ?? '';
        if (name.toLowerCase().includes('embed')) {
          console.log(`  - ${name}`);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`No se pudo listar modelos: ${message}`);
    }
    process.exit(2);
  }

  console.log(`\nAnclar en .env: GEMINI_EMBEDDING_MODEL=${winner}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
