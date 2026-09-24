/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AdminSidebarRight } from '../AdminSidebarRight';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('AdminSidebarRight - HUD Táctico de Navegación', () => {
  it('debe marcar Dashboard como activo cuando la ruta es exactamente /Admin', () => {
    mockUsePathname.mockReturnValue('/Admin');

    render(<AdminSidebarRight />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const sensorsLink = screen.getByText('Sensores').closest('a');
    const logsLink = screen.getByText('Bitácora').closest('a');

    expect(dashboardLink).not.toBeNull();
    expect(sensorsLink).not.toBeNull();
    expect(logsLink).not.toBeNull();

    expect(dashboardLink?.className).toContain('bg-emerald-50');
    expect(sensorsLink?.className).not.toContain('bg-emerald-50');
    expect(logsLink?.className).not.toContain('bg-emerald-50');
  });

  it('debe marcar Sensores como activo cuando la ruta es /Admin/System', () => {
    mockUsePathname.mockReturnValue('/Admin/System');

    render(<AdminSidebarRight />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const sensorsLink = screen.getByText('Sensores').closest('a');

    expect(dashboardLink?.className).not.toContain('bg-emerald-50');
    expect(sensorsLink?.className).toContain('bg-emerald-50');
  });

  it('debe marcar Bitácora como activo cuando la ruta es /Admin/Logs', () => {
    mockUsePathname.mockReturnValue('/Admin/Logs');

    render(<AdminSidebarRight />);

    const logsLink = screen.getByText('Bitácora').closest('a');
    expect(logsLink?.className).toContain('bg-emerald-50');
  });

  it('debe renderizar el enlace de retorno al ecosistema civil', () => {
    mockUsePathname.mockReturnValue('/Admin');

    render(<AdminSidebarRight />);

    const exitLink = screen.getByText('Retornar al Ecosistema').closest('a');
    expect(exitLink?.getAttribute('href')).toBe('/');
  });

  it('debe renderizar los metadatos de entorno por defecto (LOCAL / DEV)', () => {
    mockUsePathname.mockReturnValue('/Admin');

    render(<AdminSidebarRight />);

    expect(screen.getByText('LOCAL / DEV')).toBeDefined();
    expect(screen.getByText('Pruebas / Local')).toBeDefined();
  });

  it('debe renderizar metadatos de nodo y entorno personalizados', () => {
    mockUsePathname.mockReturnValue('/Admin');

    render(
      <AdminSidebarRight
        nodeName="NODO 11"
        environmentName="Producción"
        securityMode="Basic Auth (Edge)"
      />
    );

    expect(screen.getByText('NODO 11')).toBeDefined();
    expect(screen.getByText('Producción')).toBeDefined();
    expect(screen.getByText('Basic Auth (Edge)')).toBeDefined();
  });
});
