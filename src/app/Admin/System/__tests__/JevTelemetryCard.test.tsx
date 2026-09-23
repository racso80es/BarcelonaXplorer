/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  JevTelemetryCard,
  JevTelemetryCardSkeleton,
} from '@/app/Admin/System/JevTelemetryCard';
import { AuditJevHealthUseCasePort } from '@/application/ports/in/audit-jev-health.use-case.port';
import { AuditJevHealthUseCase } from '@/application/use-cases/audit-jev-health.use-case';

vi.mock('@/application/use-cases/audit-jev-health.use-case', () => {
  return {
    AuditJevHealthUseCase: vi.fn(),
  };
});

describe('JevTelemetryCard UI (Principio DIP - Capa de Presentación)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el semáforo verde (OK) cuando el caso de uso devuelve estado ok', async () => {
    const mockUseCase: AuditJevHealthUseCasePort = {
      execute: vi.fn().mockResolvedValue({
        state: 'ok',
        msg: 'Operativo (120ms)',
        latencyMs: 120,
        model: 'jev-latest',
        isHealthy: true,
      }),
    };

    const card = await JevTelemetryCard({ useCase: mockUseCase });
    render(card);

    expect(screen.getByText('Motor Decisión (Jev AI)')).toBeDefined();
    expect(screen.getByText('Operativo (120ms)')).toBeDefined();
    expect(screen.getByText('Modelo: jev-latest')).toBeDefined();
  });

  it('debe renderizar el semáforo ámbar (WARN) ante latencia degradada', async () => {
    const mockUseCase: AuditJevHealthUseCasePort = {
      execute: vi.fn().mockResolvedValue({
        state: 'warn',
        msg: 'Latencia Alta (950ms)',
        latencyMs: 950,
        model: 'jev-latest',
        isHealthy: true,
      }),
    };

    const card = await JevTelemetryCard({ useCase: mockUseCase });
    render(card);

    expect(screen.getByText('Latencia Alta (950ms)')).toBeDefined();
  });

  it('debe renderizar el semáforo rojo (ERROR) ante fallo del motor sin romper la UI', async () => {
    const mockUseCase: AuditJevHealthUseCasePort = {
      execute: vi.fn().mockResolvedValue({
        state: 'error',
        msg: 'ECONNREFUSED',
        latencyMs: 2000,
        model: 'jev-latest',
        isHealthy: false,
      }),
    };

    const card = await JevTelemetryCard({ useCase: mockUseCase });
    render(card);

    expect(screen.getByText('ECONNREFUSED')).toBeDefined();
  });

  it('debe instanciar y ejecutar el caso de uso por defecto si no se inyecta prop', async () => {
    vi.mocked(AuditJevHealthUseCase).mockImplementation(function () {
      return {
        execute: vi.fn().mockResolvedValue({
          state: 'ok',
          msg: 'Operativo (80ms)',
          latencyMs: 80,
          model: 'jev-latest',
          isHealthy: true,
        }),
      } as unknown as AuditJevHealthUseCase;
    });

    const card = await JevTelemetryCard();
    render(card);

    expect(AuditJevHealthUseCase).toHaveBeenCalled();
    expect(screen.getByText('Operativo (80ms)')).toBeDefined();
  });

  it('debe renderizar JevTelemetryCardSkeleton con clase de animación pulsante', () => {
    const { container } = render(<JevTelemetryCardSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeDefined();
  });
});
