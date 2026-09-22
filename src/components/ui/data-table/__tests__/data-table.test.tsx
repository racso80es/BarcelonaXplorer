/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DataTable, ColumnDef } from '@/components/ui/data-table';

interface TestItem {
  id: string;
  name: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  score: number;
  createdAt: Date;
}

const mockData: TestItem[] = [
  { id: '1', name: 'Alpha Service', level: 'INFO', score: 95, createdAt: new Date('2026-01-01T10:00:00Z') },
  { id: '2', name: 'Beta Gateway', level: 'ERROR', score: 40, createdAt: new Date('2026-01-02T12:00:00Z') },
  { id: '3', name: 'Gamma Worker', level: 'WARN', score: 70, createdAt: new Date('2026-01-03T15:00:00Z') },
  { id: '4', name: 'Delta DB', level: 'ERROR', score: 20, createdAt: new Date('2026-01-04T08:00:00Z') },
  { id: '5', name: 'Epsilon Node', level: 'DEBUG', score: 85, createdAt: new Date('2026-01-05T19:00:00Z') },
];

const mockColumns: ColumnDef<TestItem>[] = [
  {
    key: 'name',
    header: 'Servicio',
    sortable: true,
    filterable: true,
  },
  {
    key: 'level',
    header: 'Nivel',
    sortable: true,
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { label: 'DEBUG', value: 'DEBUG' },
      { label: 'INFO', value: 'INFO' },
      { label: 'WARN', value: 'WARN' },
      { label: 'ERROR', value: 'ERROR' },
    ],
    cell: (item) => <span data-testid={`badge-${item.id}`}>{item.level}</span>,
  },
  {
    key: 'score',
    header: 'Puntuación',
    sortable: true,
  },
  {
    key: 'actions',
    header: 'Acciones',
    cell: (item) => <button>Editar {item.id}</button>,
  },
];

describe('DataTable Generic Component (La Forja Visual)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Escenario 1: Renderizado Genérico y Celdas Personalizadas', () => {
    render(<DataTable<TestItem> data={mockData} columns={mockColumns} pageSize={10} />);

    expect(screen.getByText('Alpha Service')).toBeDefined();
    expect(screen.getByText('Beta Gateway')).toBeDefined();
    expect(screen.getByTestId('badge-1').textContent).toBe('INFO');
    expect(screen.getByTestId('badge-2').textContent).toBe('ERROR');
    expect(screen.getByText('Editar 1')).toBeDefined();
  });

  it('Escenario 2: Ciclo de Ordenación Tridimensional (asc -> desc -> null) y Atributos ARIA', () => {
    render(<DataTable<TestItem> data={mockData} columns={mockColumns} pageSize={10} />);

    const header = screen.getByLabelText(/Ordenar por Puntuación/i);
    expect(header.getAttribute('aria-sort')).toBe('none');

    // Click 1: asc (20, 40, 70, 85, 95) -> Delta primero
    fireEvent.click(header);
    expect(header.getAttribute('aria-sort')).toBe('ascending');
    const cellsAsc = screen.getAllByRole('row');
    expect(cellsAsc[1].textContent).toContain('Delta DB');

    // Click 2: desc (95, 85, 70, 40, 20) -> Alpha primero
    fireEvent.click(header);
    expect(header.getAttribute('aria-sort')).toBe('descending');
    const cellsDesc = screen.getAllByRole('row');
    expect(cellsDesc[1].textContent).toContain('Alpha Service');

    // Click 3: null (restaura orden natural) -> Alpha primero
    fireEvent.click(header);
    expect(header.getAttribute('aria-sort')).toBe('none');
    const cellsReset = screen.getAllByRole('row');
    expect(cellsReset[1].textContent).toContain('Alpha Service');
  });

  it('Escenario 2b: Activación de ordenación mediante teclado (Enter y Espacio)', () => {
    render(<DataTable<TestItem> data={mockData} columns={mockColumns} pageSize={10} />);

    const header = screen.getByLabelText(/Ordenar por Servicio/i);

    // Activar vía Enter
    fireEvent.keyDown(header, { key: 'Enter' });
    expect(header.getAttribute('aria-sort')).toBe('ascending');

    // Activar vía Espacio
    fireEvent.keyDown(header, { key: ' ' });
    expect(header.getAttribute('aria-sort')).toBe('descending');
  });

  it('Escenario 3: Filtrado Combinado con Debounce Térmico (Search + Select)', async () => {
    render(
      <DataTable<TestItem>
        data={mockData}
        columns={mockColumns}
        searchPlaceholder="Buscar servicio..."
        pageSize={10}
      />
    );

    const searchInput = screen.getByPlaceholderText('Buscar servicio...');
    const selectFilter = screen.getByLabelText(/Filtrar por Nivel/i);

    // Escribir en la búsqueda (con debounce)
    fireEvent.change(searchInput, { target: { value: 'Delta' } });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Solo debe aparecer Delta DB
    expect(screen.getByText('Delta DB')).toBeDefined();
    expect(screen.queryByText('Alpha Service')).toBeNull();

    // Seleccionar nivel ERROR (Delta DB es ERROR, sigue visible)
    fireEvent.change(selectFilter, { target: { value: 'ERROR' } });
    expect(screen.getByText('Delta DB')).toBeDefined();

    // Cambiar a nivel INFO (Delta DB no es INFO -> sin resultados)
    fireEvent.change(selectFilter, { target: { value: 'INFO' } });
    expect(screen.queryByText('Delta DB')).toBeNull();
    expect(screen.getByText(/Bóveda sin coincidencias/i)).toBeDefined();
  });

  it('Escenario 4: Estado Vacío Resiliente (Empty State) y botón Limpiar Filtros', () => {
    render(<DataTable<TestItem> data={mockData} columns={mockColumns} pageSize={10} />);

    const searchInput = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(searchInput, { target: { value: 'Inexistente_XYZ' } });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.getByText(/Bóveda sin coincidencias/i)).toBeDefined();

    // Botón de limpiar filtros
    const clearBtn = screen.getAllByRole('button', { name: /Limpiar filtros/i })[0];
    fireEvent.click(clearBtn);

    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Restaura los datos
    expect(screen.getByText('Alpha Service')).toBeDefined();
    expect(screen.getByText('Beta Gateway')).toBeDefined();
  });

  it('Escenario 5: Skeleton Loader Táctico cuando isLoading={true}', () => {
    const { container } = render(
      <DataTable<TestItem> data={mockData} columns={mockColumns} isLoading={true} pageSize={10} />
    );

    expect(container.querySelector('.animate-pulse')).toBeDefined();
    expect(screen.queryByText('Alpha Service')).toBeNull();
  });

  it('Escenario 6: Blindaje contra any y resolución de claves virtuales sintéticas', () => {
    // mockColumns incluye key: 'actions' que no está en TestItem y no tiene accessorFn
    render(<DataTable<TestItem> data={mockData} columns={mockColumns} pageSize={10} />);

    const actionsHeader = screen.getByText('Acciones').closest('th');
    // No debe ser ordenable ni tener cursor pointer
    expect(actionsHeader?.getAttribute('tabindex')).toBeNull();
    expect(actionsHeader?.getAttribute('aria-sort')).toBeNull();
  });

  it('Escenario 7: Gobernanza de Volumetría del DOM y Paginación Táctica', () => {
    render(<DataTable<TestItem> data={mockData} columns={mockColumns} pageSize={2} />);

    // Solo 2 filas montadas en página 1
    expect(screen.getByText('Alpha Service')).toBeDefined();
    expect(screen.getByText('Beta Gateway')).toBeDefined();
    expect(screen.queryByText('Gamma Worker')).toBeNull();

    // Avanzar a página 2
    const nextBtn = screen.getByLabelText('Página siguiente');
    fireEvent.click(nextBtn);

    expect(screen.queryByText('Alpha Service')).toBeNull();
    expect(screen.getByText('Gamma Worker')).toBeDefined();
    expect(screen.getByText('Delta DB')).toBeDefined();

    // Cambiar tamaño de página a 10
    const pageSizeSelect = screen.getByLabelText('Seleccionar filas por página');
    fireEvent.change(pageSizeSelect, { target: { value: '10' } });

    // Ahora todos están montados
    expect(screen.getByText('Alpha Service')).toBeDefined();
    expect(screen.getByText('Epsilon Node')).toBeDefined();
  });

  it('Escenario 7b: Reset a Página 1 al aplicar filtros o búsqueda', () => {
    render(<DataTable<TestItem> data={mockData} columns={mockColumns} pageSize={2} />);

    // Ir a página 2
    fireEvent.click(screen.getByLabelText('Página siguiente'));
    expect(screen.getByText('Gamma Worker')).toBeDefined();

    // Escribir búsqueda
    const searchInput = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });

    act(() => {
      vi.advanceTimersByTime(250);
    });

    // Vuelve automáticamente a página 1 y muestra Alpha
    expect(screen.getByText('Alpha Service')).toBeDefined();
  });
});
