import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateTemplateCategoryUseCase } from './create-template-category.use-case';
import { ITemplateCategoryRepositoryPort } from '../ports/template-category-repository.port';
import { TemplateCategoryEntity } from '../domain/template-category.entity';

describe('CreateTemplateCategoryUseCase', () => {
  let mockCategoryRepo: ITemplateCategoryRepositoryPort;
  let useCase: CreateTemplateCategoryUseCase;

  const mockDate = new Date('2026-09-27T10:00:00Z');

  beforeEach(() => {
    mockCategoryRepo = {
      findBySlug: vi.fn(),
      findById: vi.fn(),
      findActiveCategories: vi.fn(),
      create: vi.fn(),
    };

    useCase = new CreateTemplateCategoryUseCase(mockCategoryRepo);
  });

  it('debe crear una categoría nueva satisfactoriamente', async () => {
    vi.mocked(mockCategoryRepo.findBySlug).mockResolvedValue(null);

    const createdEntity = TemplateCategoryEntity.create({
      id: 'cat-cine',
      slug: 'rutas-cine',
      name: 'Rutas de Cine',
      description: 'Barcelona de película y rodajes',
      icon: 'film',
      displayOrder: 2,
      isActive: true,
      createdAt: mockDate,
      updatedAt: mockDate,
    });

    vi.mocked(mockCategoryRepo.create).mockResolvedValue(createdEntity);

    const envelope = await useCase.execute({
      slug: 'rutas-cine',
      name: 'Rutas de Cine',
      description: 'Barcelona de película y rodajes',
      icon: 'film',
      displayOrder: 2,
    });

    expect(envelope.success).toBe(true);
    expect(envelope.exitCode).toBe(0);
    expect(envelope.result?.slug).toBe('rutas-cine');
    expect(mockCategoryRepo.create).toHaveBeenCalledOnce();
  });

  it('debe rechazar la creación si el slug ya existe (409 Conflicto)', async () => {
    const existing = TemplateCategoryEntity.create({
      id: 'cat-existente',
      slug: 'rutas-cine',
      name: 'Rutas de Cine',
      description: 'Descripción previa',
      createdAt: mockDate,
      updatedAt: mockDate,
    });

    vi.mocked(mockCategoryRepo.findBySlug).mockResolvedValue(existing);

    const envelope = await useCase.execute({
      slug: 'rutas-cine',
      name: 'Rutas de Cine',
      description: 'Barcelona de película',
    });

    expect(envelope.success).toBe(false);
    expect(envelope.exitCode).toBe(409);
    expect(envelope.feedback).toBe('Conflicto de unicidad');
    expect(mockCategoryRepo.create).not.toHaveBeenCalled();
  });

  it('debe rechazar slugs mal formados con 400 Validación fallida', async () => {
    const envelope = await useCase.execute({
      slug: 'slug_con_guiones_bajos_invalido',
      name: 'Nombre',
      description: 'Descripción de prueba',
    });

    expect(envelope.success).toBe(false);
    expect(envelope.exitCode).toBe(400);
    expect(envelope.feedback).toBe('Validación fallida');
  });
});
