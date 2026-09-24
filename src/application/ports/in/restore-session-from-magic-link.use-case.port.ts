export interface RestoreSessionFromMagicLinkCommand {
  token: string;
}

export interface RestoreSessionFromMagicLinkResult {
  success: boolean;
  sessionId: string;
  telegramChatId: string;
}

export interface RestoreSessionFromMagicLinkUseCasePort {
  execute(
    command: RestoreSessionFromMagicLinkCommand
  ): Promise<RestoreSessionFromMagicLinkResult>;
}
