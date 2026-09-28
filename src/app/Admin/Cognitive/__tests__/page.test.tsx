// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminCognitivePage, { dynamic } from '@/app/Admin/Cognitive/page';

// Mock subcomponentes pesados para probar el ensamblaje de la página
vi.mock('@/app/Admin/Cognitive/CognitiveKpiCards', () => ({
  CognitiveKpiCards: () => <div data-testid="kpi-cards">MOCK_KPI_CARDS</div>,
  CognitiveKpiCardsSkeleton: () => <div data-testid="kpi-skeleton">MOCK_KPI_SKELETON</div>,
}));

vi.mock('@/app/Admin/Cognitive/CognitiveSessionsCard', () => ({
  CognitiveSessionsCard: () => <div data-testid="sessions-card">MOCK_SESSIONS_CARD</div>,
  CognitiveSessionsCardSkeleton: () => <div data-testid="sessions-skeleton">MOCK_SESSIONS_SKELETON</div>,
}));

describe('AdminCognitivePage (/Admin/Cognitive)', () => {
  it('debe declarar dynamic = force-dynamic para el SSR', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('debe renderizar el encabezado táctico con badge RAG', () => {
    render(<AdminCognitivePage />);

    expect(screen.getByText('Observabilidad Cognitiva')).toBeDefined();
    expect(
      screen.getByText(
        'Monitoreo sensorial de memoria vectorial LanceDB, métricas Zeigarnik y telemetría de sesiones',
      ),
    ).toBeDefined();
    expect(screen.getByText('RAG In-Process Activo')).toBeDefined();
  });

  it('debe estructurar los dos bloques tácticos en el DOM', () => {
    render(<AdminCognitivePage />);

    expect(screen.getByTestId('kpi-cards')).toBeDefined();
    expect(screen.getByTestId('sessions-card')).toBeDefined();
  });
});
