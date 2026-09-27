import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListActiveCategoriesUseCase } from './list-active-categories.use-case';
import { ITemplateCategoryRepositoryPort } from '../ports/template-category-repository.port';
import { TemplateCategoryEntity } from '../domain/template-category.entity';

describe('ListActiveCategoriesUseCase', () => {
  let mockCategoryRepo: ITemplateCategoryRepositoryPort;
  let useCase: ListActiveCategoriesUseCase;

  const mockDate = new Date('2026-09-27T10:00:00Z');

  beforeEach(() => {
    mockCategoryRepo = {
      findBySlug: vi.fn(),
      findById: vi.fn(),
      findActiveCategories: vi.fn(),
      create: vi.fn(),
    };

    useCase = new ListActiveCategoriesUseCase(mockCategoryRepo);
  });

  it('debe devolver un sobre de éxito con el listado de categorías activas DTO', async () => {
    const mockEntities = [
      TemplateCategoryEntity.create({
        id: 'cat-1',
        slug: 'rutas-literarias',
        name: 'Literatura',
        description: 'Barcelona literaria',
        icon: 'book',
        displayOrder: 1,
        isActive: true,
        createdAt: mockDate,
        updatedAt: mockDate,
      }),
      TemplateCategoryEntity.create({
        id: 'cat-2',
        slug: 'cine',
        name: 'Cine',
        description: 'Barcelona de película',
        icon: 'film',
        displayOrder: 2,
        isActive: true,
        createdAt: mockDate,
        updatedAt: mockDate,
      }),
    ];

    vi.mocked(mockCategoryRepo.findActiveCategories).mockResolvedValue(mockEntities);

    const envelope = await useCase.execute();

    expect(envelope.success).toBe(true);
    expect(envelope.exitCode).toBe(0);
    expect(envelope.result).toHaveLength(2);
    expect(envelope.result?.[0].slug).toBe('rutas-literarias');
    expect(envelope.result?.[1].slug).toBe('cine');
  });

  it('debe capturar errores y retornar un sobre de error 500', async () => {
    vi.mocked(mockCategoryRepo.findActiveCategories).mockRejectedValue(
      new Error('Error en conexión MySQL'),
    );

    const envelope = await useCase.execute();

    expect(envelope.success).toBe(false);
    expect(envelope.exitCode).toBe(500);
    expect(envelope.errors?.[0]).toBe('Error en conexión MySQL');
  });
});
