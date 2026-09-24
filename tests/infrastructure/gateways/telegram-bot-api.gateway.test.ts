import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TelegramBotApiGateway } from '@/infrastructure/gateways/telegram-bot-api.gateway';

describe('TelegramBotApiGateway', () => {
  const originalFetch = global.fetch;
  const originalEnvToken = process.env.TELEGRAM_BOT_TOKEN;
  const originalEnvSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.TELEGRAM_BOT_TOKEN = originalEnvToken;
    process.env.TELEGRAM_WEBHOOK_SECRET = originalEnvSecret;
  });

  describe('verifySecretHeader', () => {
    it('debe retornar true cuando el secreto coincide en tiempo constante', () => {
      const gateway = new TelegramBotApiGateway('test-token', 'my-secret-123');
      expect(gateway.verifySecretHeader('my-secret-123')).toBe(true);
    });

    it('debe retornar false cuando el secreto difiere o es nulo', () => {
      const gateway = new TelegramBotApiGateway('test-token', 'my-secret-123');
      expect(gateway.verifySecretHeader('wrong-secret')).toBe(false);
      expect(gateway.verifySecretHeader(null)).toBe(false);
    });

    it('debe retornar false si no hay webhookSecret configurado', () => {
      delete process.env.TELEGRAM_WEBHOOK_SECRET;
      const gateway = new TelegramBotApiGateway('test-token', undefined);
      expect(gateway.verifySecretHeader('any-secret')).toBe(false);
    });
  });

  describe('getMe', () => {
    it('debe retornar null de forma inmediata si TELEGRAM_BOT_TOKEN no está definido', async () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      const gateway = new TelegramBotApiGateway(undefined);
      const result = await gateway.getMe();
      expect(result).toBeNull();
    });


    it('debe consultar api.telegram.org y retornar datos del bot parseados', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          result: {
            id: 987654321,
            is_bot: true,
            first_name: 'BXplorerBot',
            username: 'BXplorerBot',
            can_join_groups: false,
          },
        }),
      });

      const gateway = new TelegramBotApiGateway('valid-token');
      const result = await gateway.getMe();

      expect(result).toEqual({
        id: 987654321,
        username: 'BXplorerBot',
        firstName: 'BXplorerBot',
        canJoinGroups: false,
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.telegram.org/botvalid-token/getMe',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('debe retornar null ante respuesta HTTP no exitosa (ej. 401 Unauthorized)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      const gateway = new TelegramBotApiGateway('invalid-token');
      const result = await gateway.getMe();
      expect(result).toBeNull();
    });

    it('debe capturar excepciones de red o timeout y retornar null (Fail-Safe)', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network connection timeout'));

      const gateway = new TelegramBotApiGateway('valid-token');
      const result = await gateway.getMe();
      expect(result).toBeNull();
    });

    it('debe retornar null si la respuesta no cumple el esquema Zod esperado', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          result: {
            unexpected_field: true,
          },
        }),
      });

      const gateway = new TelegramBotApiGateway('valid-token');
      const result = await gateway.getMe();
      expect(result).toBeNull();
    });
  });

  describe('getWebhookInfo', () => {
    it('debe retornar null de forma inmediata si TELEGRAM_BOT_TOKEN no está definido', async () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      const gateway = new TelegramBotApiGateway(undefined);
      const result = await gateway.getWebhookInfo();
      expect(result).toBeNull();
    });

    it('debe retornar la información del webhook parseada ante respuesta 200 OK', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          result: {
            url: 'https://barcelonaxplorer.com/api/telegram/webhook',
            has_custom_certificate: false,
            pending_update_count: 0,
            max_connections: 40,
          },
        }),
      });

      const gateway = new TelegramBotApiGateway('valid-token');
      const result = await gateway.getWebhookInfo();

      expect(result).toEqual({
        url: 'https://barcelonaxplorer.com/api/telegram/webhook',
        hasCustomCertificate: false,
        pendingUpdateCount: 0,
        lastErrorDate: undefined,
        lastErrorMessage: undefined,
        maxConnections: 40,
      });
    });

    it('debe extraer last_error_message si está presente en la respuesta', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          result: {
            url: 'https://barcelonaxplorer.com/api/telegram/webhook',
            has_custom_certificate: false,
            pending_update_count: 5,
            last_error_date: 1727000000,
            last_error_message: 'Wrong response from the webhook: 401 Unauthorized',
          },
        }),
      });

      const gateway = new TelegramBotApiGateway('valid-token');
      const result = await gateway.getWebhookInfo();

      expect(result?.lastErrorMessage).toBe('Wrong response from the webhook: 401 Unauthorized');
      expect(result?.pendingUpdateCount).toBe(5);
    });

    it('debe retornar null ante fallo HTTP o rechazo de red', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('AbortError'));

      const gateway = new TelegramBotApiGateway('valid-token');
      const result = await gateway.getWebhookInfo();
      expect(result).toBeNull();
    });
  });
});
