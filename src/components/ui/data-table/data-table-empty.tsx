'use client';

import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';

interface DataTableEmptyProps {
  colSpan: number;
  emptyMessage?: string;
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
}

export function DataTableEmpty({
  colSpan,
  emptyMessage = 'No se han encontrado registros que coincidan con los criterios de búsqueda.',
  hasActiveFilters = false,
  onResetFilters,
}: DataTableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-14 px-4 text-center">
        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3 font-mono">
          <div className="p-3 rounded-full bg-surface-subtle border border-layout-divider text-zinc-400 shadow-xs">
            <SearchX className="w-6 h-6 text-zinc-500" />
          </div>

          <div className="space-y-1">
            <p className="text-sm text-content-primary font-medium">Bóveda sin coincidencias</p>
            <p className="text-xs text-content-meta">{emptyMessage}</p>
          </div>

          {hasActiveFilters && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-md bg-surface-container hover:bg-zinc-50 text-emerald-700 border border-layout-divider shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
