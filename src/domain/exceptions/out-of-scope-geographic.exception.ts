import { DomainException } from './domain.exception';

/**
 * Excepción lanzada cuando una entidad geográfica excede el perímetro
 * ontológico y de seguridad de BarcelonaXplorer o cuando se violan las
 * invariantes de definición geográfica.
 */
export class OutOfScopeGeographicException extends DomainException {
  constructor(message: string) {
    super(`OutOfScopeGeographicException: ${message}`);
  }
}
