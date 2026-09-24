import { describe, it, expect, vi } from 'vitest';
import { RestoreSessionFromMagicLinkUseCase } from '@/application/use-cases/restore-session-from-magic-link.use-case';
import { MagicLinkSignerPort } from '@/application/ports/out/magic-link-signer.port';
import { MagicLinkNonceRepositoryPort } from '@/application/ports/out/magic-link-nonce-repository.port';
import { UserAnchorRepositoryPort } from '@/application/ports/out/user-anchor-repository.port';
import { UserAnchor } from '@/domain/entities/user-anchor.entity';
import { TelegramChatId } from '@/domain/value-objects/telegram-chat-id.vo';
import { DomainException } from '@/domain/exceptions/domain.exception';

describe('RestoreSessionFromMagicLinkUseCase', () => {
  const samplePayload = {
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    telegramChatId: '123456789',
    expiresAt: Date.now() + 60000,
    nonce: 'nonce_123',
  };

  const sampleAnchor = new UserAnchor({
    id: 'anc_1',
    sessionId: samplePayload.sessionId,
    telegramChatId: new TelegramChatId(samplePayload.telegramChatId),
    createdAt: new Date(),
    updatedAt: new Date(),
    lastInteractionAt: new Date(),
  });

  it('restaura la sesión con éxito y consume el nonce anti-replay', async () => {
    const mockSigner: MagicLinkSignerPort = {
      signToken: vi.fn(),
      verifyToken: vi.fn().mockResolvedValue(samplePayload),
    };

    const mockNonceRepo: MagicLinkNonceRepositoryPort = {
      saveNonce: vi.fn(),
      findNonce: vi.fn(),
      consumeNonce: vi.fn().mockResolvedValue(true),
    };

    const mockAnchorRepo: UserAnchorRepositoryPort = {
      findByTelegramChatId: vi.fn().mockResolvedValue(sampleAnchor),
      findBySessionId: vi.fn(),
      atomicUpsert: vi.fn().mockResolvedValue(undefined),
      hardDeleteByChatId: vi.fn(),
    };

    const useCase = new RestoreSessionFromMagicLinkUseCase(
      mockSigner,
      mockNonceRepo,
      mockAnchorRepo
    );

    const result = await useCase.execute({ token: 'valid.token' });

    expect(result.success).toBe(true);
    expect(result.sessionId).toBe(samplePayload.sessionId);
    expect(mockNonceRepo.consumeNonce).toHaveBeenCalled();
    expect(mockAnchorRepo.atomicUpsert).toHaveBeenCalled();
  });

  it('rechaza si el nonce ya fue consumido (intento de replay)', async () => {
    const mockSigner: MagicLinkSignerPort = {
      signToken: vi.fn(),
      verifyToken: vi.fn().mockResolvedValue(samplePayload),
    };

    const mockNonceRepo: MagicLinkNonceRepositoryPort = {
      saveNonce: vi.fn(),
      findNonce: vi.fn(),
      consumeNonce: vi.fn().mockResolvedValue(false), // Ya consumido
    };

    const mockAnchorRepo: UserAnchorRepositoryPort = {
      findByTelegramChatId: vi.fn(),
      findBySessionId: vi.fn(),
      atomicUpsert: vi.fn(),
      hardDeleteByChatId: vi.fn(),
    };

    const useCase = new RestoreSessionFromMagicLinkUseCase(
      mockSigner,
      mockNonceRepo,
      mockAnchorRepo
    );

    await expect(useCase.execute({ token: 'replayed.token' })).rejects.toThrow(
      'El enlace mágico ya fue utilizado previamente'
    );
  });

  it('rechaza si el anclaje fue eliminado por Amnesia Táctica', async () => {
    const mockSigner: MagicLinkSignerPort = {
      signToken: vi.fn(),
      verifyToken: vi.fn().mockResolvedValue(samplePayload),
    };

    const mockNonceRepo: MagicLinkNonceRepositoryPort = {
      saveNonce: vi.fn(),
      findNonce: vi.fn(),
      consumeNonce: vi.fn().mockResolvedValue(true),
    };

    const mockAnchorRepo: UserAnchorRepositoryPort = {
      findByTelegramChatId: vi.fn().mockResolvedValue(null), // Anclaje purgado
      findBySessionId: vi.fn(),
      atomicUpsert: vi.fn(),
      hardDeleteByChatId: vi.fn(),
    };

    const useCase = new RestoreSessionFromMagicLinkUseCase(
      mockSigner,
      mockNonceRepo,
      mockAnchorRepo
    );

    await expect(useCase.execute({ token: 'valid.token' })).rejects.toThrow(
      'El anclaje asociado a este enlace ya no existe'
    );
  });
});
