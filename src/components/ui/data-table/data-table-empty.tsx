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
          <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500">
            <SearchX className="w-6 h-6 text-zinc-400" />
          </div>

          <div className="space-y-1">
            <p className="text-sm text-zinc-300 font-medium">Bóveda sin coincidencias</p>
            <p className="text-xs text-zinc-500">{emptyMessage}</p>
          </div>

          {hasActiveFilters && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 transition-colors"
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
