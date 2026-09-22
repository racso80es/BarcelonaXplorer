'use client';

import React, { useMemo, useState } from 'react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import {
  Clock,
  Eye,
  X,
  Copy,
  Check,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Navigation,
} from 'lucide-react';

export interface TelemetryLogItem {
  id: string;
  createdAt: string | Date;
  level: string;
  context: string;
  message: string;
  statusCode: number | null;
  durationMs: number | null;
  payload?: unknown;
}

interface TelemetryTableClientProps {
  logs: TelemetryLogItem[];
}

export function TelemetryTableClient({ logs }: TelemetryTableClientProps) {
  const [selectedLog, setSelectedLog] = useState<TelemetryLogItem | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyJson = (payload: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    {
      key: 'actions',
      header: 'Detalle',
      sortable: false,
      cell: (log) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedLog(log);
          }}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono rounded bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors border border-zinc-700"
          title="Inspeccionar solicitud y respuesta"
        >
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          <span>Ver</span>
        </button>
      ),
      className: 'w-20 text-center',
      headerClassName: 'text-center',
    },
  ], []);

  // Parsear payload seleccionado de forma segura
  const payloadData = useMemo(() => {
    if (!selectedLog?.payload) return null;
    return typeof selectedLog.payload === 'object'
      ? (selectedLog.payload as Record<string, unknown>)
      : null;
  }, [selectedLog]);

  const requestInfo = (payloadData?.request ?? payloadData) as Record<string, unknown> | null;
  const responseInfo = payloadData?.response as Record<string, unknown> | null;

  return (
    <>
      <DataTable<TelemetryLogItem>
        data={logs}
        columns={columns}
        onRowClick={(log) => setSelectedLog(log)}
        searchPlaceholder="Buscar por mensaje, código o contexto..."
        searchableKeys={['message', 'context', 'level', 'statusCode']}
        initialSort={{ column: 'createdAt', direction: 'desc' }}
        pageSize={10}
        pageSizeOptions={[10, 25, 50]}
        emptyMessage="Bóveda sensorial despejada. No se detectan anomalías para los criterios indicados."
      />

      {/* Modal de Auditoría Forense: Solicitud y Datos Devueltos */}
      {selectedLog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="max-w-3xl w-full max-h-[85vh] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col overflow-hidden text-zinc-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                    selectedLog.level === 'ERROR'
                      ? 'text-red-400 bg-red-950/60 border-red-800/50'
                      : selectedLog.level === 'WARN'
                        ? 'text-amber-400 bg-amber-950/60 border-amber-800/50'
                        : selectedLog.level === 'DEBUG'
                          ? 'text-purple-400 bg-purple-950/60 border-purple-800/50'
                          : 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50'
                  }`}
                >
                  {selectedLog.level}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-zinc-800 text-sky-300 border border-zinc-700">
                  {selectedLog.context}
                </span>
                {selectedLog.durationMs !== null && (
                  <span className="text-xs font-mono text-zinc-400">
                    ⏱ {selectedLog.durationMs}ms
                  </span>
                )}
                {selectedLog.statusCode && (
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    HTTP {selectedLog.statusCode}
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Diagnóstico */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  Mensaje de Diagnóstico
                </h4>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 break-words">
                  {selectedLog.message}
                </div>
              </div>

              {/* 1. Solicitud (Prompt y Contexto) */}
              <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-sky-400" />
                    Solicitud Inyectada (Prompt & Contexto)
                  </h4>
                  {typeof requestInfo?.promptLength === 'number' && (
                    <span className="text-[11px] font-mono text-zinc-500">
                      {requestInfo.promptLength} caracteres
                    </span>
                  )}
                </div>

                {requestInfo?.prompt ? (
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Prompt del Usuario:</label>
                    <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono text-xs whitespace-pre-wrap">
                      {String(requestInfo.prompt)}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 italic">No se especificó prompt explícito.</div>
                )}

                {/* Variables Contextuales */}
                {Boolean(requestInfo?.environmentVariables && typeof requestInfo.environmentVariables === 'object') && (
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Variables de Entorno y Logística:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      {Object.entries(requestInfo?.environmentVariables as Record<string, unknown>).map(
                        ([k, v]) => (
                          <div
                            key={k}
                            className="p-2 rounded bg-zinc-900/80 border border-zinc-800/80 flex flex-col gap-0.5"
                          >
                            <span className="text-zinc-500 text-[10px] uppercase">{k}</span>
                            <span className="text-zinc-200 truncate">
                              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Datos Devueltos (Respuesta) */}
              <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950/40 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  {selectedLog.level === 'WARN' ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-400">Datos Devueltos: Claudicación Cognitiva</span>
                    </>
                  ) : selectedLog.level === 'ERROR' ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400">Datos Devueltos: Excepción Técnica</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Datos Devueltos: Itinerario Táctico Sintetizado</span>
                    </>
                  )}
                </h4>

                {/* Caso A: Respuesta estructurada de Ruta */}
                {responseInfo && typeof responseInfo === 'object' && 'waypoints' in responseInfo ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-zinc-400">
                        ID: <span className="text-zinc-200">{String(responseInfo.id)}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-mono text-[11px]">
                        {Array.isArray(responseInfo.waypoints) ? responseInfo.waypoints.length : 0} Waypoints
                      </span>
                    </div>

                    {typeof responseInfo.summary === 'string' && (
                      <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                        <span className="font-semibold text-zinc-400 block mb-1">Resumen del Itinerario:</span>
                        {responseInfo.summary}
                      </div>
                    )}

                    {Array.isArray(responseInfo.waypoints) && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-semibold text-zinc-400 block">Waypoints Generados:</span>
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                          {(responseInfo.waypoints as Array<Record<string, unknown>>).map((wp, idx) => (
                            <div
                              key={String(wp.id || idx)}
                              className="p-2 rounded bg-zinc-900/80 border border-zinc-800 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-zinc-200">
                                  {idx + 1}. {String(wp.title)}
                                </span>
                                {Boolean(wp.coordinates && typeof wp.coordinates === 'object') && (
                                  <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5" />
                                    {(wp.coordinates as { lat: number; lng: number }).lat?.toFixed(3)},{' '}
                                    {(wp.coordinates as { lat: number; lng: number }).lng?.toFixed(3)}
                                  </span>
                                )}
                              </div>
                              <p className="text-zinc-400 text-[11px]">{String(wp.description)}</p>
                              {Array.isArray(wp.recommendations) && wp.recommendations.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {wp.recommendations.map((rec, rIdx) => (
                                    <span
                                      key={rIdx}
                                      className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]"
                                    >
                                      {String(rec)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : responseInfo?.status === 'CLAUDICATION' ? (
                  /* Caso B: Claudicación */
                  <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs space-y-1">
                    <p className="font-semibold">Fricción Cognitiva Detectada</p>
                    <p className="text-zinc-300">{String(responseInfo.message)}</p>
                    {Boolean(responseInfo.rawOutput) && (
                      <p className="font-mono text-[11px] text-zinc-400 pt-1">
                        Salida cruda: {String(responseInfo.rawOutput)}
                      </p>
                    )}
                  </div>
                ) : (
                  /* Caso C: Otros o Fallback */
                  <div className="text-xs text-zinc-400 italic">
                    {responseInfo
                      ? JSON.stringify(responseInfo, null, 2)
                      : 'No se registraron datos de respuesta estructurados.'}
                  </div>
                )}
              </div>

              {/* 3. JSON Completo Inspeccionable */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Payload JSON Persistido
                  </h4>
                  <button
                    onClick={() => handleCopyJson(selectedLog.payload)}
                    className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.payload, null, 2) ?? '// Sin payload'}
                </pre>
              </div>
            </div>

            {/* Pie del Modal */}
            <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/60 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
