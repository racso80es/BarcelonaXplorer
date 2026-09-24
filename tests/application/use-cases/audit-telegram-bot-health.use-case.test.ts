import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditTelegramBotHealthUseCase } from '@/application/use-cases/audit-telegram-bot-health.use-case';
import { TelegramBotGatewayPort } from '@/application/ports/out/telegram-bot-gateway.port';
import { TelemetryRepositoryPort } from '@/application/ports/out/telemetry-repository.port';

describe('AuditTelegramBotHealthUseCase', () => {
  let mockGateway: TelegramBotGatewayPort;
  let mockTelemetryRepo: TelemetryRepositoryPort;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGateway = {
      sendMessage: vi.fn(),
      verifySecretHeader: vi.fn(),
      getMe: vi.fn(),
      getWebhookInfo: vi.fn(),
      isGatewayEnabled: vi.fn().mockReturnValue(true),
    };
    mockTelemetryRepo = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn(),
      prune: vi.fn(),
    };
  });

  it('Escenario 0: Bypass Táctico en Local/Pruebas cuando el gateway está deshabilitado', async () => {
    vi.mocked(mockGateway.isGatewayEnabled).mockReturnValue(false);

    const useCase = new AuditTelegramBotHealthUseCase(mockGateway, mockTelemetryRepo);
    const result = await useCase.execute();

    expect(result.state).toBe('disabled');
    expect(result.isHealthy).toBe(true);
    expect(result.msg).toBe('Desactivado en Local / Pruebas');
    expect(result.latencyMs).toBe(0);
    expect(mockGateway.getMe).not.toHaveBeenCalled();
    expect(mockGateway.getWebhookInfo).not.toHaveBeenCalled();
    expect(mockTelemetryRepo.log).not.toHaveBeenCalled();
  });

  it('Escenario 1: Resonancia Táctica S+ Grade (Verde) cuando bot y webhook están alineados y limpios', async () => {
    vi.mocked(mockGateway.getMe).mockResolvedValue({
      id: 123456,
      username: 'BXplorerBot',
      firstName: 'BarcelonaXplorer',
      canJoinGroups: true,
    });
    vi.mocked(mockGateway.getWebhookInfo).mockResolvedValue({
      url: 'https://barcelonaxplorer.com/api/telegram/webhook',
      hasCustomCertificate: false,
      pendingUpdateCount: 0,
    });

    const useCase = new AuditTelegramBotHealthUseCase(mockGateway, mockTelemetryRepo, {
      expectedWebhookUrl: 'https://barcelonaxplorer.com/api/telegram/webhook',
    });

    const result = await useCase.execute();

    expect(result.state).toBe('ok');
    expect(result.isHealthy).toBe(true);
    expect(result.isWebhookAligned).toBe(true);
    expect(result.msg).toBe('@BXplorerBot');
    expect(result.pendingUpdates).toBe(0);
    expect(mockTelemetryRepo.log).not.toHaveBeenCalled();
  });

  it('Escenario 2: Falla Crítica de Autenticación o Token Revocado (Rojo) emite log ERROR en SECURITY_PERIMETER', async () => {
    vi.mocked(mockGateway.getMe).mockResolvedValue(null);
    vi.mocked(mockGateway.getWebhookInfo).mockResolvedValue(null);

    const useCase = new AuditTelegramBotHealthUseCase(mockGateway, mockTelemetryRepo);
    const result = await useCase.execute();

    expect(result.state).toBe('error');
    expect(result.isHealthy).toBe(false);
    expect(result.msg).toBe('Token Inválido / No Configurado');
    expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'ERROR',
        context: 'SECURITY_PERIMETER',
        statusCode: 401,
      })
    );
  });

  it('Escenario 3: Desvío o Desalineación de Webhook (Ámbar) emite log WARN', async () => {
    vi.mocked(mockGateway.getMe).mockResolvedValue({
      id: 123456,
      username: 'BXplorerBot',
      firstName: 'BarcelonaXplorer',
      canJoinGroups: true,
    });
    vi.mocked(mockGateway.getWebhookInfo).mockResolvedValue({
      url: 'https://local-tunnel.ngrok-free.app/api/telegram/webhook',
      hasCustomCertificate: false,
      pendingUpdateCount: 2,
    });

    const useCase = new AuditTelegramBotHealthUseCase(mockGateway, mockTelemetryRepo, {
      expectedWebhookUrl: 'https://barcelonaxplorer.com/api/telegram/webhook',
    });

    const result = await useCase.execute();

    expect(result.state).toBe('warn');
    expect(result.isHealthy).toBe(false);
    expect(result.isWebhookAligned).toBe(false);
    expect(result.msg).toBe('Webhook Desalineado');
    expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'WARN',
        context: 'SECURITY_PERIMETER',
      })
    );
  });

  it('Escenario 4: Fricción de Entrega Reciente en Webhook (Ámbar) emite log WARN con mensaje', async () => {
    // lastErrorDate dentro de los últimos 15 minutos → error activo → WARN
    const recentErrorDate = Math.floor(Date.now() / 1000) - 60; // hace 1 minuto

    vi.mocked(mockGateway.getMe).mockResolvedValue({
      id: 123456,
      username: 'BXplorerBot',
      firstName: 'BarcelonaXplorer',
      canJoinGroups: true,
    });
    vi.mocked(mockGateway.getWebhookInfo).mockResolvedValue({
      url: 'https://barcelonaxplorer.com/api/telegram/webhook',
      hasCustomCertificate: false,
      pendingUpdateCount: 3,
      lastErrorDate: recentErrorDate,
      lastErrorMessage: 'Wrong response from the webhook: 401 Unauthorized',
    });

    const useCase = new AuditTelegramBotHealthUseCase(mockGateway, mockTelemetryRepo, {
      expectedWebhookUrl: 'https://barcelonaxplorer.com/api/telegram/webhook',
    });

    const result = await useCase.execute();

    expect(result.state).toBe('warn');
    expect(result.isHealthy).toBe(false);
    expect(result.lastErrorMessage).toBe('Wrong response from the webhook: 401 Unauthorized');
    expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'WARN',
        context: 'SECURITY_PERIMETER',
      })
    );
  });

  it('Escenario 5: Webhook Inaccesible ante caída parcial de consulta', async () => {
    vi.mocked(mockGateway.getMe).mockResolvedValue({
      id: 123456,
      username: 'BXplorerBot',
      firstName: 'BarcelonaXplorer',
      canJoinGroups: true,
    });
    vi.mocked(mockGateway.getWebhookInfo).mockResolvedValue(null);

    const useCase = new AuditTelegramBotHealthUseCase(mockGateway, mockTelemetryRepo);
    const result = await useCase.execute();

    expect(result.state).toBe('warn');
    expect(result.isHealthy).toBe(false);
    expect(result.msg).toBe('Webhook Inaccesible');
    expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'WARN',
        context: 'SECURITY_PERIMETER',
        statusCode: 503,
      })
    );
  });

  it('Escenario 6: Advertencia por Saturación de Actualizaciones Pendientes', async () => {
    vi.mocked(mockGateway.getMe).mockResolvedValue({
      id: 123456,
      username: 'BXplorerBot',
      firstName: 'BarcelonaXplorer',
      canJoinGroups: true,
    });
    vi.mocked(mockGateway.getWebhookInfo).mockResolvedValue({
      url: 'https://barcelonaxplorer.com/api/telegram/webhook',
      hasCustomCertificate: false,
      pendingUpdateCount: 120,
    });

    const useCase = new AuditTelegramBotHealthUseCase(mockGateway, mockTelemetryRepo, {
      expectedWebhookUrl: 'https://barcelonaxplorer.com/api/telegram/webhook',
      pendingUpdateWarnThreshold: 100,
    });

    const result = await useCase.execute();

    expect(result.state).toBe('warn');
    expect(result.isHealthy).toBe(false);
    expect(result.msg).toBe('Saturación (120 pendientes)');
  });

  it('Escenario 7: Error Residual Histórico de Telegram (>15min) se clasifica como S+ Grade', async () => {
    // lastErrorDate hace más de 15 minutos → error stale/residual → no degrada el semáforo
    const staleErrorDate = Math.floor(Date.now() / 1000) - 60 * 20; // hace 20 minutos

    vi.mocked(mockGateway.getMe).mockResolvedValue({
      id: 123456,
      username: 'BXplorerBot',
      firstName: 'BarcelonaXplorer',
      canJoinGroups: true,
    });
    vi.mocked(mockGateway.getWebhookInfo).mockResolvedValue({
      url: 'https://barcelonaxplorer.com/api/telegram/webhook',
      hasCustomCertificate: false,
      pendingUpdateCount: 0,
      lastErrorDate: staleErrorDate,
      lastErrorMessage: 'Wrong response from the webhook: 404 Not Found',
    });

    const useCase = new AuditTelegramBotHealthUseCase(mockGateway, mockTelemetryRepo, {
      expectedWebhookUrl: 'https://barcelonaxplorer.com/api/telegram/webhook',
    });

    const result = await useCase.execute();

    expect(result.state).toBe('ok');
    expect(result.isHealthy).toBe(true);
    expect(result.msg).toBe('@BXplorerBot');
    expect(mockTelemetryRepo.log).not.toHaveBeenCalled();
  });
});
