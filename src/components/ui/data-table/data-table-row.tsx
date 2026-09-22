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
      className={`border-b border-layout-divider transition-colors hover:bg-zinc-50 ${
        onRowClick ? 'cursor-pointer hover:bg-zinc-100/70' : ''
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
