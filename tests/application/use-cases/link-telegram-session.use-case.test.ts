import { describe, it, expect, vi } from 'vitest';
import { LinkTelegramSessionUseCase } from '@/application/use-cases/link-telegram-session.use-case';
import { AnchorTokenEncryptorPort } from '@/application/ports/out/anchor-token-encryptor.port';
import { UserAnchorRepositoryPort } from '@/application/ports/out/user-anchor-repository.port';
import { TelegramBotGatewayPort } from '@/application/ports/out/telegram-bot-gateway.port';
import { UserAnchor } from '@/domain/entities/user-anchor.entity';

describe('LinkTelegramSessionUseCase', () => {
  it('vincula exitosamente una sesión, persiste atómicamente y despacha mensaje con botones', async () => {
    const mockEncryptor: AnchorTokenEncryptorPort = {
      encryptSessionId: vi.fn(),
      decryptAnchorToken: vi.fn().mockResolvedValue('550e8400-e29b-41d4-a716-446655440000'),
    };

    let savedAnchor: UserAnchor | null = null;
    const mockRepo: UserAnchorRepositoryPort = {
      findByTelegramChatId: vi.fn().mockResolvedValue(null),
      findBySessionId: vi.fn().mockResolvedValue(null),
      atomicUpsert: vi.fn().mockImplementation(async (anchor: UserAnchor) => {
        savedAnchor = anchor;
      }),
      hardDeleteByChatId: vi.fn(),
    };

    const mockBotGateway: TelegramBotGatewayPort = {
      sendMessage: vi.fn().mockResolvedValue(undefined),
      verifySecretHeader: vi.fn().mockReturnValue(true),
    };

    const useCase = new LinkTelegramSessionUseCase(
      mockEncryptor,
      mockRepo,
      mockBotGateway,
      'https://barcelonaxplorer.com'
    );

    const result = await useCase.execute({
      encryptedAnchorToken: 'mock_aes_gcm_token',
      telegramChatId: '123456789',
      telegramUsername: 'alex_bcn',
      firstName: 'Alex',
    });

    expect(result.success).toBe(true);
    expect(result.sessionId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(mockRepo.atomicUpsert).toHaveBeenCalled();
    expect(savedAnchor).not.toBeNull();
    expect((savedAnchor as unknown as UserAnchor).telegramChatId.getValue()).toBe('123456789');
    expect(mockBotGateway.sendMessage).toHaveBeenCalledWith(
      '123456789',
      expect.stringContaining('Itinerario S+ Grade blindado con éxito'),
      expect.any(Array)
    );
  });
});
