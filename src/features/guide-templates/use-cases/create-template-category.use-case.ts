import { ITemplateCategoryRepositoryPort } from '../ports/template-category-repository.port';
import {
  CreateTemplateCategoryInput,
  CreateTemplateCategoryInputSchema,
  TemplateCategoryDTO,
} from '../domain/guide-template.schema';
import { TemplateSlugVO } from '../domain/value-objects/template-slug.vo';
import {
  OperationEnvelope,
  createSuccessEnvelope,
  createErrorEnvelope,
} from '@/shared/operation-envelope';
import { InvalidTemplateSlugException } from '@/shared/exceptions/invalid-template-slug.exception';

/**
 * Caso de Uso: Creación dinámica de taxonomías de catálogo (Fricción Cero en Admin).
 */
export class CreateTemplateCategoryUseCase {
  constructor(private readonly categoryRepo: ITemplateCategoryRepositoryPort) {}

  public async execute(
    input: CreateTemplateCategoryInput,
  ): Promise<OperationEnvelope<TemplateCategoryDTO>> {
    let validatedSlug: TemplateSlugVO;

    try {
      validatedSlug = new TemplateSlugVO(input.slug);
    } catch (error) {
      const message =
        error instanceof InvalidTemplateSlugException
          ? error.message
          : 'Identificador slug de categoría inválido.';
      return createErrorEnvelope<TemplateCategoryDTO>([message], 400, 'Validación fallida');
    }

    try {
      const parsedInput = CreateTemplateCategoryInputSchema.parse({
        ...input,
        slug: validatedSlug.getValue(),
      });

      const existing = await this.categoryRepo.findBySlug(validatedSlug.getValue());
      if (existing) {
        return createErrorEnvelope<TemplateCategoryDTO>(
          [`Ya existe una categoría con el slug '${validatedSlug.getValue()}'`],
          409,
          'Conflicto de unicidad',
        );
      }

      const created = await this.categoryRepo.create(parsedInput);

      return createSuccessEnvelope<TemplateCategoryDTO>(
        created.toJSON(),
        'Categoría creada exitosamente',
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error inesperado al crear la categoría';
      return createErrorEnvelope<TemplateCategoryDTO>(
        [message],
        500,
        'Fallo interno al crear categoría',
      );
    }
  }
}
