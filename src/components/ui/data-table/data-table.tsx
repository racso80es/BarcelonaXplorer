'use client';

import React, { useState, useMemo, useEffect, useId } from 'react';
import { ColumnDef, DataTableProps, SortDirection, SortState } from './types';
import { extractCellValue, compareValues, useDebounce, normalizeString } from './utils';
import { DataTableToolbar } from './data-table-toolbar';
import { DataTableHeader } from './data-table-header';
import { DataTableRow } from './data-table-row';
import { DataTablePagination } from './data-table-pagination';
import { DataTableEmpty } from './data-table-empty';
import { DataTableSkeleton } from './data-table-skeleton';

export function DataTable<T>({
  data = [],
  columns,
  searchPlaceholder = 'Buscar...',
  searchableKeys,
  isLoading = false,
  emptyMessage,
  className,
  onRowClick,
  initialSort,
  pageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
}: DataTableProps<T>) {
  const fallbackId = useId();

  // 1. Normalización segura de columnas (Resolución de Claves Virtuales)
  const normalizedColumns = useMemo(() => {
    return columns.map((col) => {
      const isVirtualWithoutAccessor =
        typeof col.key === 'string' &&
        !col.accessorFn &&
        data.length > 0 &&
        !(col.key in (data[0] as Record<string, unknown>));

      if (isVirtualWithoutAccessor) {
        return {
          ...col,
          sortable: false,
          filterable: false,
        };
      }
      return col;
    });
  }, [columns, data]);

  // 2. Estado de Ordenación Tridimensional (asc -> desc -> null)
  const [sortState, setSortState] = useState<SortState<T>>({
    column: initialSort?.column ?? null,
    direction: initialSort?.direction ?? null,
  });

  // 3. Estado de Búsqueda Global y Filtros por Columna
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 200);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // 4. Estado de Paginación y Volumetría
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);

  // Sincronizar pageSize si cambia la prop
  useEffect(() => {
    if (pageSize !== undefined) {
      setCurrentPageSize(pageSize);
    }
  }, [pageSize]);

  // Reset a Página 1 ante cambios de filtro o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterValues]);

  // Manejador del Ciclo de Ordenación
  const handleSortToggle = (columnKey: keyof T | string) => {
    setSortState((prev) => {
      if (prev.column !== columnKey) {
        return { column: columnKey, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { column: columnKey, direction: 'desc' };
      }
      if (prev.direction === 'desc') {
        return { column: null, direction: null };
      }
      return { column: columnKey, direction: 'asc' };
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterValues({});
    setCurrentPage(1);
  };

  // 5. Claves elegibles para Búsqueda Global
  const activeSearchKeys = useMemo(() => {
    if (searchableKeys && searchableKeys.length > 0) {
      return searchableKeys;
    }
    // Por defecto, columnas que no son virtuales o que tienen accessorFn
    return normalizedColumns
      .filter((col) => col.key && (col.accessorFn || typeof col.key === 'string'))
      .map((col) => col.key);
  }, [searchableKeys, normalizedColumns]);

  // 6. Pipeline Reactivo en Cliente (Filtro -> Ordenación -> Paginación)
  const { paginatedData, totalCount, filteredCount, totalPages } = useMemo(() => {
    const total = data.length;

    // A. Filtrado
    const filtered = data.filter((item) => {
      // Filtro Global
      if (debouncedSearchTerm.trim()) {
        const queryNorm = normalizeString(debouncedSearchTerm);
        const matchesGlobal = activeSearchKeys.some((k) => {
          const col = normalizedColumns.find((c) => c.key === k);
          if (!col) return false;
          const val = extractCellValue(item, col);
          if (val === null || val === undefined) return false;
          return normalizeString(String(val)).includes(queryNorm);
        });

        if (!matchesGlobal) return false;
      }

      // Filtros Facetados por Columna (AND lógico)
      for (const [colKey, filterVal] of Object.entries(filterValues)) {
        if (!filterVal || filterVal === 'ALL') continue;

        const col = normalizedColumns.find((c) => (c.key as string) === colKey);
        if (!col) continue;

        const cellValue = extractCellValue(item, col);
        const cellString = cellValue === null || cellValue === undefined ? '' : String(cellValue);

        if (col.filterType === 'select') {
          if (cellString !== filterVal) return false;
        } else {
          if (!normalizeString(cellString).includes(normalizeString(filterVal))) {
            return false;
          }
        }
      }

      return true;
    });

    // B. Ordenación
    let sorted = filtered;
    if (sortState.column !== null && sortState.direction !== null) {
      const activeCol = normalizedColumns.find((c) => c.key === sortState.column);
      if (activeCol) {
        sorted = [...filtered].sort((a, b) => {
          const valA = extractCellValue(a, activeCol);
          const valB = extractCellValue(b, activeCol);
          return compareValues(valA, valB, sortState.direction as 'asc' | 'desc');
        });
      }
    }

    const filteredTotal = sorted.length;

    // C. Paginación y Gobernanza del DOM
    let pages = 1;
    let paginated = sorted;

    if (currentPageSize > 0) {
      pages = Math.max(1, Math.ceil(filteredTotal / currentPageSize));
      const validPage = Math.min(currentPage, pages);
      const startIndex = (validPage - 1) * currentPageSize;
      paginated = sorted.slice(startIndex, startIndex + currentPageSize);
    }

    return {
      paginatedData: paginated,
      totalCount: total,
      filteredCount: filteredTotal,
      totalPages: pages,
    };
  }, [
    data,
    debouncedSearchTerm,
    filterValues,
    activeSearchKeys,
    normalizedColumns,
    sortState,
    currentPage,
    currentPageSize,
  ]);

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    Object.values(filterValues).some((v) => v !== '' && v !== 'ALL');

  return (
    <div
      className={`bg-zinc-900/90 border border-zinc-800 rounded-lg overflow-hidden shadow-xl ${
        className || ''
      }`}
    >
      {/* Barra de Herramientas */}
      <DataTableToolbar
        columns={normalizedColumns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalCount={totalCount}
        filteredCount={filteredCount}
        searchPlaceholder={searchPlaceholder}
      />

      {/* Contenedor Tabular con Scroll Horizontal */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <DataTableHeader
            columns={normalizedColumns}
            sortState={sortState}
            onSortToggle={handleSortToggle}
          />

          {isLoading ? (
            <DataTableSkeleton
              columnsCount={normalizedColumns.length}
              rowsCount={Math.min(5, currentPageSize || 5)}
            />
          ) : paginatedData.length === 0 ? (
            <tbody className="divide-y divide-zinc-800/80">
              <DataTableEmpty
                colSpan={normalizedColumns.length}
                emptyMessage={emptyMessage}
                hasActiveFilters={hasActiveFilters}
                onResetFilters={handleResetFilters}
              />
            </tbody>
          ) : (
            <tbody className="divide-y divide-zinc-800/80">
              {paginatedData.map((item, rowIndex) => {
                const itemRecord = item as Record<string, unknown>;
                const rowKey =
                  typeof itemRecord.id === 'string' || typeof itemRecord.id === 'number'
                    ? String(itemRecord.id)
                    : `${fallbackId}-${rowIndex}`;

                return (
                  <DataTableRow
                    key={rowKey}
                    item={item}
                    columns={normalizedColumns}
                    rowIndex={rowIndex}
                    onRowClick={onRowClick}
                  />
                );
              })}
            </tbody>
          )}
        </table>
      </div>

      {/* Paginador Táctico */}
      {currentPageSize > 0 && !isLoading && (
        <DataTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={currentPageSize}
          pageSizeOptions={pageSizeOptions}
          totalItems={filteredCount}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setCurrentPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
}
