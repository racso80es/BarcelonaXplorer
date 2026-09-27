import { TemplateCategoryEntity } from '../domain/template-category.entity';
import { CreateTemplateCategoryInput } from '../domain/guide-template.schema';

/**
 * Puerto Hexagonal de Salida para la persistencia de categorías de templates.
 */
export interface ITemplateCategoryRepositoryPort {
  findBySlug(slug: string): Promise<TemplateCategoryEntity | null>;
  findById(id: string): Promise<TemplateCategoryEntity | null>;
  findActiveCategories(): Promise<TemplateCategoryEntity[]>;
  create(data: CreateTemplateCategoryInput): Promise<TemplateCategoryEntity>;
}
