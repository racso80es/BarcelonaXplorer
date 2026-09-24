import {
  RestoreSessionFromMagicLinkCommand,
  RestoreSessionFromMagicLinkResult,
  RestoreSessionFromMagicLinkUseCasePort,
} from '@/application/ports/in/restore-session-from-magic-link.use-case.port';
import { MagicLinkSignerPort } from '@/application/ports/out/magic-link-signer.port';
import { MagicLinkNonceRepositoryPort } from '@/application/ports/out/magic-link-nonce-repository.port';
import { UserAnchorRepositoryPort } from '@/application/ports/out/user-anchor-repository.port';
import { TelegramChatId } from '@/domain/value-objects/telegram-chat-id.vo';
import { DomainException } from '@/domain/exceptions/domain.exception';

async function computeSha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class RestoreSessionFromMagicLinkUseCase
  implements RestoreSessionFromMagicLinkUseCasePort
{
  constructor(
    private readonly magicLinkSigner: MagicLinkSignerPort,
    private readonly nonceRepository: MagicLinkNonceRepositoryPort,
    private readonly anchorRepository: UserAnchorRepositoryPort
  ) {}

  async execute(
    command: RestoreSessionFromMagicLinkCommand
  ): Promise<RestoreSessionFromMagicLinkResult> {
    if (!command.token || command.token.trim() === '') {
      throw new DomainException('Token de enlace mágico ausente o vacío.');
    }

    // 1. Verificación de firma criptográfica y expiración
    const payload = await this.magicLinkSigner.verifyToken(command.token);

    // 2. Consumo atómico del nonce (Anti-Replay)
    const tokenHash = await computeSha256Hex(payload.nonce);
    const consumed = await this.nonceRepository.consumeNonce(tokenHash);

    if (!consumed) {
      throw new DomainException(
        'El enlace mágico ya fue utilizado previamente o no se encuentra registrado.'
      );
    }

    // 3. Confirmar que el anclaje sigue existiendo en MySQL (no revocado por Amnesia Táctica)
    const chatId = new TelegramChatId(payload.telegramChatId);
    const anchor = await this.anchorRepository.findByTelegramChatId(chatId);

    if (!anchor) {
      throw new DomainException(
        'El anclaje asociado a este enlace ya no existe en el sistema.'
      );
    }

    // 4. Actualizar última interacción
    anchor.touch();
    await this.anchorRepository.atomicUpsert(anchor);

    return {
      success: true,
      sessionId: payload.sessionId,
      telegramChatId: payload.telegramChatId,
    };
  }
}
