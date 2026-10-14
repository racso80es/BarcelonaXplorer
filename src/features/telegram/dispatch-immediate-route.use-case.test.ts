import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DispatchImmediateRouteToTelegramUseCase,
} from './dispatch-immediate-route.use-case';
import {
  UserAnchorRepositoryPort,
  MagicLinkSignerPort,
  MagicLinkNonceRepositoryPort,
  AnchorTokenEncryptorPort,
  UserAnchor,
  TelegramChatId,
} from '@/features/auth';
import { TelegramBotGatewayPort } from '@/features/telegram';

describe('DispatchImmediateRouteToTelegramUseCase (PBI-ORCH-PRO-001 / CA-4 & CA-5)', () => {
  let mockAnchorRepo: UserAnchorRepositoryPort;
  let mockBotGateway: TelegramBotGatewayPort;
  let mockSigner: MagicLinkSignerPort;
  let mockNonceRepo: MagicLinkNonceRepositoryPort;
  let mockEncryptor: AnchorTokenEncryptorPort;
  let useCase: DispatchImmediateRouteToTelegramUseCase;

  const FAKE_BOT_TOKEN = 'secret_bot_token_xyz_123';

  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = FAKE_BOT_TOKEN;

    mockAnchorRepo = {
      findByTelegramChatId: vi.fn(),
      findBySessionId: vi.fn(),
      atomicUpsert: vi.fn(),
      hardDeleteByChatId: vi.fn(),
      findRecentActive: vi.fn(),
    };

    mockBotGateway = {
      sendMessage: vi.fn().mockResolvedValue(undefined),
      verifySecretHeader: vi.fn(),
      getMe: vi.fn(),
      getWebhookInfo: vi.fn(),
      isGatewayEnabled: vi.fn().mockReturnValue(true),
    };

    mockSigner = {
      signToken: vi.fn().mockResolvedValue('signed-magic-token-abc'),
      verifyToken: vi.fn(),
    };

    mockNonceRepo = {
      saveNonce: vi.fn().mockResolvedValue(undefined),
      findNonce: vi.fn(),
      consumeNonce: vi.fn(),
    };

    mockEncryptor = {
      encryptSessionId: vi.fn().mockResolvedValue('encrypted_session_payload'),
      decryptAnchorToken: vi.fn(),
    };

    useCase = new DispatchImmediateRouteToTelegramUseCase(
      mockAnchorRepo,
      mockBotGateway,
      mockSigner,
      mockNonceRepo,
      mockEncryptor,
      'https://barcelonaxplorer.com',
      'BXplorerBot',
    );
  });

  it('CA-4: con anclaje, envía un solo sendMessage a telegramChatId con magic link y sin filtrar el token', async () => {
    const existingAnchor = new UserAnchor({
      id: 'anchor-1',
      sessionId: 'sess-active-123',
      telegramChatId: new TelegramChatId('987654321'),
      telegramUsername: 'racso',
      firstName: 'Racso',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastInteractionAt: new Date(),
    });

    vi.mocked(mockAnchorRepo.findBySessionId).mockResolvedValue(existingAnchor);

    const result = await useCase.execute('sess-active-123');

    expect(result.status).toBe('DELIVERED');
    if (result.status === 'DELIVERED') {
      expect(result.telegramChatId).toBe('987654321');
      expect(result.magicUrl).toContain('/api/auth/magic-link?token=signed-magic-token-abc');
    }

    // Un solo sendMessage
    expect(mockBotGateway.sendMessage).toHaveBeenCalledTimes(1);
    const [sentChatId, sentText, sentButtons] = vi.mocked(mockBotGateway.sendMessage).mock.calls[0];

    // Destinatario exacto
    expect(sentChatId).toBe('987654321');

    // El cuerpo y los botones NO contienen el token del bot
    expect(sentText).not.toContain(FAKE_BOT_TOKEN);
    expect(JSON.stringify(sentButtons)).not.toContain(FAKE_BOT_TOKEN);

    // Contiene el magic link para reabrir esa sesión
    expect(JSON.stringify(sentButtons)).toContain('/api/auth/magic-link?token=signed-magic-token-abc');

    // Nonce registrado
    expect(mockNonceRepo.saveNonce).toHaveBeenCalledTimes(1);
  });

  it('CA-5: sin anclaje, retorna el deep link de Telegram sin enviar mensajes ni inventar chats', async () => {
    vi.mocked(mockAnchorRepo.findBySessionId).mockResolvedValue(null);

    const result = await useCase.execute('sess-unanchored-456');

    expect(result.status).toBe('ANCHOR_REQUIRED');
    if (result.status === 'ANCHOR_REQUIRED') {
      expect(result.deepLink).toBe('https://t.me/BXplorerBot?start=encrypted_session_payload');
    }

    // No debe llamar a sendMessage
    expect(mockBotGateway.sendMessage).not.toHaveBeenCalled();
    // No debe crear nonce
    expect(mockNonceRepo.saveNonce).not.toHaveBeenCalled();
  });

  it('debe lanzar DomainException si sessionId está vacío', async () => {
    await expect(useCase.execute('')).rejects.toThrow('sessionId es requerido');
    await expect(useCase.execute('   ')).rejects.toThrow('sessionId es requerido');
  });
});
