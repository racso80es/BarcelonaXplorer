'use client';

import React, { useMemo, useState } from 'react';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import { ContextMemoryEntryItem } from '@/features/context-sources/context-admin.service';
import { Eye, X, Copy, Check, Calendar, Layers } from 'lucide-react';

export interface ContextMemoryTableClientProps {
  readonly entries: ContextMemoryEntryItem[];
  readonly isLanceDbAvailable: boolean;
}

export function ContextMemoryTableClient({
  entries,
  isLanceDbAvailable,
}: ContextMemoryTableClientProps) {
  const [selectedEntry, setSelectedEntry] = useState<ContextMemoryEntryItem | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const handleCopyJson = (meta: Record<string, unknown>) => {
    navigator.clipboard.writeText(JSON.stringify(meta, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const columns: ColumnDef<ContextMemoryEntryItem>[] = useMemo(
    () => [
      {
        key: 'sourceTag',
        header: 'Fuente',
        sortable: true,
        cell: (item) => (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
            {item.sourceTag}
          </span>
        ),
      },
      {
        key: 'category',
        header: 'Categoría',
        sortable: true,
        cell: (item) => {
          const colors: Record<string, string> = {
            EVENT: 'bg-purple-50 text-purple-800 border-purple-200',
            VENUE: 'bg-blue-50 text-blue-800 border-blue-200',
            POI: 'bg-emerald-50 text-emerald-800 border-emerald-200',
            NEWS: 'bg-amber-50 text-amber-800 border-amber-200',
          };
          const badgeClass = colors[item.category] ?? 'bg-zinc-50 text-zinc-700 border-zinc-200';
          return (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeClass}`}>
              {item.category}
            </span>
          );
        },
      },
      {
        key: 'title',
        header: 'Título / Resumen',
        sortable: true,
        cell: (item) => (
          <div className="max-w-md">
            <p className="text-xs font-semibold text-content-primary line-clamp-1">{item.title}</p>
            <p className="text-[11px] text-content-secondary line-clamp-2 mt-0.5">{item.summary}</p>
          </div>
        ),
      },
      {
        key: 'startsAt',
        header: 'Inicio / Ocurrencia',
        sortable: true,
        cell: (item) => {
          if (!item.startsAt) {
            return <span className="text-xs text-content-meta font-mono">Permanente</span>;
          }
          const d = new Date(item.startsAt);
          return (
            <div className="flex items-center gap-1.5 text-xs text-content-secondary font-mono">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>{d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          );
        },
      },
      {
        key: 'expiresAt',
        header: 'Expira (TTL)',
        sortable: true,
        cell: (item) => {
          const d = new Date(item.expiresAt);
          return (
            <span className="text-[11px] font-mono text-content-meta">
              {d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </span>
          );
        },
      },
      {
        key: 'actions',
        header: 'Metadata',
        sortable: false,
        cell: (item) => (
          <button
            onClick={() => setSelectedEntry(item)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
            title="Inspeccionar metadata crudo"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver</span>
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {!isLanceDbAvailable && (
        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Aviso de LanceDB:</strong> La tabla vectorial <code>context_memory</code> no está inicializada o el motor está en proceso de arranque. Mostrando estado vacío resiliente.
            </span>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={entries}
        searchPlaceholder="Buscar por título, categoría o etiqueta de fuente..."
        searchableKeys={['title', 'sourceTag', 'category']}
        pageSize={10}
      />

      {/* Modal de Inspección de Metadata Crudo */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-container border border-layout-divider rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-layout-divider bg-surface-subtle">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-content-primary">
                  {selectedEntry.sourceTag}
                </span>
                <span className="text-xs text-content-secondary font-medium truncate max-w-sm">
                  — {selectedEntry.title}
                </span>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                <span className="text-content-secondary">Hash SHA-256:</span>
                <span className="text-zinc-600 select-all truncate max-w-xs">{selectedEntry.contentHash}</span>
              </div>
              <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-semibold text-content-primary">Payload Completo (JSON)</span>
                  <button
                    onClick={() => handleCopyJson(selectedEntry.rawMetadata)}
                    className="inline-flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded transition-colors"
                  >
                    {copiedJson ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedJson ? 'Copiado' : 'Copiar JSON'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-zinc-900 text-zinc-100 rounded-lg overflow-x-auto text-[11px] leading-relaxed max-h-80">
                  {JSON.stringify(selectedEntry.rawMetadata, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-3 border-t border-layout-divider bg-surface-subtle flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-1.5 text-xs font-medium bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-md transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
