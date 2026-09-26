/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  HybridTelemetryCard,
  HybridTelemetryCardSkeleton,
} from '@/app/Admin/System/HybridTelemetryCard';
import { prisma } from '@/shared/persistence/prisma';

vi.mock('@/shared/persistence/prisma', () => ({
  prisma: {
    telemetryLog: {
      findMany: vi.fn(),
    },
  },
}));

describe('HybridTelemetryCard UI (PBI-OPS-TELEM-002)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el estado del orquestador híbrido con métricas sensoriales de MySQL', async () => {
    vi.mocked(prisma.telemetryLog.findMany).mockResolvedValue([
      {
        id: 'log-1',
        createdAt: new Date(),
        level: 'INFO',
        context: 'SECURITY_PERIMETER',
        message: 'Diálogo casual',
        payload: {
          eventType: 'TRIAGE_ROUTED',
          intent: 'dialogue',
          tokensSaved: 850,
        },
        statusCode: 200,
        durationMs: 30,
        environment: 'production',
      },
    ] as unknown as Awaited<ReturnType<typeof prisma.telemetryLog.findMany>>);

    const card = await HybridTelemetryCard();
    render(card);

    expect(screen.getByText('Orquestador Híbrido')).toBeDefined();
    expect(screen.getByText(/30ms \| 850 tokens ahorrados/i)).toBeDefined();
    expect(screen.getByText('Jev Triaje + Groq SLM vs Gemini')).toBeDefined();
  });

  it('debe renderizar fallback seguro si la base de datos no tiene eventos aún', async () => {
    vi.mocked(prisma.telemetryLog.findMany).mockResolvedValue([]);

    const card = await HybridTelemetryCard();
    render(card);

    expect(screen.getByText('Orquestador Híbrido')).toBeDefined();
    expect(screen.getByText(/tokens ahorrados/i)).toBeDefined();
  });

  it('debe renderizar HybridTelemetryCardSkeleton con animación pulsante', () => {
    const { container } = render(<HybridTelemetryCardSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeDefined();
    expect(screen.getByText(/Auditando eventos sensoriales/i)).toBeDefined();
  });
});
