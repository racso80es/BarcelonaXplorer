import { DomainException } from './domain.exception';

export class InvalidTimeSpanException extends DomainException {
  constructor(message: string) {
    super(`InvalidTimeSpanException: ${message}`);
  }
}
