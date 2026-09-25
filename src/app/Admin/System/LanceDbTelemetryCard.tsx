import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers } from 'lucide-react';
import {
  AuditLanceDbHealthUseCasePort,
  AuditLanceDbHealthResult,
} from '@/application/ports/in/audit-lancedb-health.use-case.port';
import { AuditLanceDbHealthUseCase } from '@/features/cognitive-memory';
import { LanceDbVectorAdapter } from '@/features/cognitive-memory';
import { PrismaTelemetryRepository } from '@/features/telemetry';

export interface LanceDbTelemetryCardProps {
  useCase?: AuditLanceDbHealthUseCasePort;
}

function createDefaultUseCase(): AuditLanceDbHealthUseCasePort {
  const vectorStore = new LanceDbVectorAdapter();
  const telemetryRepo = new PrismaTelemetryRepository();
  return new AuditLanceDbHealthUseCase(vectorStore, telemetryRepo);
}

/**
 * Sensor Vectorial (LanceDB Embebido) para la Sala de Control (/Admin/System).
 *
 * Principio DIP (La Vía del Yunque):
 * Componente Server Side estrictamente visual. Delega la comprobación
 * de descriptores, permisos POSIX y latencia al caso de uso AuditLanceDbHealthUseCase.
 */
export async function LanceDbTelemetryCard({ useCase }: LanceDbTelemetryCardProps = {}) {
  const auditUseCase = useCase ?? createDefaultUseCase();
  const status: AuditLanceDbHealthResult = await auditUseCase.execute();

  const dotColor =
    status.state === 'ok'
      ? 'bg-emerald-500'
      : status.state === 'warn'
        ? 'bg-amber-500'
        : 'bg-red-500';

  const textColor =
    status.state === 'ok'
      ? 'text-emerald-700 font-medium'
      : status.state === 'warn'
        ? 'text-amber-700 font-medium'
        : 'text-red-700 font-medium';

  return (
    <Card className="bg-surface-container border-layout-divider shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-content-meta">
          Persistencia Vectorial
        </CardTitle>
        <Layers className="h-4 w-4 text-zinc-400" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center mt-2">
          <div className={`w-2.5 h-2.5 rounded-full mr-3 shrink-0 ${dotColor}`} />
          <span className={`font-mono text-sm truncate ${textColor}`}>
            {status.msg}
          </span>
        </div>
        <p className="text-xs text-content-subtle font-mono mt-2 truncate" title={status.path}>
          {status.isHealthy
            ? `Tablas: ${status.tableCount} | ${status.latencyMs}ms`
            : status.path}
        </p>
      </CardContent>
    </Card>
  );
}

export function LanceDbTelemetryCardSkeleton() {
  return (
    <Card className="bg-surface-container border-layout-divider shadow-sm animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-28" />
        <div className="h-4 w-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center mt-2">
          <div className="w-2.5 h-2.5 rounded-full mr-3 bg-zinc-300 dark:bg-zinc-700" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-36" />
        </div>
        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-24 mt-2" />
      </CardContent>
    </Card>
  );
}
