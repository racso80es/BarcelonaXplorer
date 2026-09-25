export interface RevokeTelegramAnchorCommand {
  telegramChatId: string;
}

export interface RevokeTelegramAnchorResult {
  success: boolean;
  purgedSessionId?: string;
}

export interface RevokeTelegramAnchorUseCasePort {
  execute(command: RevokeTelegramAnchorCommand): Promise<RevokeTelegramAnchorResult>;
}
