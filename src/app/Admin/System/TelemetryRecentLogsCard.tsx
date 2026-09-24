import { prisma } from '@/infrastructure/persistence/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Terminal, Trash2, Cpu } from 'lucide-react';
import { TelemetryTableClient, TelemetryLogItem } from './TelemetryTableClient';

export async function TelemetryRecentLogsCard() {
  let logs: TelemetryLogItem[] = [];

  let totalCount = 0;
  let errorCount = 0;

  try {
    const [fetchedLogs, total, errors] = await Promise.all([
      prisma.telemetryLog.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          level: true,
          context: true,
          message: true,
          statusCode: true,
          durationMs: true,
          payload: true,
        },
      }),
      prisma.telemetryLog.count(),
      prisma.telemetryLog.count({ where: { level: 'ERROR' } }),
    ]);

    logs = fetchedLogs;
    totalCount = total;
    errorCount = errors;
  } catch (err) {
    console.warn('[TelemetryRecentLogsCard] Error consultando logs en MySQL:', err);
  }

  const isLlmTelemetryActive = process.env.TELEMETRY_LLM_ENABLED === 'true';

  return (
    <Card className="bg-surface-container border-layout-divider text-content-primary shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-layout-divider gap-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-content-primary">
            <Terminal className="w-5 h-5 text-emerald-600" />
            <span>Órgano Sensorial: Bitácora de Telemetría (MySQL)</span>
          </CardTitle>
          <p className="text-xs text-content-meta">
            Trazabilidad polimórfica en tiempo real desde el Nodo 11
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
            <Cpu className="w-3.5 h-3.5 text-sky-600" />
            IA Telemetry: {isLlmTelemetryActive ? 'ACTIVA' : 'INACTIVA'}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
            <Trash2 className="w-3.5 h-3.5 text-amber-600" />
            Poda: 7d/30d
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 border border-layout-divider">
            Total: {totalCount}
          </span>
          {errorCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200">
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
              Errores: {errorCount}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 p-0 sm:p-4">
        <TelemetryTableClient logs={logs} />
      </CardContent>
    </Card>
  );
}

export function TelemetryRecentLogsCardSkeleton() {
  return (
    <Card className="bg-surface-container border-layout-divider shadow-sm animate-pulse">
      <CardHeader className="h-16 border-b border-layout-divider" />
      <CardContent className="h-48 pt-4 flex items-center justify-center">
        <span className="text-xs text-zinc-400 font-mono">
          Escaneando bóveda sensorial de MySQL...
        </span>
      </CardContent>
    </Card>
  );
}
