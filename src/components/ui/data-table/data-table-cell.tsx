'use client';

import React from 'react';
import { ColumnDef } from './types';
import { extractCellValue } from './utils';

interface DataTableCellProps<T> {
  item: T;
  column: ColumnDef<T>;
  rowIndex: number;
}

export function DataTableCell<T>({ item, column, rowIndex }: DataTableCellProps<T>) {
  if (column.cell) {
    return (
      <td className={`px-4 py-3 text-xs font-mono text-zinc-300 align-middle ${column.className || ''}`}>
        {column.cell(item, rowIndex)}
      </td>
    );
  }

  const rawValue = extractCellValue(item, column);

  let renderedContent: React.ReactNode;
  if (rawValue === null || rawValue === undefined) {
    renderedContent = <span className="text-zinc-600">—</span>;
  } else if (rawValue instanceof Date) {
    renderedContent = rawValue.toLocaleString('es-ES', { hour12: false });
  } else if (typeof rawValue === 'boolean') {
    renderedContent = rawValue ? 'true' : 'false';
  } else {
    renderedContent = String(rawValue);
  }

  return (
    <td className={`px-4 py-3 text-xs font-mono text-zinc-300 align-middle ${column.className || ''}`}>
      {renderedContent}
    </td>
  );
}
