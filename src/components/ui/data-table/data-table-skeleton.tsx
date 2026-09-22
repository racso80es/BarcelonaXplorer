'use client';

import React from 'react';

interface DataTableSkeletonProps {
  columnsCount: number;
  rowsCount?: number;
}

export function DataTableSkeleton({
  columnsCount,
  rowsCount = 5,
}: DataTableSkeletonProps) {
  const rows = Array.from({ length: rowsCount });
  const cols = Array.from({ length: columnsCount });

  return (
    <tbody className="divide-y divide-zinc-800/60 animate-pulse">
      {rows.map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-zinc-800/40">
          {cols.map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3.5">
              <div
                className="h-3.5 bg-zinc-800/80 rounded"
                style={{
                  width: `${Math.max(35, Math.min(90, (rowIndex * 37 + colIndex * 53) % 100))}%`,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
