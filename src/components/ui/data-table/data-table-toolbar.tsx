'use client';

import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { ColumnDef } from './types';

interface DataTableToolbarProps<T> {
  columns: ColumnDef<T>[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
  searchPlaceholder?: string;
}

export function DataTableToolbar<T>({
  columns,
  searchTerm,
  onSearchChange,
  filterValues,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
  searchPlaceholder = 'Buscar...',
}: DataTableToolbarProps<T>) {
  const filterableColumns = columns.filter(
    (col) => col.filterable && col.filterType === 'select' && col.filterOptions && col.filterOptions.length > 0
  );

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    Object.values(filterValues).some((v) => v !== '' && v !== 'ALL');

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 sm:p-4 bg-surface-subtle/50 border-b border-layout-divider">
      {/* Zona izquierda: Buscador y filtros de columna */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {/* Caja de Búsqueda Rápida */}
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-1.5 text-xs font-mono bg-white border border-layout-divider-strong rounded-md text-content-primary placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-focus-tactical transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Desplegables de Filtro por Columna */}
        {filterableColumns.map((col) => {
          const key = col.key as string;
          const currentValue = filterValues[key] || 'ALL';

          return (
            <div key={key} className="flex items-center">
              <select
                aria-label={`Filtrar por ${String(col.header)}`}
                value={currentValue}
                onChange={(e) => onFilterChange(key, e.target.value)}
                className="bg-white border border-layout-divider-strong text-zinc-700 text-xs font-mono rounded-md px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-focus-tactical transition-colors cursor-pointer"
              >
                <option value="ALL">
                  {typeof col.header === 'string' ? `${col.header}: Todos` : 'Todos'}
                </option>
                {col.filterOptions?.map((opt) => (
                  <option key={String(opt.value)} value={String(opt.value)}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        })}

        {/* Botón Restaurar Filtros */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-md bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 border border-layout-divider-strong transition-colors shadow-xs"
            title="Restablecer todos los filtros"
          >
            <RotateCcw className="w-3 h-3 text-zinc-500" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      {/* Zona derecha: Contador Táctico */}
      <div className="flex items-center gap-2 text-xs font-mono text-content-meta self-end md:self-auto shrink-0">
        <span>
          Mostrando{' '}
          <strong className="text-emerald-700 font-semibold">{filteredCount}</strong> de{' '}
          <strong className="text-zinc-800">{totalCount}</strong> registros
        </span>
      </div>
    </div>
  );
}
