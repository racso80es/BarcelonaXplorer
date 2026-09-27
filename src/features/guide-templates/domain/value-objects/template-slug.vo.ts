import { InvalidTemplateSlugException } from '@/shared/exceptions/invalid-template-slug.exception';

/**
 * Value Object inmutable para slugs de categorías y templates.
 * Cumple con el Axioma II (Tolerancia Cero a la Inferencia y Blindaje de Primitivos).
 */
export class TemplateSlugVO {
  private static readonly SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  private static readonly MIN_LENGTH = 2;
  private static readonly MAX_LENGTH = 96;

  private readonly value: string;

  constructor(rawSlug: string) {
    if (typeof rawSlug !== 'string') {
      throw new InvalidTemplateSlugException('El slug debe ser una cadena de texto.');
    }

    const sanitized = rawSlug.trim().toLowerCase();

    if (sanitized.length < TemplateSlugVO.MIN_LENGTH || sanitized.length > TemplateSlugVO.MAX_LENGTH) {
      throw new InvalidTemplateSlugException(
        `El slug '${rawSlug}' debe tener entre ${TemplateSlugVO.MIN_LENGTH} y ${TemplateSlugVO.MAX_LENGTH} caracteres.`
      );
    }

    if (!TemplateSlugVO.SLUG_REGEX.test(sanitized)) {
      throw new InvalidTemplateSlugException(
        `El slug '${rawSlug}' contiene caracteres inválidos. Solo se admiten minúsculas, números y guiones simples intermedios.`
      );
    }

    this.value = sanitized;
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: TemplateSlugVO): boolean {
    if (!other || !(other instanceof TemplateSlugVO)) {
      return false;
    }
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
