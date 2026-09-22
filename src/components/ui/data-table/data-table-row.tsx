'use client';

import React from 'react';
import { ColumnDef } from './types';
import { DataTableCell } from './data-table-cell';

interface DataTableRowProps<T> {
  item: T;
  columns: ColumnDef<T>[];
  rowIndex: number;
  onRowClick?: (item: T) => void;
}

export function DataTableRow<T>({
  item,
  columns,
  rowIndex,
  onRowClick,
}: DataTableRowProps<T>) {
  return (
    <tr
      onClick={() => onRowClick?.(item)}
      className={`border-b border-zinc-800/60 transition-colors hover:bg-zinc-800/30 ${
        onRowClick ? 'cursor-pointer hover:bg-zinc-800/50' : ''
      }`}
    >
      {columns.map((column, colIndex) => (
        <DataTableCell
          key={(column.key as string) || colIndex}
          item={item}
          column={column}
          rowIndex={rowIndex}
        />
      ))}
    </tr>
  );
}
