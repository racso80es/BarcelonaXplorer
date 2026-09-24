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
  Hash,
  Terminal,
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
  const [copiedId, setCopiedId] = useState(false);
  const [copiedStack, setCopiedStack] = useState(false);

  const handleCopyText = (text: string, type: 'json' | 'id' | 'stack') => {
    navigator.clipboard.writeText(text);
    if (type === 'json') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else if (type === 'stack') {
      setCopiedStack(true);
      setTimeout(() => setCopiedStack(false), 2000);
    }
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
            ? 'text-red-700 bg-red-50 border-red-200'
            : log.level === 'WARN'
              ? 'text-amber-800 bg-amber-50 border-amber-200'
              : log.level === 'DEBUG'
                ? 'text-purple-700 bg-purple-50 border-purple-200'
                : 'text-emerald-700 bg-emerald-50 border-emerald-200';

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
            ? 'text-rose-800 bg-rose-50 border-rose-200'
            : log.context === 'LLM_ENGINE'
              ? 'text-sky-800 bg-sky-50 border-sky-200'
              : log.context === 'CLIENT_UI'
                ? 'text-amber-800 bg-amber-50 border-amber-200'
                : 'text-zinc-800 bg-zinc-100 border-layout-divider';

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
        <span className="text-content-primary truncate max-w-sm sm:max-w-md block font-mono text-xs sm:text-sm" title={log.message}>
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
          <span className="inline-block px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-layout-divider text-[11px] font-mono">
            {log.statusCode}
          </span>
        ) : (
          <span className="text-zinc-400">—</span>
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
              log.durationMs > 1000 ? 'text-amber-700 font-bold' : 'text-zinc-600'
            }`}
          >
            {log.durationMs}ms
          </span>
        ) : (
          <span className="text-zinc-400">—</span>
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
          <span className="inline-flex items-center gap-1 text-zinc-600 text-xs font-mono">
            <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
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
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded bg-white text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors border border-layout-divider shadow-xs"
          title="Inspeccionar solicitud y respuesta"
        >
          <Eye className="w-3.5 h-3.5 text-sky-600" />
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

  // Formato completo de fecha y hora
  const fullDateFormatted = useMemo(() => {
    if (!selectedLog) return '';
    const d = new Date(selectedLog.createdAt);
    if (isNaN(d.getTime())) return String(selectedLog.createdAt);
    const datePart = d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timePart = d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return `${datePart} ${timePart}`;
  }, [selectedLog]);

  // Extracción defensiva del Stack Trace
  const stackTrace = useMemo(() => {
    if (!selectedLog?.payload || typeof selectedLog.payload !== 'object') return null;
    const p = selectedLog.payload as Record<string, unknown>;
    if (typeof p.stack === 'string' && p.stack.trim().length > 0) return p.stack.trim();
    if (typeof p.stackTrace === 'string' && p.stackTrace.trim().length > 0) return p.stackTrace.trim();
    if (typeof p.trace === 'string' && p.trace.trim().length > 0) return p.trace.trim();
    if (
      p.error &&
      typeof p.error === 'object' &&
      typeof (p.error as Record<string, unknown>).stack === 'string'
    ) {
      return ((p.error as Record<string, unknown>).stack as string).trim();
    }
    if (typeof p.error === 'string' && p.error.includes('\n    at ')) {
      return p.error.trim();
    }
    if (responseInfo && typeof responseInfo.stack === 'string' && responseInfo.stack.trim().length > 0) {
      return responseInfo.stack.trim();
    }
    return null;
  }, [selectedLog, responseInfo]);

  // Extracción de detalles técnicos estructurados del payload
  const technicalDetails = useMemo(() => {
    if (!payloadData) return null;
    const items: Array<{ label: string; value: string }> = [];

    if (payloadData.error && typeof payloadData.error !== 'object') {
      items.push({ label: 'Error Técnico', value: String(payloadData.error) });
    }
    if (payloadData.reason) {
      items.push({ label: 'Causa Raíz / Motivo', value: String(payloadData.reason) });
    }
    if (payloadData.lastErrorMessage) {
      items.push({ label: 'Último Error de Webhook', value: String(payloadData.lastErrorMessage) });
    }
    if (payloadData.actualWebhookUrl || payloadData.webhookActualUrl) {
      items.push({
        label: 'URL Webhook Detectada',
        value: String(payloadData.actualWebhookUrl || payloadData.webhookActualUrl),
      });
    }
    if (payloadData.expectedWebhookUrl) {
      items.push({ label: 'URL Webhook Esperada', value: String(payloadData.expectedWebhookUrl) });
    }
    if (payloadData.pendingUpdates !== undefined) {
      items.push({ label: 'Updates Pendientes', value: String(payloadData.pendingUpdates) });
    }
    if (payloadData.latencyMs !== undefined) {
      items.push({ label: 'Latencia de Sonda', value: `${payloadData.latencyMs}ms` });
    }

    return items.length > 0 ? items : null;
  }, [payloadData]);

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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="max-w-3xl w-full max-h-[85vh] bg-surface-container border border-layout-divider-strong rounded-xl shadow-2xl flex flex-col overflow-hidden text-content-primary"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-divider bg-surface-subtle">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                    selectedLog.level === 'ERROR'
                      ? 'text-red-700 bg-red-50 border-red-200'
                      : selectedLog.level === 'WARN'
                        ? 'text-amber-800 bg-amber-50 border-amber-200'
                        : selectedLog.level === 'DEBUG'
                          ? 'text-purple-700 bg-purple-50 border-purple-200'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  }`}
                >
                  {selectedLog.level}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-zinc-100 text-sky-800 border border-layout-divider">
                  {selectedLog.context}
                </span>
                {selectedLog.durationMs !== null && (
                  <span className="text-xs font-mono text-content-meta">
                    ⏱ {selectedLog.durationMs}ms
                  </span>
                )}
                {selectedLog.statusCode && (
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-layout-divider">
                    HTTP {selectedLog.statusCode}
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Metadatos Tácticos (ID + Fecha y Hora) */}
            <div className="px-6 py-2.5 bg-zinc-50 border-b border-layout-divider flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-600">
              <div className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-500 font-semibold">ID:</span>
                <span className="text-zinc-800 select-all font-mono font-medium">{selectedLog.id}</span>
                <button
                  onClick={() => handleCopyText(selectedLog.id, 'id')}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-200/70 text-zinc-600 hover:text-zinc-900 transition-colors border border-layout-divider text-[10px] ml-1"
                  title="Copiar ID"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-zinc-400" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-zinc-700">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>{fullDateFormatted}</span>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Diagnóstico Principal */}
              <div>
                <h4 className="text-xs font-semibold text-content-meta uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-zinc-500" />
                  Mensaje de Diagnóstico
                </h4>
                <div className="p-3 rounded-lg bg-zinc-50 border border-layout-divider font-mono text-xs text-zinc-800 break-words leading-relaxed">
                  {selectedLog.message}
                </div>
              </div>

              {/* Traza Técnica (Stack Trace) si está disponible */}
              {stackTrace && (
                <div className="border border-red-200 bg-red-50/40 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-red-600" />
                      Traza Técnica (Stack Trace)
                    </h4>
                    <button
                      onClick={() => handleCopyText(stackTrace, 'stack')}
                      className="inline-flex items-center gap-1 text-[11px] text-red-800 hover:text-red-950 px-2 py-0.5 rounded bg-white hover:bg-red-100/70 border border-red-200 transition-colors shadow-xs"
                    >
                      {copiedStack ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700 font-medium">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-red-500" />
                          <span>Copiar Traza</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 rounded-lg bg-zinc-900 text-red-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-56 border border-zinc-800 leading-relaxed">
                    {stackTrace}
                  </pre>
                </div>
              )}

              {/* 1. Solicitud (Prompt y Contexto) - Solo si aplica */}
              {(selectedLog.context === 'LLM_ENGINE' || Boolean(requestInfo?.prompt)) && (
                <div className="border border-layout-divider rounded-lg p-4 bg-surface-subtle/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-sky-700 uppercase tracking-wider flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-sky-600" />
                      Solicitud Inyectada (Prompt & Contexto)
                    </h4>
                    {typeof requestInfo?.promptLength === 'number' && (
                      <span className="text-[11px] font-mono text-content-meta">
                        {requestInfo.promptLength} caracteres
                      </span>
                    )}
                  </div>

                  {requestInfo?.prompt ? (
                    <div>
                      <label className="text-[11px] text-content-meta block mb-1">Prompt del Usuario:</label>
                      <div className="p-2.5 rounded bg-white border border-layout-divider text-zinc-800 font-mono text-xs whitespace-pre-wrap">
                        {String(requestInfo.prompt)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-400 italic">No se especificó prompt explícito.</div>
                  )}

                  {/* Variables Contextuales */}
                  {Boolean(
                    requestInfo?.environmentVariables &&
                      typeof requestInfo.environmentVariables === 'object'
                  ) && (
                    <div>
                      <label className="text-[11px] text-content-meta block mb-1">
                        Variables de Entorno y Logística:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                        {Object.entries(
                          requestInfo?.environmentVariables as Record<string, unknown>
                        ).map(([k, v]) => (
                          <div
                            key={k}
                            className="p-2 rounded bg-white border border-layout-divider flex flex-col gap-0.5"
                          >
                            <span className="text-zinc-500 text-[10px] uppercase font-semibold">{k}</span>
                            <span className="text-zinc-800 truncate">
                              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Datos Devueltos / Respuesta Estructurada / Excepción Técnica */}
              <div className="border border-layout-divider rounded-lg p-4 bg-surface-subtle/50 space-y-3">
                <h4 className="text-xs font-bold text-content-accent uppercase tracking-wider flex items-center gap-2">
                  {selectedLog.level === 'WARN' ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-amber-800">
                        {responseInfo?.status === 'CLAUDICATION'
                          ? 'Datos Devueltos: Claudicación Cognitiva'
                          : 'Diagnóstico de Advertencia Táctica'}
                      </span>
                    </>
                  ) : selectedLog.level === 'ERROR' ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-red-700">Datos Devueltos: Excepción Técnica</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Datos Devueltos: Respuesta Operativa</span>
                    </>
                  )}
                </h4>

                {/* Caso A: Respuesta estructurada de Ruta LLM */}
                {responseInfo && typeof responseInfo === 'object' && 'waypoints' in responseInfo ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-content-meta">
                        ID: <span className="text-zinc-800 font-semibold">{String(responseInfo.id)}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[11px] font-medium">
                        {Array.isArray(responseInfo.waypoints) ? responseInfo.waypoints.length : 0} Waypoints
                      </span>
                    </div>

                    {typeof responseInfo.summary === 'string' && (
                      <div className="p-2.5 rounded bg-white border border-layout-divider text-xs text-zinc-800">
                        <span className="font-semibold text-zinc-600 block mb-1">Resumen del Itinerario:</span>
                        {responseInfo.summary}
                      </div>
                    )}

                    {Array.isArray(responseInfo.waypoints) && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-semibold text-zinc-600 block">Waypoints Generados:</span>
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                          {(responseInfo.waypoints as Array<Record<string, unknown>>).map((wp, idx) => (
                            <div
                              key={String(wp.id || idx)}
                              className="p-2 rounded bg-white border border-layout-divider text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-zinc-900">
                                  {idx + 1}. {String(wp.title)}
                                </span>
                                {Boolean(wp.coordinates && typeof wp.coordinates === 'object') && (
                                  <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5 text-zinc-400" />
                                    {(wp.coordinates as { lat: number; lng: number }).lat?.toFixed(3)},{' '}
                                    {(wp.coordinates as { lat: number; lng: number }).lng?.toFixed(3)}
                                  </span>
                                )}
                              </div>
                              <p className="text-zinc-600 text-[11px]">{String(wp.description)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : responseInfo?.status === 'CLAUDICATION' ? (
                  /* Caso B: Claudicación */
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                    <p className="font-semibold text-amber-900">Fricción Cognitiva Detectada</p>
                    <p className="text-zinc-800">{String(responseInfo.message)}</p>
                    {Boolean(responseInfo.rawOutput) && (
                      <p className="font-mono text-[11px] text-zinc-600 pt-1">
                        Salida cruda: {String(responseInfo.rawOutput)}
                      </p>
                    )}
                  </div>
                ) : technicalDetails && technicalDetails.length > 0 ? (
                  /* Caso C: Desglose técnico de la excepción/anomalía */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    {technicalDetails.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded bg-white border border-layout-divider flex flex-col gap-1 shadow-2xs"
                      >
                        <span className="text-zinc-500 text-[10px] uppercase font-semibold tracking-wider">
                          {item.label}
                        </span>
                        <span className="text-zinc-800 break-words font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Caso D: Fallback */
                  <div className="text-xs text-zinc-500 italic">
                    {responseInfo
                      ? JSON.stringify(responseInfo, null, 2)
                      : 'No se registraron datos de respuesta estructurados adicionales.'}
                  </div>
                )}
              </div>

              {/* 3. JSON Completo Inspeccionable */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-semibold text-content-meta uppercase tracking-wider">
                    Payload JSON Persistido
                  </h4>
                  <button
                    onClick={() => handleCopyText(JSON.stringify(selectedLog.payload, null, 2), 'json')}
                    className="inline-flex items-center gap-1 text-[11px] text-zinc-700 hover:text-zinc-900 px-2 py-0.5 rounded bg-white hover:bg-zinc-100 border border-layout-divider transition-colors shadow-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-medium">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-zinc-500" />
                        <span>Copiar JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-zinc-50 border border-layout-divider text-[11px] font-mono text-zinc-800 overflow-x-auto max-h-48 leading-relaxed">
                  {JSON.stringify(selectedLog.payload, null, 2) ?? '// Sin payload'}
                </pre>
              </div>
            </div>

            {/* Pie del Modal */}
            <div className="px-6 py-3 border-t border-layout-divider bg-surface-subtle flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-white border border-layout-divider-strong text-zinc-800 hover:bg-zinc-100 transition-colors shadow-xs"
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


