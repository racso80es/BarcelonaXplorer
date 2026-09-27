import { GuideTemplateDetailDTO } from '../domain/guide-template.schema';
import { SupportedLanguage } from '@/features/i18n';
import { LocalizedTemplateTranslation } from '@/features/i18n';

/**
 * Puerto Hexagonal de Salida para el servicio de traducción reactiva con LLM.
 */
export interface ITemplateTranslationServicePort {
  /**
   * Traduce un template de autor y sus ítems al idioma de destino solicitado.
   * Utiliza una ventana de hasta 8000ms y deduplicación SingleFlight.
   */
  translateTemplate(
    template: GuideTemplateDetailDTO,
    targetLanguage: SupportedLanguage,
  ): Promise<LocalizedTemplateTranslation>;
}
