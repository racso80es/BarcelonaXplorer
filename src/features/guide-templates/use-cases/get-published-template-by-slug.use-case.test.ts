import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetPublishedTemplateBySlugUseCase } from './get-published-template-by-slug.use-case';
import { IGuideTemplateRepositoryPort } from '../ports/guide-template-repository.port';
import { GuideTemplateDetailDTO } from '../domain/guide-template.schema';

describe('GetPublishedTemplateBySlugUseCase', () => {
  let mockRepo: IGuideTemplateRepositoryPort;
  let useCase: GetPublishedTemplateBySlugUseCase;

  const mockDate = new Date('2026-09-27T10:00:00Z');

  beforeEach(() => {
    mockRepo = {
      findPublishedByCategoryAndSlug: vi.fn(),
      findById: vi.fn(),
      listPublishedByCategory: vi.fn(),
      create: vi.fn(),
      createItem: vi.fn(),
    };

    useCase = new GetPublishedTemplateBySlugUseCase(mockRepo);
  });

  it('debe devolver un sobre de éxito con la guía cuando existe y está publicada', async () => {
    const mockDetail: GuideTemplateDetailDTO = {
      id: 'tmpl-1',
      categoryId: 'cat-1',
      slug: 'la-sombra-del-viento',
      title: 'La Barcelona de La Sombra del Viento',
      abstract: 'Ruta literaria por Barcelona',
      estimatedDuration: 180,
      status: 'PUBLISHED',
      isFeatured: true,
      createdAt: mockDate,
      updatedAt: mockDate,
      category: {
        id: 'cat-1',
        slug: 'rutas-literarias',
        name: 'Literatura',
        description: 'Libros y novelas',
        icon: null,
        displayOrder: 1,
        isActive: true,
        createdAt: mockDate,
        updatedAt: mockDate,
      },
      items: [
        {
          id: 'item-1',
          templateId: 'tmpl-1',
          orderIndex: 0,
          title: 'Librería Sempere',
          description: 'Carrer de Santa Anna',
          coordinatesLat: 41.385,
          coordinatesLng: 2.171,
          approxDurationMin: 20,
          tacticalMetadata: null,
          affiliateRefs: null,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ],
    };

    vi.mocked(mockRepo.findPublishedByCategoryAndSlug).mockResolvedValue(mockDetail);

    const envelope = await useCase.execute({
      categorySlug: 'rutas-literarias',
      templateSlug: 'la-sombra-del-viento',
    });

    expect(envelope.success).toBe(true);
    expect(envelope.exitCode).toBe(0);
    expect(envelope.result?.title).toBe('La Barcelona de La Sombra del Viento');
    expect(envelope.result?.items).toHaveLength(1);
    expect(mockRepo.findPublishedByCategoryAndSlug).toHaveBeenCalledWith(
      'rutas-literarias',
      'la-sombra-del-viento',
    );
  });

  it('debe devolver un sobre de error 404 si la guía no se encuentra', async () => {
    vi.mocked(mockRepo.findPublishedByCategoryAndSlug).mockResolvedValue(null);

    const envelope = await useCase.execute({
      categorySlug: 'rutas-literarias',
      templateSlug: 'ruta-no-existente',
    });

    expect(envelope.success).toBe(false);
    expect(envelope.exitCode).toBe(404);
    expect(envelope.feedback).toBe('Recurso no encontrado');
    expect(envelope.errors?.[0]).toContain('No se encontró ninguna guía');
  });

  it('debe devolver un sobre de error 400 si los slugs contienen caracteres inválidos', async () => {
    const envelope = await useCase.execute({
      categorySlug: 'slug_invalido_con_guiones_bajos',
      templateSlug: 'slug-valido',
    });

    expect(envelope.success).toBe(false);
    expect(envelope.exitCode).toBe(400);
    expect(envelope.feedback).toBe('Validación fallida');
    expect(mockRepo.findPublishedByCategoryAndSlug).not.toHaveBeenCalled();
  });

  it('debe capturar fallos inesperados y devolver un sobre de error 500', async () => {
    vi.mocked(mockRepo.findPublishedByCategoryAndSlug).mockRejectedValue(
      new Error('Fallo de conexión en MySQL'),
    );

    const envelope = await useCase.execute({
      categorySlug: 'rutas-literarias',
      templateSlug: 'la-sombra-del-viento',
    });

    expect(envelope.success).toBe(false);
    expect(envelope.exitCode).toBe(500);
    expect(envelope.feedback).toBe('Fallo interno al consultar el catálogo');
    expect(envelope.errors?.[0]).toBe('Fallo de conexión en MySQL');
  });
});
