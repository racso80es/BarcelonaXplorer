/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  TelegramTelemetryCard,
  TelegramTelemetryCardSkeleton,
} from '@/app/Admin/System/TelegramTelemetryCard';
import { AuditTelegramBotHealthUseCasePort } from '@/features/telegram';
import { AuditTelegramBotHealthUseCase } from '@/features/telegram';

vi.mock('@/features/telegram', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/telegram')>();
  return {
    ...actual,
    AuditTelegramBotHealthUseCase: vi.fn(),
  };
});

describe('TelegramTelemetryCard UI (Principio DIP - Capa de Presentación)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el semáforo verde (OK) cuando el caso de uso devuelve estado ok', async () => {
    const mockUseCase: AuditTelegramBotHealthUseCasePort = {
      execute: vi.fn().mockResolvedValue({
        state: 'ok',
        msg: '@BXplorerBot',
        botUsername: '@BXplorerBot',
        webhookUrl: 'https://barcelonaxplorer.com/api/telegram/webhook',
        isWebhookAligned: true,
        pendingUpdates: 0,
        latencyMs: 140,
        isHealthy: true,
      }),
    };

    const card = await TelegramTelemetryCard({ useCase: mockUseCase });
    render(card);

    expect(screen.getByText('Telegram Bot')).toBeDefined();
    expect(screen.getByText('@BXplorerBot')).toBeDefined();
    expect(screen.getByText('Pendientes: 0')).toBeDefined();
  });

  it('debe renderizar el semáforo ámbar (WARN) ante webhook desalineado', async () => {
    const mockUseCase: AuditTelegramBotHealthUseCasePort = {
      execute: vi.fn().mockResolvedValue({
        state: 'warn',
        msg: 'Webhook Desalineado',
        botUsername: '@BXplorerBot',
        webhookUrl: 'https://local.ngrok.io',
        isWebhookAligned: false,
        pendingUpdates: 3,
        latencyMs: 180,
        isHealthy: false,
      }),
    };

    const card = await TelegramTelemetryCard({ useCase: mockUseCase });
    render(card);

    expect(screen.getByText('Webhook Desalineado')).toBeDefined();
    expect(screen.getByText('Pendientes: 3')).toBeDefined();
  });

  it('debe renderizar el semáforo rojo (ERROR) ante fallo o token revocado sin romper la UI', async () => {
    const mockUseCase: AuditTelegramBotHealthUseCasePort = {
      execute: vi.fn().mockResolvedValue({
        state: 'error',
        msg: 'Token Inválido / No Configurado',
        botUsername: undefined,
        webhookUrl: undefined,
        isWebhookAligned: false,
        pendingUpdates: 0,
        latencyMs: 50,
        isHealthy: false,
      }),
    };

    const card = await TelegramTelemetryCard({ useCase: mockUseCase });
    render(card);

    expect(screen.getByText('Token Inválido / No Configurado')).toBeDefined();
    expect(screen.getByText('Canal B2C Inactivo')).toBeDefined();
  });

  it('debe renderizar el semáforo sky/azul cuando el estado es disabled (entorno local o pruebas)', async () => {
    const mockUseCase: AuditTelegramBotHealthUseCasePort = {
      execute: vi.fn().mockResolvedValue({
        state: 'disabled',
        msg: 'Desactivado en Local / Pruebas',
        botUsername: undefined,
        webhookUrl: undefined,
        isWebhookAligned: false,
        pendingUpdates: 0,
        latencyMs: 0,
        isHealthy: true,
      }),
    };

    const card = await TelegramTelemetryCard({ useCase: mockUseCase });
    render(card);

    expect(screen.getByText('Desactivado en Local / Pruebas')).toBeDefined();
    expect(screen.getByText('Modo Simulado / Standby')).toBeDefined();
  });

  it('debe instanciar y ejecutar el caso de uso por defecto si no se inyecta prop', async () => {
    vi.mocked(AuditTelegramBotHealthUseCase).mockImplementation(function () {
      return {
        execute: vi.fn().mockResolvedValue({
          state: 'ok',
          msg: '@DefaultBot',
          botUsername: '@DefaultBot',
          isWebhookAligned: true,
          pendingUpdates: 0,
          latencyMs: 90,
          isHealthy: true,
        }),
      } as unknown as AuditTelegramBotHealthUseCase;
    });

    const card = await TelegramTelemetryCard();
    render(card);

    expect(AuditTelegramBotHealthUseCase).toHaveBeenCalled();
    expect(screen.getByText('@DefaultBot')).toBeDefined();
  });

  it('debe renderizar TelegramTelemetryCardSkeleton con clase de animación pulsante', () => {
    const { container } = render(<TelegramTelemetryCardSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeDefined();
  });
});
