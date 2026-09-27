import { DomainException } from './domain.exception';

export class InvalidTemplateSlugException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}
