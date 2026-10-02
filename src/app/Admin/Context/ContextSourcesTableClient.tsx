'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, ColumnDef } from '@/components/ui/data-table';
import {
  ContextSourceSnapshot,
  ContextSourceStatus,
  StateMachineEvent,
} from '@/features/context-sources/context-source.types';
import { canTransition } from '@/features/context-sources/context-source-state-machine';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  PowerOff,
  Edit2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export interface ContextSourcesTableClientProps {
  readonly sources: ContextSourceSnapshot[];
}

export function ContextSourcesTableClient({ sources }: ContextSourcesTableClientProps) {
  const router = useRouter();
  const [loadingSourceId, setLoadingSourceId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingSource, setEditingSource] = useState<ContextSourceSnapshot | null>(null);
  const [newEndpoint, setNewEndpoint] = useState('');

  const executeTransition = useCallback(
    async (
      sourceId: string,
      event: StateMachineEvent,
      endpoint?: string
    ) => {
      setLoadingSourceId(sourceId);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const response = await fetch('/Admin/api/context-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceId, event, endpoint }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const errorText = data.errors?.join('; ') || data.feedback || 'Transición rechazada';
          setErrorMessage(`[Fallo de Transición] ${errorText}`);
        } else {
          setSuccessMessage(`Transición '${event}' ejecutada con éxito.`);
          router.refresh();
        }
      } catch (err) {
        setErrorMessage(
          `Error de red al ejecutar transición: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setLoadingSourceId(null);
        setEditingSource(null);
      }
    },
    [router]
  );

  const getStatusBadge = (status: ContextSourceStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            ACTIVA
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            DEGRADADA
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
            <ShieldAlert className="w-3 h-3 text-amber-600" />
            PENDIENTE
          </span>
        );
      case 'INACTIVE':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-300">
            INACTIVA
          </span>
        );
    }
  };

  const columns: ColumnDef<ContextSourceSnapshot>[] = useMemo(
    () => [
      {
        key: 'displayName',
        header: 'Fuente / Tag',
        sortable: true,
        cell: (item) => (
          <div>
            <p className="text-xs font-semibold text-content-primary flex items-center gap-1.5">
              <span>{item.displayName}</span>
              {item.proposedBy === 'ARGOS' && (
                <span className="text-[10px] font-mono px-1 rounded bg-purple-100 text-purple-800 border border-purple-200">
                  ARGOS
                </span>
              )}
            </p>
            <p className="text-[11px] font-mono text-content-secondary mt-0.5">{item.sourceTag}</p>
            {item.supersedesSourceTag && (
              <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                Sustituye a: <span className="font-semibold">{item.supersedesSourceTag}</span>
              </p>
            )}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Estado',
        sortable: true,
        cell: (item) => getStatusBadge(item.status),
      },
      {
        key: 'type',
        header: 'Tipo / Formato',
        sortable: true,
        cell: (item) => (
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200">
            {item.type}
          </span>
        ),
      },
      {
        key: 'endpoint',
        header: 'Endpoint / URI',
        sortable: true,
        cell: (item) => (
          <div className="max-w-xs flex items-center gap-1">
            <a
              href={item.endpoint}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-emerald-700 hover:text-emerald-900 truncate underline"
              title={item.endpoint}
            >
              {item.endpoint}
            </a>
            <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0" />
          </div>
        ),
      },
      {
        key: 'failedAttempts',
        header: 'Fallos',
        sortable: true,
        cell: (item) => (
          <span
            className={`text-xs font-mono font-semibold ${
              item.failedAttempts > 0 ? 'text-rose-600' : 'text-zinc-500'
            }`}
          >
            {item.failedAttempts}
          </span>
        ),
      },
      {
        key: 'lastError',
        header: 'Última Bitácora',
        sortable: false,
        cell: (item) => {
          if (item.lastError) {
            return (
              <p className="text-[11px] text-rose-700 font-mono line-clamp-2 max-w-xs" title={item.lastError}>
                {item.lastError}
              </p>
            );
          }
          if (item.lastSuccessAt) {
            const d = new Date(item.lastSuccessAt);
            return (
              <p className="text-[11px] text-zinc-500 font-mono">
                Éxito: {d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </p>
            );
          }
          return <span className="text-xs text-content-meta font-mono">Sin historial</span>;
        },
      },
      {
        key: 'actions',
        header: 'Acciones de Gobernanza',
        sortable: false,
        cell: (item) => {
          const isLoading = loadingSourceId === item.id;
          const canApprove = canTransition(item.status, 'APPROVE', 'HUMAN');
          const canReject = canTransition(item.status, 'REJECT', 'HUMAN');
          const canReactivate = canTransition(item.status, 'REACTIVATE', 'HUMAN');
          const canDeactivate = canTransition(item.status, 'DEACTIVATE', 'HUMAN');

          return (
            <div className="flex flex-wrap items-center gap-1.5">
              {canApprove && (
                <button
                  disabled={isLoading}
                  onClick={() => executeTransition(item.id, 'APPROVE')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded transition-colors disabled:opacity-50"
                  title="Aprobar fuente y pasar a ACTIVA"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aprobar</span>
                </button>
              )}

              {canReject && (
                <button
                  disabled={isLoading}
                  onClick={() => executeTransition(item.id, 'REJECT')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 border border-rose-300 rounded transition-colors disabled:opacity-50"
                  title="Rechazar fuente y pasar a INACTIVA"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Rechazar</span>
                </button>
              )}

              {canReactivate && (
                <button
                  disabled={isLoading}
                  onClick={() => executeTransition(item.id, 'REACTIVATE')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-sky-800 bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded transition-colors disabled:opacity-50"
                  title="Reactivar fuente tras resolución"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reactivar</span>
                </button>
              )}

              {canDeactivate && (
                <button
                  disabled={isLoading}
                  onClick={() => executeTransition(item.id, 'DEACTIVATE')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded transition-colors disabled:opacity-50"
                  title="Desactivar temporalmente"
                >
                  <PowerOff className="w-3.5 h-3.5" />
                  <span>Pausar</span>
                </button>
              )}

              <button
                disabled={isLoading}
                onClick={() => {
                  setEditingSource(item);
                  setNewEndpoint(item.endpoint);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded transition-colors"
                title="Editar endpoint de la fuente"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            </div>
          );
        },
      },
    ],
    [loadingSourceId, executeTransition]
  );

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 rounded text-rose-500 hover:bg-rose-100"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="p-1 rounded text-emerald-500 hover:bg-emerald-100"
          >
            ✕
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={sources}
        searchPlaceholder="Buscar fuentes por nombre o etiqueta..."
        searchableKeys={['displayName', 'sourceTag', 'endpoint']}
        pageSize={10}
      />

      {/* Modal de Edición de Endpoint */}
      {editingSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-surface-container border border-layout-divider rounded-xl max-w-lg w-full shadow-2xl overflow-hidden p-6 space-y-4">
            <h3 className="text-sm font-bold text-content-primary">
              Corregir Endpoint: {editingSource.displayName}
            </h3>
            <p className="text-xs text-content-secondary">
              Actualiza la URI de conexión de la fuente ({editingSource.sourceTag}). Si la fuente estaba degradada, pasará a PENDING_APPROVAL para validación.
            </p>
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-content-meta">Nuevo Endpoint URL:</label>
              <input
                type="url"
                value={newEndpoint}
                onChange={(e) => setNewEndpoint(e.target.value)}
                className="w-full text-xs font-mono p-2 rounded-md border border-layout-divider bg-surface-subtle focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-layout-divider">
              <button
                onClick={() => setEditingSource(null)}
                className="px-3 py-1.5 text-xs text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={!newEndpoint || newEndpoint === editingSource.endpoint}
                onClick={() =>
                  executeTransition(editingSource.id, 'PROPOSE_CORRECTION', newEndpoint)
                }
                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:opacity-50"
              >
                Guardar Corrección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
