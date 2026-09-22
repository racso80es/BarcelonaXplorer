'use client';

import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { ColumnDef, SortState } from './types';

interface DataTableHeaderProps<T> {
  columns: ColumnDef<T>[];
  sortState: SortState<T>;
  onSortToggle: (columnKey: keyof T | string) => void;
}

export function DataTableHeader<T>({
  columns,
  sortState,
  onSortToggle,
}: DataTableHeaderProps<T>) {
  return (
    <thead className="bg-surface-subtle border-b border-layout-divider">
      <tr>
        {columns.map((column, index) => {
          const key = column.key as string;
          const isCurrentSort = sortState.column === column.key;
          const isSortable = Boolean(column.sortable);

          const ariaSortValue = isCurrentSort
            ? sortState.direction === 'asc'
              ? 'ascending'
              : sortState.direction === 'desc'
                ? 'descending'
                : 'none'
            : 'none';

          const headerTitle =
            typeof column.header === 'string'
              ? column.header
              : `Columna ${index + 1}`;

          return (
            <th
              key={key || index}
              scope="col"
              tabIndex={isSortable ? 0 : undefined}
              aria-sort={isSortable ? ariaSortValue : undefined}
              aria-label={isSortable ? `Ordenar por ${headerTitle}` : undefined}
              onClick={() => {
                if (isSortable) {
                  onSortToggle(column.key);
                }
              }}
              onKeyDown={(e) => {
                if (isSortable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSortToggle(column.key);
                }
              }}
              className={`px-4 py-3 text-xs font-mono text-zinc-700 uppercase tracking-wider select-none text-left transition-colors ${
                isSortable
                  ? 'cursor-pointer hover:text-zinc-900 hover:bg-zinc-200/50 focus:outline-none focus:bg-zinc-200/60 focus:text-emerald-700'
                  : ''
              } ${column.headerClassName || ''}`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="truncate">{column.header}</span>
                {isSortable && (
                  <span className="shrink-0 flex items-center">
                    {isCurrentSort && sortState.direction === 'asc' ? (
                      <ChevronUp className="w-3.5 h-3.5 text-emerald-600" />
                    ) : isCurrentSort && sortState.direction === 'desc' ? (
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 transition-colors opacity-70" />
                    )}
                  </span>
                )}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
