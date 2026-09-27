import { IGuideTemplateRepositoryPort } from '../ports/guide-template-repository.port';
import { GuideTemplateDetailDTO } from '../domain/guide-template.schema';
import { TemplateSlugVO } from '../domain/value-objects/template-slug.vo';
import {
  OperationEnvelope,
  createSuccessEnvelope,
  createErrorEnvelope,
} from '@/shared/operation-envelope';
import { InvalidTemplateSlugException } from '@/shared/exceptions/invalid-template-slug.exception';

export interface GetPublishedTemplateBySlugInput {
  categorySlug: string;
  templateSlug: string;
}

/**
 * Caso de Uso: Recuperación determinista de una guía publicada por sus slugs jerárquicos.
 * Retorna siempre un sobre OperationEnvelope<T> (Axioma V).
 */
export class GetPublishedTemplateBySlugUseCase {
  constructor(private readonly templateRepo: IGuideTemplateRepositoryPort) {}

  public async execute(
    input: GetPublishedTemplateBySlugInput,
  ): Promise<OperationEnvelope<GuideTemplateDetailDTO>> {
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
      return createErrorEnvelope<GuideTemplateDetailDTO>([message], 400, 'Validación fallida');
    }

    try {
      const template = await this.templateRepo.findPublishedByCategoryAndSlug(
        validatedCategorySlug.getValue(),
        validatedTemplateSlug.getValue(),
      );

      if (!template) {
        return createErrorEnvelope<GuideTemplateDetailDTO>(
          [
            `No se encontró ninguna guía publicada con la ruta /guias/${validatedCategorySlug.getValue()}/${validatedTemplateSlug.getValue()}`,
          ],
          404,
          'Recurso no encontrado',
        );
      }

      return createSuccessEnvelope<GuideTemplateDetailDTO>(template, 'Guía recuperada con éxito');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error inesperado al consultar la guía';
      return createErrorEnvelope<GuideTemplateDetailDTO>(
        [errorMsg],
        500,
        'Fallo interno al consultar el catálogo',
      );
    }
  }
}
