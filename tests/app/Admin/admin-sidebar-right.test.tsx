// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdminSidebarRight } from '@/app/Admin/_components/AdminSidebarRight';

// Mock de usePathname
vi.mock('next/navigation', () => ({
  usePathname: () => '/Admin/Cognitive',
}));

describe('AdminSidebarRight (Navegación Táctica)', () => {
  it('debe incluir el enlace a Cognición RAG apuntando a /Admin/Cognitive', () => {
    render(<AdminSidebarRight nodeName="NODO 11" currentPath="/Admin/Cognitive" />);

    const cognitiveLink = screen.getByRole('link', { name: /Cognición RAG/i });
    expect(cognitiveLink).toBeDefined();
    expect(cognitiveLink.getAttribute('href')).toBe('/Admin/Cognitive');
  });

  it('debe marcar el enlace /Admin/Cognitive como activo cuando pathname coincide', () => {
    render(<AdminSidebarRight nodeName="NODO 11" currentPath="/Admin/Cognitive" />);

    const cognitiveLink = screen.getByRole('link', { name: /Cognición RAG/i });
    expect(cognitiveLink.className).toContain('emerald');
  });

  it('debe renderizar el encabezado y el badge del nodo táctico', () => {
    render(<AdminSidebarRight nodeName="NODO 11 (PROD)" currentPath="/Admin" />);

    expect(screen.getByText('SALA DE CONTROL')).toBeDefined();
    expect(screen.getByText('NODO 11 (PROD)')).toBeDefined();
  });
});
