/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TelemetryTableClient, TelemetryLogItem } from '@/app/Admin/System/TelemetryTableClient';

describe('TelemetryTableClient - Modal Forense y Detalle de Logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  const mockLogs: TelemetryLogItem[] = [
    {
      id: 'log-security-001',
      createdAt: '2026-09-24T17:00:00.000Z',
      level: 'ERROR',
      context: 'SECURITY_PERIMETER',
      message: '[Telegram Bot] Sonda táctica degradada: Token Inválido / No Configurado',
      statusCode: 401,
      durationMs: 3501,
      payload: {
        error: 'Token no configurado, revocado o timeout de red al consultar getMe.',
        stack: 'Error: getMe failed\n    at TelegramBotApiGateway.getMe (/src/gateway.ts:45:10)',
        reason: 'Timeout de red al conectar con api.telegram.org (>3500ms)',
        expectedWebhookUrl: 'https://barcelonaxplorer.com/api/telegram/webhook',
        actualWebhookUrl: 'https://barcelonaxplorer.com/api/telegram/webhook',
      },
    },
    {
      id: 'log-simple-002',
      createdAt: '2026-09-24T16:00:00.000Z',
      level: 'INFO',
      context: 'SYSTEM',
      message: 'Sistema inicializado correctamente',
      statusCode: 200,
      durationMs: 12,
      payload: null,
    },
  ];

  it('debe abrir el modal al hacer clic en "Ver" y exponer ID con botón de copia', () => {
    render(<TelemetryTableClient logs={mockLogs} />);

    const verButtons = screen.getAllByText('Ver');
    fireEvent.click(verButtons[0]);

    expect(screen.getByText('log-security-001')).toBeDefined();
    expect(screen.getByTitle('Copiar ID')).toBeDefined();

    const copyBtn = screen.getByTitle('Copiar ID');
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('log-security-001');
  });

  it('debe mostrar la fecha y hora completa en el modal', () => {
    render(<TelemetryTableClient logs={mockLogs} />);

    const verButtons = screen.getAllByText('Ver');
    fireEvent.click(verButtons[0]);

    // La fecha debe contener año 2026 y hora
    const modal = screen.getByRole('dialog');
    expect(modal.textContent).toContain('2026');
  });

  it('debe renderizar el bloque de Stack Trace cuando existe en el payload con opción de copia', () => {
    render(<TelemetryTableClient logs={mockLogs} />);

    const verButtons = screen.getAllByText('Ver');
    fireEvent.click(verButtons[0]);

    expect(screen.getByText('Traza Técnica (Stack Trace)')).toBeDefined();
    expect(screen.getAllByText(/TelegramBotApiGateway\.getMe/).length).toBeGreaterThanOrEqual(1);

    const copyTraceBtn = screen.getByText('Copiar Traza');
    fireEvent.click(copyTraceBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('TelegramBotApiGateway.getMe')
    );
  });

  it('debe desglosar los detalles técnicos estructurados (Error, Motivo, URLs) en la sección de datos devueltos', () => {
    render(<TelemetryTableClient logs={mockLogs} />);

    const verButtons = screen.getAllByText('Ver');
    fireEvent.click(verButtons[0]);

    expect(screen.getByText('Error Técnico')).toBeDefined();
    expect(
      screen.getByText('Token no configurado, revocado o timeout de red al consultar getMe.')
    ).toBeDefined();

    expect(screen.getByText('Causa Raíz / Motivo')).toBeDefined();
    expect(
      screen.getByText('Timeout de red al conectar con api.telegram.org (>3500ms)')
    ).toBeDefined();

    expect(screen.getByText('URL Webhook Esperada')).toBeDefined();
    expect(
      screen.getAllByText('https://barcelonaxplorer.com/api/telegram/webhook').length
    ).toBeGreaterThanOrEqual(1);
  });

  it('no debe mostrar bloque de stack trace cuando el payload no lo contiene', () => {
    render(<TelemetryTableClient logs={mockLogs} />);

    const verButtons = screen.getAllByText('Ver');
    fireEvent.click(verButtons[1]); // Segundo log sin payload

    expect(screen.queryByText('Traza Técnica (Stack Trace)')).toBeNull();
  });
});
