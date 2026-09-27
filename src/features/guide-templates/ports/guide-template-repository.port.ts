import {
  GuideTemplateDTO,
  GuideTemplateDetailDTO,
  TemplateItemDTO,
  CreateGuideTemplateInput,
  CreateTemplateItemInput,
} from '../domain/guide-template.schema';

/**
 * Puerto Hexagonal de Salida para la persistencia del catálogo de templates y sus ítems.
 */
export interface IGuideTemplateRepositoryPort {
  findPublishedByCategoryAndSlug(
    categorySlug: string,
    templateSlug: string,
  ): Promise<GuideTemplateDetailDTO | null>;
  findById(id: string): Promise<GuideTemplateDetailDTO | null>;
  listPublishedByCategory(categorySlug: string): Promise<GuideTemplateDTO[]>;
  create(data: CreateGuideTemplateInput): Promise<GuideTemplateDTO>;
  createItem(data: CreateTemplateItemInput): Promise<TemplateItemDTO>;
}
