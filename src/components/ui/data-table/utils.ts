import { useState, useEffect } from 'react';
import { ColumnDef, ComparableValue } from './types';

/**
 * Hook de amortiguación térmica para valores de entrada rápida (Debounce)
 */
export function useDebounce<T>(value: T, delayMs: number = 200): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Normaliza cadenas de texto para comparaciones y búsquedas insensibles a mayúsculas y acentos
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Extrae el valor comparable de una celda de manera segura y tipada
 */
export function extractCellValue<T>(item: T, column: ColumnDef<T>): ComparableValue {
  if (column.accessorFn) {
    return column.accessorFn(item);
  }
  const key = column.key as string;
  const record = item as Record<string, unknown>;
  const val = record[key];

  if (
    typeof val === 'string' ||
    typeof val === 'number' ||
    typeof val === 'boolean' ||
    val instanceof Date ||
    val === null ||
    val === undefined
  ) {
    return val;
  }

  return String(val);
}

/**
 * Compara dos valores de tipo ComparableValue respetando el sentido de ordenación
 * Los valores nulos o indefinidos se desplazan siempre al final
 */
export function compareValues(
  a: ComparableValue,
  b: ComparableValue,
  direction: 'asc' | 'desc'
): number {
  const factor = direction === 'asc' ? 1 : -1;

  // Manejo de nulos / indefinidos
  if (a === null || a === undefined) {
    if (b === null || b === undefined) return 0;
    return 1; // 'a' al final
  }
  if (b === null || b === undefined) {
    return -1; // 'b' al final
  }

  // Marcas de tiempo (Date)
  if (a instanceof Date && b instanceof Date) {
    return (a.getTime() - b.getTime()) * factor;
  }
  if (a instanceof Date) {
    const bTime = typeof b === 'string' || typeof b === 'number' ? new Date(b).getTime() : 0;
    return (a.getTime() - bTime) * factor;
  }
  if (b instanceof Date) {
    const aTime = typeof a === 'string' || typeof a === 'number' ? new Date(a).getTime() : 0;
    return (aTime - b.getTime()) * factor;
  }

  // Números
  if (typeof a === 'number' && typeof b === 'number') {
    return (a - b) * factor;
  }

  // Booleanos
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return (a === b ? 0 : a ? 1 : -1) * factor;
  }

  // Cadenas de texto
  const aStr = String(a);
  const bStr = String(b);
  return aStr.localeCompare(bStr, undefined, { sensitivity: 'base', numeric: true }) * factor;
}
