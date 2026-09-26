import { Brain, Sparkles, Send, Database } from 'lucide-react';
import { KpiMetricCard, KpiTrend } from '../_components/KpiMetricCard';
import {
  ICognitiveMetricsPort,
  CognitiveMetricsSummary,
} from '@/features/cognitive-memory';
import { PrismaCognitiveMetricsRepository } from '@/features/cognitive-memory';
import { IVectorStorePort, VectorStorePingResult } from '@/features/cognitive-memory';
import { LanceDbVectorAdapter } from '@/features/cognitive-memory';

export interface CognitiveKpiCardsProps {
  readonly metricsPort?: ICognitiveMetricsPort;
  readonly vectorStorePort?: IVectorStorePort;
}

export async function CognitiveKpiCards({
  metricsPort = new PrismaCognitiveMetricsRepository(),
  vectorStorePort = new LanceDbVectorAdapter(),
}: CognitiveKpiCardsProps = {}) {
  let metrics: CognitiveMetricsSummary = {
    zeigarnikScore: 0,
    averageTurnsToSaturation: 0,
    anchorRate: 0,
    totalSessionsRecorded: 0,
  };

  let ping: VectorStorePingResult = {
    ok: false,
    latencyMs: 0,
    path: '',
    tableCount: 0,
    error: 'No inicializado',
  };

  try {
    const [fetchedMetrics, fetchedPing] = await Promise.all([
      metricsPort.getCognitiveMetrics(),
      vectorStorePort.ping(),
    ]);
    metrics = fetchedMetrics;
    ping = fetchedPing;
  } catch (error) {
    console.warn('[CognitiveKpiCards] Error recuperando métricas cognitivas:', error);
  }

  // 1. Tendencia y semáforo Zeigarnik Score (MySQL)
  const zeigarnikTrend: KpiTrend =
    metrics.zeigarnikScore >= 80
      ? 'positive'
      : metrics.zeigarnikScore >= 50
        ? 'warning'
        : 'negative';

  // 2. Tendencia y semáforo Entropía de Ingestión (MySQL)
  const turnsTrend: KpiTrend =
    metrics.averageTurnsToSaturation <= 3
      ? 'positive'
      : metrics.averageTurnsToSaturation <= 5
        ? 'warning'
        : 'negative';

  // 3. Tendencia y semáforo Anclaje Táctico (MySQL)
  const anchorTrend: KpiTrend = metrics.anchorRate >= 20 ? 'positive' : 'neutral';

  // 4. Tendencia LanceDB (Sonda in-process)
  const vectorTrend: KpiTrend = ping.ok ? 'positive' : 'negative';

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Tarjeta 1: Zeigarnik Score */}
      <KpiMetricCard
        title="Tasa de Saturación (Zeigarnik)"
        value={`${metrics.zeigarnikScore}%`}
        description="Sesiones que superan el peaje >= 60%"
        trend={zeigarnikTrend}
        trendLabel="S+ Grade"
        icon={<Brain className="h-4 w-4 text-emerald-600" />}
      />

      {/* Tarjeta 2: Entropía de Ingestión */}
      <KpiMetricCard
        title="Entropía de Ingestión"
        value={`${metrics.averageTurnsToSaturation} t`}
        description="Promedio de turnos conversacionales"
        trend={turnsTrend}
        trendLabel="Eficiencia SLM"
        icon={<Sparkles className="h-4 w-4 text-sky-600" />}
      />

      {/* Tarjeta 3: Tasa de Anclaje Táctico */}
      <KpiMetricCard
        title="Tasa de Anclaje Táctico"
        value={`${metrics.anchorRate}%`}
        description="Sesiones vinculadas a Telegram Bridge"
        trend={anchorTrend}
        trendLabel="Refugio"
        icon={<Send className="h-4 w-4 text-amber-600" />}
      />

      {/* Tarjeta 4: Salud de Memoria LanceDB */}
      <KpiMetricCard
        title="Salud LanceDB (Vector)"
        value={ping.ok ? 'OPERATIVO' : 'DEGRADADO'}
        description={`${ping.tableCount} tablas | ${ping.latencyMs}ms latencia`}
        trend={vectorTrend}
        trendLabel={ping.ok ? 'Apache Arrow' : 'Fallo'}
        icon={<Database className="h-4 w-4 text-zinc-500" />}
      />
    </div>
  );
}

export function CognitiveKpiCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-32 rounded-xl bg-surface-container border border-layout-divider p-6 animate-pulse flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <div className="h-4 w-32 bg-zinc-200 rounded" />
            <div className="h-4 w-4 bg-zinc-200 rounded" />
          </div>
          <div className="h-8 w-24 bg-zinc-200 rounded" />
          <div className="h-3 w-40 bg-zinc-200 rounded" />
        </div>
      ))}
    </div>
  );
}
