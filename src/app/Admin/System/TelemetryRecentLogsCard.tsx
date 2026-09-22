import { PrismaClient } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Terminal, Trash2, Cpu } from 'lucide-react';
import { TelemetryTableClient, TelemetryLogItem } from './TelemetryTableClient';

const prisma = new PrismaClient();

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
    <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span>Órgano Sensorial: Bitácora de Telemetría (MySQL)</span>
          </CardTitle>
          <p className="text-xs text-zinc-400">
            Trazabilidad polimórfica en tiempo real desde el Nodo 11
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            IA Telemetry: {isLlmTelemetryActive ? 'ACTIVA' : 'INACTIVA'}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Trash2 className="w-3.5 h-3.5 text-amber-400" />
            Poda: 7d/30d
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800 text-emerald-400 border border-zinc-700">
            Total: {totalCount}
          </span>
          {errorCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/80 text-red-400 border border-red-800/50">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
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
    <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 animate-pulse">
      <CardHeader className="h-16 border-b border-zinc-800" />
      <CardContent className="h-48 pt-4 flex items-center justify-center">
        <span className="text-xs text-zinc-600 font-mono">
          Escaneando bóveda sensorial de MySQL...
        </span>
      </CardContent>
    </Card>
  );
}
