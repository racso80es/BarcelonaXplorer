import { Suspense } from 'react';
import { ScrollText } from 'lucide-react';
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
        title="Logs del Sistema"
        description="Históricos de logs del sistema"
        icon={<ScrollText className="text-zinc-700 w-7 h-7 sm:w-8 sm:h-8" />}
      />

      {/* Contenedor de Bitácora y Tabla Interactiva DataTable */}
      <Suspense fallback={<TelemetryRecentLogsCardSkeleton />}>
        <TelemetryRecentLogsCard />
      </Suspense>
    </div>
  );
}
