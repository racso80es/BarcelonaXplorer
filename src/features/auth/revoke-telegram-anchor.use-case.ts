import {
  RevokeTelegramAnchorCommand,
  RevokeTelegramAnchorResult,
  RevokeTelegramAnchorUseCasePort,
} from '@/features/auth';
import { UserAnchorRepositoryPort } from './user-anchor-repository.port';
import { TelegramBotGatewayPort } from '@/features/telegram';
import { TelegramChatId } from './telegram-chat-id.vo';

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
