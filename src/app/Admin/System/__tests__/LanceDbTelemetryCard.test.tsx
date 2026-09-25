/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  LanceDbTelemetryCard,
  LanceDbTelemetryCardSkeleton,
} from '@/app/Admin/System/LanceDbTelemetryCard';
import { AuditLanceDbHealthUseCasePort } from '@/application/ports/in/audit-lancedb-health.use-case.port';

describe('LanceDbTelemetryCard UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar estado ok con semáforo verde y conteo de tablas', async () => {
    const mockUseCase: AuditLanceDbHealthUseCasePort = {
      execute: vi.fn().mockResolvedValue({
        state: 'ok',
        msg: 'Almacén Vectorial Saludable',
        path: '/app/vector_storage',
        latencyMs: 8,
        tableCount: 3,
        isHealthy: true,
      }),
    };

    const card = await LanceDbTelemetryCard({ useCase: mockUseCase });
    render(card);

    expect(screen.getByText('Persistencia Vectorial')).toBeDefined();
    expect(screen.getByText('Almacén Vectorial Saludable')).toBeDefined();
    expect(screen.getByText('Tablas: 3 | 8ms')).toBeDefined();
  });

  it('debe renderizar estado warn con semáforo ámbar ante latencia alta', async () => {
    const mockUseCase: AuditLanceDbHealthUseCasePort = {
      execute: vi.fn().mockResolvedValue({
        state: 'warn',
        msg: 'Latencia Alta (95ms)',
        path: '/app/vector_storage',
        latencyMs: 95,
        tableCount: 1,
        isHealthy: true,
      }),
    };

    const card = await LanceDbTelemetryCard({ useCase: mockUseCase });
    render(card);

    expect(screen.getByText('Latencia Alta (95ms)')).toBeDefined();
    expect(screen.getByText('Tablas: 1 | 95ms')).toBeDefined();
  });

  it('debe renderizar estado error con semáforo rojo ante fallo de permisos', async () => {
    const mockUseCase: AuditLanceDbHealthUseCasePort = {
      execute: vi.fn().mockResolvedValue({
        state: 'error',
        msg: 'Fallo: EACCES: permission denied',
        path: '/app/vector_storage',
        latencyMs: 2,
        tableCount: 0,
        isHealthy: false,
      }),
    };

    const card = await LanceDbTelemetryCard({ useCase: mockUseCase });
    render(card);

    expect(screen.getByText('Fallo: EACCES: permission denied')).toBeDefined();
    expect(screen.getByText('/app/vector_storage')).toBeDefined();
  });

  it('debe renderizar el Skeleton de carga', () => {
    const { container } = render(<LanceDbTelemetryCardSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeDefined();
  });
});
