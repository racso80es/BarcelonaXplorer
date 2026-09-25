import { Suspense } from 'react';
import { Brain } from 'lucide-react';
import { AdminPageHeader } from '../_components/AdminPageHeader';
import {
  CognitiveKpiCards,
  CognitiveKpiCardsSkeleton,
} from './CognitiveKpiCards';
import {
  CognitiveSessionsCard,
  CognitiveSessionsCardSkeleton,
} from './CognitiveSessionsCard';

export const dynamic = 'force-dynamic';

export default function AdminCognitivePage() {
  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <AdminPageHeader
        title="Observabilidad Cognitiva"
        description="Monitoreo sensorial de memoria vectorial LanceDB, métricas Zeigarnik y telemetría de sesiones"
        icon={<Brain className="text-emerald-600 w-7 h-7 sm:w-8 sm:h-8" />}
        badge={
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            RAG In-Process Activo
          </span>
        }
      />

      {/* 1. Tarjetas de Telemetría Cognitiva y KPIs (MySQL + LanceDB ping) */}
      <Suspense fallback={<CognitiveKpiCardsSkeleton />}>
        <CognitiveKpiCards />
      </Suspense>

      {/* 2. Bitácora Tabular de Memoria Cognitiva (LanceDB Bounded Query) */}
      <Suspense fallback={<CognitiveSessionsCardSkeleton />}>
        <CognitiveSessionsCard />
      </Suspense>
    </div>
  );
}
