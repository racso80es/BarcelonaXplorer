import { DomainException } from './domain.exception';

export class InvalidCoordinatesException extends DomainException {
  constructor(message: string) {
    super(`InvalidCoordinatesException: ${message}`);
  }
}
