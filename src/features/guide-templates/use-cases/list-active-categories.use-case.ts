import { ITemplateCategoryRepositoryPort } from '../ports/template-category-repository.port';
import { TemplateCategoryDTO } from '../domain/guide-template.schema';
import {
  OperationEnvelope,
  createSuccessEnvelope,
  createErrorEnvelope,
} from '@/shared/operation-envelope';

/**
 * Caso de Uso: Listado de categorías activas para el menú o catálogo del frontend y triaje del SLM.
 */
export class ListActiveCategoriesUseCase {
  constructor(private readonly categoryRepo: ITemplateCategoryRepositoryPort) {}

  public async execute(): Promise<OperationEnvelope<TemplateCategoryDTO[]>> {
    try {
      const entities = await this.categoryRepo.findActiveCategories();
      const dtos: TemplateCategoryDTO[] = entities.map((entity) => entity.toJSON());

      return createSuccessEnvelope<TemplateCategoryDTO[]>(
        dtos,
        'Categorías activas recuperadas con éxito',
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error inesperado al recuperar categorías activas';
      return createErrorEnvelope<TemplateCategoryDTO[]>(
        [message],
        500,
        'Fallo al consultar categorías',
      );
    }
  }
}
