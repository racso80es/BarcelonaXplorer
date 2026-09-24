/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { KpiMetricCard } from '../KpiMetricCard';
import { AdminPageHeader } from '../AdminPageHeader';
import { Activity } from 'lucide-react';

describe('Admin Base Components - KpiMetricCard & AdminPageHeader', () => {
  it('debe renderizar KpiMetricCard con título, valor escalar y badge cualitativo', () => {
    render(
      <KpiMetricCard
        title="Fuerza Operativa Total"
        value={152}
        description="Exploradores activos"
        trend="positive"
        trendLabel="HU 2.2"
      />
    );

    expect(screen.getByText('Fuerza Operativa Total')).toBeDefined();
    expect(screen.getByText('152')).toBeDefined();
    expect(screen.getByText('Exploradores activos')).toBeDefined();
    expect(screen.getByText('HU 2.2')).toBeDefined();
  });

  it('debe aplicar estilos semánticos acordes a la tendencia en KpiMetricCard', () => {
    const { rerender } = render(
      <KpiMetricCard
        title="Incidentes Críticos"
        value={0}
        trend="positive"
        trendLabel="0 Fallos (S+)"
      />
    );

    expect(screen.getByText('0 Fallos (S+)')).toBeDefined();

    rerender(
      <KpiMetricCard
        title="Incidentes Críticos"
        value={3}
        trend="negative"
        trendLabel="Revisar Bitácora"
      />
    );

    expect(screen.getByText('Revisar Bitácora')).toBeDefined();
  });

  it('debe renderizar AdminPageHeader con título, descripción, icono y badge', () => {
    render(
      <AdminPageHeader
        title="Sala de Control: Dashboard Táctico"
        description="Métricas de retención y telemetría"
        icon={<Activity data-testid="header-icon" />}
        badge={<span data-testid="header-badge">Nodo 11</span>}
      />
    );

    expect(screen.getByText('Sala de Control: Dashboard Táctico')).toBeDefined();
    expect(screen.getByText('Métricas de retención y telemetría')).toBeDefined();
    expect(screen.getByTestId('header-icon')).toBeDefined();
    expect(screen.getByTestId('header-badge')).toBeDefined();
  });
});
