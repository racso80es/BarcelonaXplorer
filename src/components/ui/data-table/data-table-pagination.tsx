'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions?: number[];
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  totalItems,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-surface-subtle/40 border-t border-layout-divider text-xs font-mono text-content-meta select-none">
      {/* Selector de densidad y rango */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span>Filas por página:</span>
          <select
            aria-label="Seleccionar filas por página"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-surface-container border border-layout-divider text-content-primary rounded px-2 py-1 focus:outline-none focus:border-emerald-500/80 cursor-pointer shadow-xs"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <span className="hidden sm:inline-block text-zinc-300">|</span>

        <span>
          Mostrando <strong className="text-content-primary">{startItem}</strong> -{' '}
          <strong className="text-content-primary">{endItem}</strong> de{' '}
          <strong className="text-content-primary">{totalItems}</strong>
        </span>
      </div>

      {/* Controles de navegación de página */}
      <div className="flex items-center gap-2">
        <span>
          Página <strong className="text-emerald-700 font-semibold">{currentPage}</strong> de{' '}
          <strong className="text-content-primary">{Math.max(1, totalPages)}</strong>
        </span>

        <div className="flex items-center gap-1 ml-2">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={!canPrev}
            aria-label="Primera página"
            className={`p-1.5 rounded border border-layout-divider bg-surface-container transition-colors shadow-xs ${
              canPrev
                ? 'text-content-primary hover:text-emerald-700 hover:bg-zinc-50 cursor-pointer'
                : 'text-zinc-300 opacity-40 cursor-not-allowed'
            }`}
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canPrev}
            aria-label="Página anterior"
            className={`p-1.5 rounded border border-layout-divider bg-surface-container transition-colors shadow-xs ${
              canPrev
                ? 'text-content-primary hover:text-emerald-700 hover:bg-zinc-50 cursor-pointer'
                : 'text-zinc-300 opacity-40 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canNext}
            aria-label="Página siguiente"
            className={`p-1.5 rounded border border-layout-divider bg-surface-container transition-colors shadow-xs ${
              canNext
                ? 'text-content-primary hover:text-emerald-700 hover:bg-zinc-50 cursor-pointer'
                : 'text-zinc-300 opacity-40 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={!canNext}
            aria-label="Última página"
            className={`p-1.5 rounded border border-layout-divider bg-surface-container transition-colors shadow-xs ${
              canNext
                ? 'text-content-primary hover:text-emerald-700 hover:bg-zinc-50 cursor-pointer'
                : 'text-zinc-300 opacity-40 cursor-not-allowed'
            }`}
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
