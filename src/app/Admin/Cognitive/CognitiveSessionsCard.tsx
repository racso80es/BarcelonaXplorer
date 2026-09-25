import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, ShieldCheck, Database, Layers } from 'lucide-react';
import {
  ICognitiveMemoryPort,
  CognitiveMemoryItem,
} from '@/application/ports/out/cognitive-memory.port';
import { LanceDbCognitiveMemoryAdapter } from '@/infrastructure/vector/lancedb-cognitive-memory.adapter';
import { CognitiveTableClient } from './CognitiveTableClient';

export interface CognitiveSessionsCardProps {
  readonly cognitiveMemoryPort?: ICognitiveMemoryPort;
}

export async function CognitiveSessionsCard({
  cognitiveMemoryPort = new LanceDbCognitiveMemoryAdapter(),
}: CognitiveSessionsCardProps = {}) {
  let sessions: CognitiveMemoryItem[] = [];

  try {
    // Ingesta Acotada Defensiva (Bounded Query Pattern): Límite duro inmutable de 100 registros
    sessions = await cognitiveMemoryPort.getRecentMemories({ limit: 100 });
  } catch (error) {
    console.warn('[CognitiveSessionsCard] Error consultando memorias recientes de LanceDB:', error);
  }

  const saturatedCount = sessions.filter((s) => s.score === 100).length;

  return (
    <Card className="bg-surface-container border-layout-divider text-content-primary shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-layout-divider gap-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-content-primary">
            <Brain className="w-5 h-5 text-emerald-600" />
            <span>Bitácora de Memoria Cognitiva (LanceDB)</span>
          </CardTitle>
          <p className="text-xs text-content-meta">
            Inspección de matrices hiper-densas para recuperación RAG in-process (Apache Arrow)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Anti-OOM (Límite: 100)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            Saturadas: {saturatedCount}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 border border-layout-divider">
            Total en Memoria: {sessions.length}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <CognitiveTableClient sessions={sessions} />
      </CardContent>
    </Card>
  );
}

export function CognitiveSessionsCardSkeleton() {
  return (
    <Card className="bg-surface-container border-layout-divider shadow-sm">
      <CardHeader className="pb-4 border-b border-layout-divider">
        <div className="h-6 w-72 bg-zinc-200 rounded animate-pulse" />
        <div className="h-4 w-96 bg-zinc-200 rounded animate-pulse mt-2" />
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="h-10 w-full bg-zinc-200 rounded animate-pulse" />
        <div className="h-64 w-full bg-zinc-100 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}
