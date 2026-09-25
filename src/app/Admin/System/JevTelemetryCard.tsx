import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu } from 'lucide-react';
import {
  AuditJevHealthUseCasePort,
  AuditJevHealthResult,
} from '@/application/ports/in/audit-jev-health.use-case.port';
import { AuditJevHealthUseCase } from '@/features/ai-engine';
import { JevClient } from '@/features/ai-engine/jev/jevClient';
import { PrismaTelemetryRepository } from '@/features/telemetry';

export interface JevTelemetryCardProps {
  useCase?: AuditJevHealthUseCasePort;
}

function createDefaultUseCase(): AuditJevHealthUseCasePort {
  const telemetryRepo = new PrismaTelemetryRepository();
  return new AuditJevHealthUseCase(
    new JevClient(undefined, telemetryRepo),
    telemetryRepo,
  );
}

/**
 * Sensor C (Jev AI System One) para el panel táctico de administración.
 *
 * Principio DIP (Vía del Yunque):
 * Componente estrictamente visual (Server Component). No orquesta persistencia
 * ni mutaciones de estado; delega toda la auditoría y logging reactivo al
 * caso de uso AuditJevHealthUseCase.
 */
export async function JevTelemetryCard({ useCase }: JevTelemetryCardProps = {}) {
  const auditUseCase = useCase ?? createDefaultUseCase();
  const status: AuditJevHealthResult = await auditUseCase.execute();

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
          Motor Decisión (Jev AI)
        </CardTitle>
        <Cpu className="h-4 w-4 text-zinc-400" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center mt-2">
          <div className={`w-2.5 h-2.5 rounded-full mr-3 ${dotColor}`} />
          <span className={`font-mono text-sm truncate ${textColor}`}>
            {status.msg}
          </span>
        </div>
        <p className="text-xs text-content-subtle font-mono mt-2">
          Modelo: {status.model}
        </p>
      </CardContent>
    </Card>
  );
}

export function JevTelemetryCardSkeleton() {
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
