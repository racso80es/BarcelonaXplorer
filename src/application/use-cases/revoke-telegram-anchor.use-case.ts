import {
  RevokeTelegramAnchorCommand,
  RevokeTelegramAnchorResult,
  RevokeTelegramAnchorUseCasePort,
} from '@/application/ports/in/revoke-telegram-anchor.use-case.port';
import { UserAnchorRepositoryPort } from '@/application/ports/out/user-anchor-repository.port';
import { TelegramBotGatewayPort } from '@/application/ports/out/telegram-bot-gateway.port';
import { TelegramChatId } from '@/domain/value-objects/telegram-chat-id.vo';

export class RevokeTelegramAnchorUseCase implements RevokeTelegramAnchorUseCasePort {
  constructor(
    private readonly anchorRepository: UserAnchorRepositoryPort,
    private readonly botGateway: TelegramBotGatewayPort
  ) {}

  async execute(command: RevokeTelegramAnchorCommand): Promise<RevokeTelegramAnchorResult> {
    const chatId = new TelegramChatId(command.telegramChatId);
    const existing = await this.anchorRepository.findByTelegramChatId(chatId);

    // Hard-Delete físico innegociable en MySQL
    await this.anchorRepository.hardDeleteByChatId(chatId);

    await this.botGateway.sendMessage(
      chatId.getValue(),
      `🧹 <b>Amnesia Táctica Ejecutada</b>\n\n` +
      `Tu rastro táctico ha sido purgado por completo. Hemos eliminado físicamente tu vínculo de la base de datos y desanclado tu dispositivo.\n\n` +
      `No conservamos identificadores ni historiales asociados a este chat.`
    );

    return {
      success: true,
      purgedSessionId: existing?.sessionId,
    };
  }
}
