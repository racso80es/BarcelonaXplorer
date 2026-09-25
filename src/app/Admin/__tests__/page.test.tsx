/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminDashboardPage from '../page';
import { prisma } from '@/shared/persistence/prisma';

vi.mock('@/shared/persistence/prisma', () => ({
  prisma: {
    userAnchor: {
      count: vi.fn(),
    },
    telemetryLog: {
      count: vi.fn(),
    },
  },
}));

describe('AdminDashboardPage - Sala de Control Táctica', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar métricas tácticas correctamente cuando Prisma responde con éxito', async () => {
    vi.mocked(prisma.userAnchor.count).mockResolvedValueOnce(42); // totalUsers
    vi.mocked(prisma.userAnchor.count).mockResolvedValueOnce(5); // recentUsers
    vi.mocked(prisma.telemetryLog.count).mockResolvedValueOnce(1); // frictionAlerts
    vi.mocked(prisma.telemetryLog.count).mockResolvedValueOnce(100); // totalTelemetry24h
    vi.mocked(prisma.telemetryLog.count).mockResolvedValueOnce(0); // errorLogsCount

    const pageElement = await AdminDashboardPage();
    render(pageElement);

    expect(screen.getByText('Sala de Control: Dashboard Táctico')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('0')).toBeDefined();
  });

  it('debe ser resiliente (safeCount) cuando userAnchor.count arroja P2021 (tabla inexistente)', async () => {
    const p2021Error = new Error('The table `user_anchors` does not exist in the current database.');
    vi.mocked(prisma.userAnchor.count).mockRejectedValue(p2021Error);
    vi.mocked(prisma.telemetryLog.count).mockResolvedValue(0);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const pageElement = await AdminDashboardPage();
    render(pageElement);

    expect(screen.getByText('Sala de Control: Dashboard Táctico')).toBeDefined();
    // Debe renderizar 0 para usuarios en vez de explotar al error boundary
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[AdminDashboardPage] Resiliencia activa: No se pudo obtener métrica 'totalUsers'"),
      expect.stringContaining('user_anchors')
    );

    warnSpy.mockRestore();
  });
});
