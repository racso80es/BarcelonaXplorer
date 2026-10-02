import { Suspense } from 'react';
import { Layers } from 'lucide-react';
import { AdminPageHeader } from '../_components/AdminPageHeader';
import {
  ContextSourcesCard,
  ContextSourcesCardSkeleton,
} from './ContextSourcesCard';
import {
  ContextMemoryCard,
  ContextMemoryCardSkeleton,
} from './ContextMemoryCard';

export const dynamic = 'force-dynamic';

export default function AdminContextPage() {
  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <AdminPageHeader
        title="Gobernanza de Contexto Hiperlocal"
        description="Supervisión soberana de fuentes de contexto, máquina de estados finitos y memoria vectorial LanceDB"
        icon={<Layers className="text-emerald-600 w-7 h-7 sm:w-8 sm:h-8" />}
        badge={
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            Soberanía Humana Activa
          </span>
        }
      />

      {/* Vista 2: Gobernanza de Fuentes de Contexto (Aprobación, Rechazo, Reactivación) */}
      <Suspense fallback={<ContextSourcesCardSkeleton />}>
        <ContextSourcesCard />
      </Suspense>

      {/* Vista 1: Memoria Vectorial LanceDB (context_memory) */}
      <Suspense fallback={<ContextMemoryCardSkeleton />}>
        <ContextMemoryCard />
      </Suspense>
    </div>
  );
}
