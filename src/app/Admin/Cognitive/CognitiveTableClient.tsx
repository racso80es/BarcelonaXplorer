'use client';

import React, { useMemo, useState } from 'react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import {
  Brain,
  Eye,
  X,
  Copy,
  Check,
  Hash,
  Clock,
  Sparkles,
  Layers,
  FileCode,
} from 'lucide-react';
import { CognitiveMemoryItem } from '@/application/ports/out/cognitive-memory.port';

export interface CognitiveTableClientProps {
  readonly sessions: CognitiveMemoryItem[];
}

export function CognitiveTableClient({ sessions }: CognitiveTableClientProps) {
  const [selectedSession, setSelectedSession] = useState<CognitiveMemoryItem | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const handleCopyText = (text: string, type: 'id' | 'json') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    }
  };

  const columns: ColumnDef<CognitiveMemoryItem>[] = useMemo(
    () => [
      {
        key: 'sessionId',
        header: 'Identidad Sombra (UUID)',
        sortable: true,
        cell: (item) => {
          const shortId = item.sessionId ? `${item.sessionId.slice(0, 8)}...` : 'N/A';
          return (
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span
                className="text-content-primary font-medium select-all"
                title={item.sessionId}
              >
                {shortId}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyText(item.sessionId, 'id');
                }}
                className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                title="Copiar UUID completo"
                aria-label="Copiar UUID"
              >
                {copiedId ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          );
        },
        className: 'w-44',
      },
      {
        key: 'timestamp',
        header: 'Última Mutación',
        sortable: true,
        accessorFn: (item) => item.timestamp,
        cell: (item) => {
          const date = new Date(item.timestamp);
          const formatted = isNaN(date.getTime())
            ? 'Fecha inválida'
            : date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
          return (
            <div className="flex items-center gap-1.5 text-xs text-content-meta font-mono">
              <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>{formatted}</span>
            </div>
          );
        },
        className: 'w-44',
      },
      {
        key: 'score',
        header: 'Estado de Maduración',
        sortable: true,
        filterable: true,
        filterType: 'select',
        filterOptions: [
          { label: 'Saturación S+ Grade (100%)', value: 'saturacion' },
          { label: 'Peaje Superado (>= 60%)', value: 'peaje' },
          { label: 'Fase Inerte (< 60%)', value: 'inerte' },
        ],
        accessorFn: (item) => {
          if (item.score === 100) return 'saturacion';
          if (item.score >= 60) return 'peaje';
          return 'inerte';
        },
        cell: (item) => {
          const isFull = item.score === 100;
          const isPassed = item.score >= 60 && item.score < 100;

          const badgeClass = isFull
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : isPassed
              ? 'bg-sky-50 text-sky-700 border-sky-200'
              : 'bg-amber-50 text-amber-700 border-amber-200';

          const label = isFull
            ? 'Saturación S+'
            : isPassed
              ? 'Peaje Superado'
              : 'Fase Inerte';

          return (
            <div className="space-y-1.5 min-w-[130px]">
              <div className="flex items-center justify-between gap-1 text-xs">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeClass}`}
                >
                  {label}
                </span>
                <span className="font-mono font-bold text-[11px] text-content-primary">
                  {item.score}%
                </span>
              </div>
              <div className="w-full bg-zinc-200/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isFull
                      ? 'bg-emerald-500'
                      : isPassed
                        ? 'bg-sky-500'
                        : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, item.score))}%` }}
                />
              </div>
            </div>
          );
        },
        className: 'w-48',
      },
      {
        key: 'denseText',
        header: 'Matriz Hiper-Densa (SLM)',
        sortable: false,
        cell: (item) => (
          <span
            className="text-content-primary truncate max-w-xs sm:max-w-md block font-mono text-xs"
            title={item.denseText}
          >
            {item.denseText || '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Acción',
        sortable: false,
        cell: (item) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSession(item);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded bg-white text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors border border-layout-divider shadow-xs cursor-pointer"
            title="Inspeccionar matriz vectorial y payload"
            aria-label="Inspeccionar sesión"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ver</span>
          </button>
        ),
        className: 'w-20 text-center',
        headerClassName: 'text-center',
      },
    ],
    [copiedId],
  );

  return (
    <>
      <DataTable
        data={sessions}
        columns={columns}
        searchPlaceholder="Buscar por UUID o contenido denso..."
        searchableKeys={['sessionId', 'denseText', 'matrixId']}
        pageSize={25}
        pageSizeOptions={[10, 25, 50, 100]}
        emptyMessage="No se han registrado memorias cognitivas recientes en LanceDB."
      />

      {/* Modal Forense de Inspección de Memoria */}
      {selectedSession && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="max-w-3xl w-full max-h-[85vh] bg-surface-container border border-layout-divider-strong rounded-xl shadow-2xl flex flex-col overflow-hidden text-content-primary"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-layout-divider bg-surface-subtle">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="p-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <Brain className="w-4 h-4" />
                </span>
                <span className="font-bold text-sm text-content-primary">
                  Inspección de Memoria Cognitiva (LanceDB)
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${
                    selectedSession.score === 100
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : selectedSession.score >= 60
                        ? 'bg-sky-50 text-sky-800 border-sky-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  Saturación: {selectedSession.score}%
                </span>
              </div>

              <button
                onClick={() => setSelectedSession(null)}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de Metadatos Tácticos */}
            <div className="px-6 py-2.5 bg-zinc-50 border-b border-layout-divider flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-zinc-600">
              <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-500 font-semibold">Sesión:</span>
                <span className="text-zinc-800 select-all font-mono font-medium">
                  {selectedSession.sessionId}
                </span>
                <button
                  onClick={() => handleCopyText(selectedSession.sessionId, 'id')}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-200/70 text-zinc-600 hover:text-zinc-900 transition-colors border border-layout-divider text-[10px]"
                  title="Copiar UUID de sesión"
                >
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-zinc-500">
                  Matriz: <strong className="text-zinc-700">{selectedSession.matrixId}</strong>
                </span>
                <span className="text-zinc-400">|</span>
                <span className="text-zinc-500">
                  {new Date(selectedSession.timestamp).toLocaleString('es-ES')}
                </span>
              </div>
            </div>

            {/* Cuerpo del Modal con Tabs / Scroll */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[60vh]">
              {/* Representación Densa */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-content-primary">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>Cadena Densa Destilada (Inyección RAG)</span>
                </div>
                <div className="p-3 bg-zinc-900 text-zinc-100 rounded-lg font-mono text-xs leading-relaxed select-all">
                  {selectedSession.denseText || 'Sin representación textual disponible'}
                </div>
              </div>

              {/* Payload JSON de Variables */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-content-primary">
                    <FileCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Payload de Variables de la Matriz (JSON)</span>
                  </div>
                  <button
                    onClick={() =>
                      handleCopyText(
                        JSON.stringify(selectedSession.payload, null, 2),
                        'json',
                      )
                    }
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono rounded bg-white text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-colors border border-layout-divider shadow-xs cursor-pointer"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar JSON</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3.5 bg-zinc-950 text-emerald-400 rounded-lg font-mono text-xs overflow-x-auto border border-zinc-800 leading-normal max-h-60 select-all">
                  {JSON.stringify(selectedSession.payload, null, 2)}
                </pre>
              </div>
            </div>

            {/* Pie del Modal */}
            <div className="px-6 py-3 border-t border-layout-divider bg-surface-subtle flex justify-end">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors cursor-pointer"
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
