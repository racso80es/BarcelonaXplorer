import { describe, it, expect, vi } from 'vitest';
import { RevokeTelegramAnchorUseCase } from '@/application/use-cases/revoke-telegram-anchor.use-case';
import { UserAnchorRepositoryPort } from '@/application/ports/out/user-anchor-repository.port';
import { TelegramBotGatewayPort } from '@/application/ports/out/telegram-bot-gateway.port';
import { UserAnchor } from '@/domain/entities/user-anchor.entity';
import { TelegramChatId } from '@/domain/value-objects/telegram-chat-id.vo';

describe('RevokeTelegramAnchorUseCase', () => {
  it('ejecuta un Hard-Delete en MySQL y despacha confirmación al usuario', async () => {
    const sampleAnchor = new UserAnchor({
      id: 'anc_123',
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      telegramChatId: new TelegramChatId('987654321'),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastInteractionAt: new Date(),
    });

    const mockRepo: UserAnchorRepositoryPort = {
      findByTelegramChatId: vi.fn().mockResolvedValue(sampleAnchor),
      findBySessionId: vi.fn(),
      atomicUpsert: vi.fn(),
      hardDeleteByChatId: vi.fn().mockResolvedValue(undefined),
    };

    const mockBotGateway: TelegramBotGatewayPort = {
      sendMessage: vi.fn().mockResolvedValue(undefined),
      verifySecretHeader: vi.fn().mockReturnValue(true),
    };

    const useCase = new RevokeTelegramAnchorUseCase(mockRepo, mockBotGateway);

    const result = await useCase.execute({ telegramChatId: '987654321' });

    expect(result.success).toBe(true);
    expect(result.purgedSessionId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(mockRepo.hardDeleteByChatId).toHaveBeenCalled();
    expect(mockBotGateway.sendMessage).toHaveBeenCalledWith(
      '987654321',
      expect.stringContaining('Amnesia Táctica Ejecutada')
    );
  });
});
