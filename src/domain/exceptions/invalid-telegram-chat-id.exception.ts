import { DomainException } from './domain.exception';

export class InvalidTelegramChatIdException extends DomainException {
  constructor(message: string) {
    super(`[InvalidTelegramChatId] ${message}`);
  }
}
