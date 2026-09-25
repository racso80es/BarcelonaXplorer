export interface LinkTelegramSessionCommand {
  encryptedAnchorToken: string;
  telegramChatId: string;
  telegramUsername?: string | null;
  firstName?: string | null;
}

export interface LinkTelegramSessionResult {
  success: boolean;
  sessionId: string;
}

export interface LinkTelegramSessionUseCasePort {
  execute(command: LinkTelegramSessionCommand): Promise<LinkTelegramSessionResult>;
}
