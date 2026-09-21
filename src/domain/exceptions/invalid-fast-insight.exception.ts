import { DomainException } from './domain.exception';

export class InvalidFastInsightException extends DomainException {
  constructor(message: string) {
    super(`InvalidFastInsightException: ${message}`);
  }
}
