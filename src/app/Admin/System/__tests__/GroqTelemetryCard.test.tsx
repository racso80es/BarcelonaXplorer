/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GroqTelemetryCard,
  GroqTelemetryCardSkeleton,
} from '@/app/Admin/System/GroqTelemetryCard';
import type { IaGatewayClient } from '@/features/ai-engine/server';

describe('GroqTelemetryCard UI (CA-2, CA-3, CA-7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env['GROQ_API_KEY'];
    delete process.env['GROQ_FAST_MODEL'];
  });

  it('CA-3 y CA-7: con GROQ_API_KEY ausente en el proceso y gateway sano, la tarjeta pinta operativo y el modelo del gateway', async () => {
    expect(process.env['GROQ_API_KEY']).toBeUndefined();

    const mockClient = {
      evaluateProviderHealth: vi.fn().mockResolvedValue({
        isHealthy: true,
        isReachable: true,
        latencyMs: 42,
        statusCode: 200,
        hasCredential: true,
        configuredModel: 'llama-3.3-70b-versatile',
        circuitState: 'CLOSED',
        operationalStatus: 'HEALTHY',
        averageLatencyMs: 42,
      }),
    } as unknown as IaGatewayClient;

    const card = await GroqTelemetryCard({ client: mockClient });
    render(card);

    expect(screen.getByText('Motor Rápido (llama-3.3-70b-versatile)')).toBeDefined();
    expect(screen.getByText('Operativo - Latencia: 42ms')).toBeDefined();
  });

  it('CA-3 y CA-7: con credencial ausente en el sobre del gateway, pinta el mensaje exacto del CA-3', async () => {
    const mockClient = {
      evaluateProviderHealth: vi.fn().mockResolvedValue({
        isHealthy: false,
        isReachable: true,
        latencyMs: 15,
        statusCode: 200,
        hasCredential: false,
        configuredModel: 'llama-3.3-70b-versatile',
        circuitState: 'CLOSED',
        operationalStatus: 'DEGRADED',
      }),
    } as unknown as IaGatewayClient;

    const card = await GroqTelemetryCard({ client: mockClient });
    render(card);

    expect(screen.getByText('Motor Rápido (llama-3.3-70b-versatile)')).toBeDefined();
    expect(screen.getByText('GROQ_API_KEY no configurada en el gateway')).toBeDefined();
  });

  it('CA-3: con circuito abierto, pinta el estado de circuito sin cuerpo crudo', async () => {
    const mockClient = {
      evaluateProviderHealth: vi.fn().mockResolvedValue({
        isHealthy: false,
        isReachable: true,
        latencyMs: 120,
        statusCode: 200,
        hasCredential: true,
        configuredModel: 'llama-3.3-70b-versatile',
        circuitState: 'OPEN',
        operationalStatus: 'UNHEALTHY',
      }),
    } as unknown as IaGatewayClient;

    const card = await GroqTelemetryCard({ client: mockClient });
    render(card);

    expect(screen.getByText('Circuito abierto (120ms)')).toBeDefined();
  });

  it('CA-3: con proveedor degradado, pinta proveedor degradado con latencia', async () => {
    const mockClient = {
      evaluateProviderHealth: vi.fn().mockResolvedValue({
        isHealthy: false,
        isReachable: true,
        latencyMs: 350,
        statusCode: 200,
        hasCredential: true,
        configuredModel: 'llama-3.3-70b-versatile',
        circuitState: 'CLOSED',
        operationalStatus: 'DEGRADED',
      }),
    } as unknown as IaGatewayClient;

    const card = await GroqTelemetryCard({ client: mockClient });
    render(card);

    expect(screen.getByText('Proveedor degradado (350ms)')).toBeDefined();
  });

  it('CA-3: ante fallo de alcance al gateway, informa fallo de alcance y no clave ausente', async () => {
    const mockClient = {
      evaluateProviderHealth: vi.fn().mockResolvedValue({
        isHealthy: false,
        isReachable: false,
        latencyMs: 3000,
        error: 'Timeout al conectar con IA Gateway (3000ms)',
      }),
    } as unknown as IaGatewayClient;

    const card = await GroqTelemetryCard({ client: mockClient });
    render(card);

    expect(screen.getByText('Motor Rápido (desconocido)')).toBeDefined();
    expect(screen.getByText('Fallo de alcance al IA Gateway')).toBeDefined();
    expect(screen.queryByText(/GROQ_API_KEY no configurada/i)).toBeNull();
  });

  it('debe renderizar GroqTelemetryCardSkeleton con animación pulsante', () => {
    const { container } = render(<GroqTelemetryCardSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeDefined();
    expect(screen.getByText(/Sondeando motor Groq vía Gateway/i)).toBeDefined();
  });
});
