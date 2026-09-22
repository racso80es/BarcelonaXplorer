'use client';

import React, { useMemo } from 'react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { Clock } from 'lucide-react';

export interface TelemetryLogItem {
  id: string;
  createdAt: string | Date;
  level: string;
  context: string;
  message: string;
  statusCode: number | null;
  durationMs: number | null;
}

interface TelemetryTableClientProps {
  logs: TelemetryLogItem[];
}

export function TelemetryTableClient({ logs }: TelemetryTableClientProps) {
  const columns: ColumnDef<TelemetryLogItem>[] = useMemo(() => [
    {
      key: 'level',
      header: 'Nivel',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'DEBUG', value: 'DEBUG' },
        { label: 'INFO', value: 'INFO' },
        { label: 'WARN', value: 'WARN' },
        { label: 'ERROR', value: 'ERROR' },
      ],
      cell: (log) => {
        const levelColor =
          log.level === 'ERROR'
            ? 'text-red-400 bg-red-950/60 border-red-800/50'
            : log.level === 'WARN'
              ? 'text-amber-400 bg-amber-950/60 border-amber-800/50'
              : log.level === 'DEBUG'
                ? 'text-purple-400 bg-purple-950/60 border-purple-800/50'
                : 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50';

        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${levelColor}`}>
            {log.level}
          </span>
        );
      },
      className: 'w-24',
    },
    {
      key: 'context',
      header: 'Contexto',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'CLIENT_UI', value: 'CLIENT_UI' },
        { label: 'SERVER_API', value: 'SERVER_API' },
        { label: 'LLM_ENGINE', value: 'LLM_ENGINE' },
        { label: 'SYSTEM', value: 'SYSTEM' },
        { label: 'SECURITY_PERIMETER', value: 'SECURITY_PERIMETER' },
      ],
      cell: (log) => {
        const contextColor =
          log.context === 'SECURITY_PERIMETER'
            ? 'text-rose-300 bg-rose-950/40 border-rose-800/40'
            : log.context === 'LLM_ENGINE'
              ? 'text-sky-300 bg-sky-950/40 border-sky-800/40'
              : log.context === 'CLIENT_UI'
                ? 'text-amber-300 bg-amber-950/40 border-amber-800/40'
                : 'text-zinc-300 bg-zinc-800 border-zinc-700';

        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${contextColor}`}>
            {log.context}
          </span>
        );
      },
      className: 'w-36',
    },
    {
      key: 'message',
      header: 'Mensaje de Diagnóstico',
      sortable: false,
      cell: (log) => (
        <span className="text-zinc-300 truncate max-w-sm sm:max-w-md block font-mono text-xs" title={log.message}>
          {log.message}
        </span>
      ),
    },
    {
      key: 'statusCode',
      header: 'HTTP',
      sortable: true,
      cell: (log) =>
        log.statusCode ? (
          <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px] font-mono">
            {log.statusCode}
          </span>
        ) : (
          <span className="text-zinc-600">—</span>
        ),
      className: 'w-20 text-center',
      headerClassName: 'text-center',
    },
    {
      key: 'durationMs',
      header: 'Latencia',
      sortable: true,
      cell: (log) =>
        log.durationMs !== null ? (
          <span
            className={`font-mono text-xs ${
              log.durationMs > 1000 ? 'text-amber-400 font-bold' : 'text-zinc-400'
            }`}
          >
            {log.durationMs}ms
          </span>
        ) : (
          <span className="text-zinc-600">—</span>
        ),
      className: 'w-24 text-right',
      headerClassName: 'text-right',
    },
    {
      key: 'createdAt',
      header: 'Hora',
      sortable: true,
      accessorFn: (log) => new Date(log.createdAt),
      cell: (log) => {
        const d = new Date(log.createdAt);
        return (
          <span className="inline-flex items-center gap-1 text-zinc-400 text-xs font-mono">
            <Clock className="w-3 h-3 text-zinc-600 shrink-0" />
            {d.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        );
      },
      className: 'w-28 text-right',
      headerClassName: 'text-right',
    },
  ], []);

  return (
    <DataTable<TelemetryLogItem>
      data={logs}
      columns={columns}
      searchPlaceholder="Buscar por mensaje, código o contexto..."
      searchableKeys={['message', 'context', 'level', 'statusCode']}
      initialSort={{ column: 'createdAt', direction: 'desc' }}
      pageSize={10}
      pageSizeOptions={[10, 25, 50]}
      emptyMessage="Bóveda sensorial despejada. No se detectan anomalías para los criterios indicados."
    />
  );
}
