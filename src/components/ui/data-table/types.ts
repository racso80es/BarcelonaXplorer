import React from 'react';

/** Tipos primitivos y estructurados evaluables por el motor de ordenación y filtrado */
export type ComparableValue = string | number | boolean | Date | null | undefined;

/** Dirección de ordenación soportada */
export type SortDirection = 'asc' | 'desc' | null;

/** Estado del motor de ordenación */
export interface SortState<T> {
  column: keyof T | string | null;
  direction: SortDirection;
}

/** Opción individual para filtros de selección facetada */
export interface FilterOption {
  label: string;
  value: string | number;
}

/** Definición formal de columna tabular */
export interface ColumnDef<T> {
  /** Clave de acceso a la propiedad en T o identificador sintético virtual (ej. 'actions') */
  key: keyof T | string;
  /** Encabezado visible en la tabla */
  header: string | React.ReactNode;
  /** Habilita la ordenación tridimensional por esta columna */
  sortable?: boolean;
  /** Habilita el filtrado por esta columna */
  filterable?: boolean;
  /** Tipo de entrada para el filtro de la columna */
  filterType?: 'text' | 'select';
  /** Opciones predefinidas requeridas cuando filterType === 'select' */
  filterOptions?: FilterOption[];
  /** Renderizador de celda personalizado (badges, botones, fechas, etc.) */
  cell?: (item: T, index: number) => React.ReactNode;
  /** Clases CSS Tailwind adicionales para la celda <td> */
  className?: string;
  /** Clases CSS Tailwind adicionales para el encabezado <th> */
  headerClassName?: string;
  /** Extractor seguro de valor plano para ordenación o búsqueda (Tolerancia Cero a any) */
  accessorFn?: (item: T) => ComparableValue;
}

/** Propiedades del componente raíz DataTable */
export interface DataTableProps<T> {
  /** Matriz de datos tipados */
  data: T[];
  /** Definición de columnas fuertemente tipada */
  columns: ColumnDef<T>[];
  /** Placeholder para el buscador global rápido */
  searchPlaceholder?: string;
  /** Claves de T sobre las cuales actúa el buscador global */
  searchableKeys?: (keyof T | string)[];
  /** Estado de carga asíncrono */
  isLoading?: boolean;
  /** Mensaje informativo cuando la lista resultante es vacía */
  emptyMessage?: string;
  /** Clases CSS para el contenedor exterior de la tabla */
  className?: string;
  /** Manejador opcional para click en fila */
  onRowClick?: (item: T) => void;
  /** Configuración inicial de ordenación */
  initialSort?: {
    column: keyof T | string;
    direction: 'asc' | 'desc';
  };
  /** Número de filas por página para blindaje del DOM (por defecto 25; 0 o null para desactivar) */
  pageSize?: number;
  /** Opciones configurables en el selector de densidad de página (ej. [10, 25, 50, 100]) */
  pageSizeOptions?: number[];
}
