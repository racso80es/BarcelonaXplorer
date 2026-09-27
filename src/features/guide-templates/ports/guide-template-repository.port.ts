import {
  GuideTemplateDTO,
  GuideTemplateDetailDTO,
  LocalizedGuideTemplateDetailDTO,
  TemplateItemDTO,
  CreateGuideTemplateInput,
  CreateTemplateItemInput,
} from '../domain/guide-template.schema';
import { SupportedLanguage, LocalizedTemplateTranslation } from '@/features/i18n';

/**
 * Puerto Hexagonal de Salida para la persistencia del catálogo de templates y sus ítems.
 */
export interface IGuideTemplateRepositoryPort {
  findPublishedByCategoryAndSlug(
    categorySlug: string,
    templateSlug: string,
  ): Promise<GuideTemplateDetailDTO | null>;
  findPublishedByCategoryAndSlugLocalized(
    categorySlug: string,
    templateSlug: string,
    language: SupportedLanguage,
  ): Promise<LocalizedGuideTemplateDetailDTO | null>;
  findById(id: string): Promise<GuideTemplateDetailDTO | null>;
  listPublishedByCategory(categorySlug: string): Promise<GuideTemplateDTO[]>;
  create(data: CreateGuideTemplateInput): Promise<GuideTemplateDTO>;
  createItem(data: CreateTemplateItemInput): Promise<TemplateItemDTO>;
  saveTemplateTranslation(
    translation: LocalizedTemplateTranslation,
  ): Promise<void>;
}
