import { IGuideTemplateRepositoryPort } from '../ports/guide-template-repository.port';
import { ITemplateTranslationServicePort } from '../ports/template-translation-service.port';
import {
  LocalizedGuideTemplateDetailDTO,
  LocalizedGuideTemplateDetailDTOSchema,
} from '../domain/guide-template.schema';
import { TemplateSlugVO } from '../domain/value-objects/template-slug.vo';
import { SupportedLanguageVo, SupportedLanguage } from '@/features/i18n';
import {
  OperationEnvelope,
  createSuccessEnvelope,
  createErrorEnvelope,
} from '@/shared/operation-envelope';
import { InvalidTemplateSlugException } from '@/shared/exceptions/invalid-template-slug.exception';

export interface GetPublishedTemplateBySlugInput {
  categorySlug: string;
  templateSlug: string;
  language?: SupportedLanguage | string | null;
}

/**
 * Caso de Uso: Recuperación determinista y localización reactiva de una guía temática.
 * 
 * Cumple con el Protocolo de Acero S+ Grade:
 * 1. Cache Hit (0 Tokens): Recupera desde MySQL en castellano o traducciones persistidas.
 * 2. Cache Miss (Paciente Cero): Invoca al servicio de traducción con Gemini (timeout 8000ms, SingleFlight)
 *    y persiste atómicamente en tablas satélite mediante Prisma.
 * 3. Fail-Soft: Si la traducción falla o excede la ventana síncrona, devuelve la versión maestra en castellano.
 */
export class GetPublishedTemplateBySlugUseCase {
  constructor(
    private readonly templateRepo: IGuideTemplateRepositoryPort,
    private readonly translationService?: ITemplateTranslationServicePort,
  ) {}

  public async execute(
    input: GetPublishedTemplateBySlugInput,
  ): Promise<OperationEnvelope<LocalizedGuideTemplateDetailDTO>> {
    let validatedCategorySlug: TemplateSlugVO;
    let validatedTemplateSlug: TemplateSlugVO;

    try {
      validatedCategorySlug = new TemplateSlugVO(input.categorySlug);
      validatedTemplateSlug = new TemplateSlugVO(input.templateSlug);
    } catch (error) {
      const message =
        error instanceof InvalidTemplateSlugException
          ? error.message
          : 'Identificadores de slug inválidos.';
      return createErrorEnvelope<LocalizedGuideTemplateDetailDTO>(
        [message],
        400,
        'Validación fallida',
      );
    }

    const targetLangVo = SupportedLanguageVo.from(input.language);
    const targetLang = targetLangVo.value;

    try {
      // 1. Consulta con join a tablas satélite
      const template = await this.templateRepo.findPublishedByCategoryAndSlugLocalized(
        validatedCategorySlug.getValue(),
        validatedTemplateSlug.getValue(),
        targetLang,
      );

      if (!template) {
        return createErrorEnvelope<LocalizedGuideTemplateDetailDTO>(
          [
            `No se encontró ninguna guía publicada con la ruta /guias/${validatedCategorySlug.getValue()}/${validatedTemplateSlug.getValue()}`,
          ],
          404,
          'Recurso no encontrado',
        );
      }

      // 2. Cache Hit: Castellano o traducción ya persistida en base de datos
      if (targetLang === 'es' || template.isTranslated) {
        return createSuccessEnvelope<LocalizedGuideTemplateDetailDTO>(
          template,
          template.isTranslated
            ? `Guía recuperada con éxito en [${targetLang}] (Cache Hit)`
            : 'Guía recuperada con éxito en idioma maestro [es]',
        );
      }

      // 3. Cache Miss (Paciente Cero): requiere traducción con Gemini
      if (!this.translationService) {
        return createSuccessEnvelope<LocalizedGuideTemplateDetailDTO>(
          template,
          'Servicio de traducción no disponible. Sirviendo versión en idioma maestro [es].',
        );
      }

      try {
        const translation = await this.translationService.translateTemplate(
          template,
          targetLang,
        );

        // Persistencia relacional satélite en MySQL
        await this.templateRepo.saveTemplateTranslation(translation).catch((err) => {
          console.warn('[GetPublishedTemplateBySlugUseCase] Error no fatal al guardar traducción:', err);
        });

        // Ensamblado del DTO localizado
        const itemTransMap = new Map(translation.items.map((i) => [i.itemId, i]));
        const localizedItems = template.items.map((item) => {
          const trans = itemTransMap.get(item.id);
          return {
            ...item,
            title: trans?.title ?? item.title,
            description: trans?.description ?? item.description,
          };
        });

        const localizedTemplate = LocalizedGuideTemplateDetailDTOSchema.parse({
          ...template,
          title: translation.title,
          abstract: translation.abstract,
          items: localizedItems,
          language: targetLang,
          isTranslated: true,
        });

        return createSuccessEnvelope<LocalizedGuideTemplateDetailDTO>(
          localizedTemplate,
          `Guía traducida y persistida con éxito en [${targetLang}] (Paciente Cero)`,
        );
      } catch (transError) {
        // 4. Fail-Soft: Si falla la traducción, degradación elegante a castellano
        const warningMsg =
          transError instanceof Error ? transError.message : 'Fallo en servicio de traducción';
        return createSuccessEnvelope<LocalizedGuideTemplateDetailDTO>(
          template,
          `Traducción degradada a castellano por contingencia: ${warningMsg}`,
        );
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Error inesperado al consultar la guía';
      return createErrorEnvelope<LocalizedGuideTemplateDetailDTO>(
        [errorMsg],
        500,
        'Fallo interno al consultar el catálogo',
      );
    }
  }
}
