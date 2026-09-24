import { Suspense } from 'react';
import { Terminal } from 'lucide-react';
import { AdminPageHeader } from '../_components/AdminPageHeader';
import {
  TelemetryRecentLogsCard,
  TelemetryRecentLogsCardSkeleton,
} from '../System/TelemetryRecentLogsCard';

export const dynamic = 'force-dynamic';

export default function AdminLogsPage() {
  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <AdminPageHeader
        title="Bitácora de Telemetría"
        description="Registro sensorial polimórfico e inspección forense en tiempo real (MySQL)"
        icon={<Terminal className="text-emerald-600 w-7 h-7 sm:w-8 sm:h-8" />}
        badge={
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            Visión Forense
          </span>
        }
      />

      {/* Contenedor de Bitácora y Tabla Interactiva DataTable */}
      <Suspense fallback={<TelemetryRecentLogsCardSkeleton />}>
        <TelemetryRecentLogsCard />
      </Suspense>
    </div>
  );
}
