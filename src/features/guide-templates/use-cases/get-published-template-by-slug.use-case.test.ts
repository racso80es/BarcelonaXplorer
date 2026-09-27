import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetPublishedTemplateBySlugUseCase } from './get-published-template-by-slug.use-case';
import { IGuideTemplateRepositoryPort } from '../ports/guide-template-repository.port';
import { ITemplateTranslationServicePort } from '../ports/template-translation-service.port';
import { LocalizedGuideTemplateDetailDTO } from '../domain/guide-template.schema';
import { LocalizedTemplateTranslation } from '@/features/i18n';

describe('GetPublishedTemplateBySlugUseCase (Protocolo de Acero S+ Grade)', () => {
  let mockRepo: IGuideTemplateRepositoryPort;
  let mockTranslationService: ITemplateTranslationServicePort;
  let useCase: GetPublishedTemplateBySlugUseCase;

  const mockDate = new Date('2026-09-27T10:00:00Z');

  const baseDetail: LocalizedGuideTemplateDetailDTO = {
    id: 'tmpl-1',
    categoryId: 'cat-1',
    slug: 'la-sombra-del-viento',
    title: 'La Barcelona de La Sombra del Viento',
    abstract: 'Ruta literaria por Barcelona',
    estimatedDuration: 180,
    status: 'PUBLISHED',
    isFeatured: true,
    language: 'es',
    isTranslated: false,
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

  beforeEach(() => {
    mockRepo = {
      findPublishedByCategoryAndSlug: vi.fn(),
      findPublishedByCategoryAndSlugLocalized: vi.fn(),
      findById: vi.fn(),
      listPublishedByCategory: vi.fn(),
      create: vi.fn(),
      createItem: vi.fn(),
      saveTemplateTranslation: vi.fn().mockResolvedValue(undefined),
    };

    mockTranslationService = {
      translateTemplate: vi.fn(),
    };

    useCase = new GetPublishedTemplateBySlugUseCase(mockRepo, mockTranslationService);
  });

  it('debe devolver la guía en castellano cuando language es es (Cache Hit directo)', async () => {
    vi.mocked(mockRepo.findPublishedByCategoryAndSlugLocalized).mockResolvedValue(baseDetail);

    const envelope = await useCase.execute({
      categorySlug: 'rutas-literarias',
      templateSlug: 'la-sombra-del-viento',
      language: 'es',
    });

    expect(envelope.success).toBe(true);
    expect(envelope.result?.title).toBe('La Barcelona de La Sombra del Viento');
    expect(envelope.result?.language).toBe('es');
    expect(mockTranslationService.translateTemplate).not.toHaveBeenCalled();
  });

  it('debe devolver la guía traducida si ya existe en base de datos (Cache Hit en MySQL)', async () => {
    const existingTranslation: LocalizedGuideTemplateDetailDTO = {
      ...baseDetail,
      title: 'The Barcelona of The Shadow of the Wind',
      abstract: 'Literary route in Barcelona',
      language: 'en',
      isTranslated: true,
      items: [
        {
          ...baseDetail.items[0],
          title: 'Sempere Bookshop',
          description: 'Santa Anna Street',
        },
      ],
    };

    vi.mocked(mockRepo.findPublishedByCategoryAndSlugLocalized).mockResolvedValue(existingTranslation);

    const envelope = await useCase.execute({
      categorySlug: 'rutas-literarias',
      templateSlug: 'la-sombra-del-viento',
      language: 'en',
    });

    expect(envelope.success).toBe(true);
    expect(envelope.result?.isTranslated).toBe(true);
    expect(envelope.result?.title).toBe('The Barcelona of The Shadow of the Wind');
    expect(mockTranslationService.translateTemplate).not.toHaveBeenCalled();
    expect(mockRepo.saveTemplateTranslation).not.toHaveBeenCalled();
  });

  it('debe ejecutar el flujo Paciente Cero cuando no existe traducción (Cache Miss)', async () => {
    // Retorna base en castellano con isTranslated = false
    vi.mocked(mockRepo.findPublishedByCategoryAndSlugLocalized).mockResolvedValue({
      ...baseDetail,
      language: 'es',
      isTranslated: false,
    });

    const mockLlmTranslation: LocalizedTemplateTranslation = {
      templateId: 'tmpl-1',
      language: 'fr',
      title: 'La Barcelone de L Ombre du Vent',
      abstract: 'Route littéraire à Barcelone',
      items: [
        {
          itemId: 'item-1',
          title: 'Librairie Sempere',
          description: 'Rue Santa Anna',
        },
      ],
    };

    vi.mocked(mockTranslationService.translateTemplate).mockResolvedValue(mockLlmTranslation);

    const envelope = await useCase.execute({
      categorySlug: 'rutas-literarias',
      templateSlug: 'la-sombra-del-viento',
      language: 'fr',
    });

    expect(envelope.success).toBe(true);
    expect(envelope.result?.language).toBe('fr');
    expect(envelope.result?.title).toBe('La Barcelone de L Ombre du Vent');
    expect(envelope.result?.items[0].title).toBe('Librairie Sempere');
    expect(mockTranslationService.translateTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'tmpl-1' }),
      'fr',
    );
    expect(mockRepo.saveTemplateTranslation).toHaveBeenCalledWith(mockLlmTranslation);
  });

  it('debe aplicar Fail-Soft degradando a castellano si Gemini falla o agota el timeout', async () => {
    vi.mocked(mockRepo.findPublishedByCategoryAndSlugLocalized).mockResolvedValue({
      ...baseDetail,
      language: 'es',
      isTranslated: false,
    });

    vi.mocked(mockTranslationService.translateTemplate).mockRejectedValue(
      new Error('Timeout de 8000ms excedido'),
    );

    const envelope = await useCase.execute({
      categorySlug: 'rutas-literarias',
      templateSlug: 'la-sombra-del-viento',
      language: 'de',
    });

    // Fail-Soft: envelope exitoso con advertencia y contenido en castellano
    expect(envelope.success).toBe(true);
    expect(envelope.result?.title).toBe('La Barcelona de La Sombra del Viento');
    expect(envelope.feedback).toContain('Traducción degradada a castellano por contingencia');
  });

  it('debe devolver un sobre de error 404 si la guía no existe en el catálogo', async () => {
    vi.mocked(mockRepo.findPublishedByCategoryAndSlugLocalized).mockResolvedValue(null);

    const envelope = await useCase.execute({
      categorySlug: 'rutas-literarias',
      templateSlug: 'ruta-inexistente',
      language: 'en',
    });

    expect(envelope.success).toBe(false);
    expect(envelope.exitCode).toBe(404);
  });

  it('debe devolver un sobre de error 400 si los slugs contienen caracteres inválidos', async () => {
    const envelope = await useCase.execute({
      categorySlug: 'slug_invalido',
      templateSlug: 'slug-valido',
    });

    expect(envelope.success).toBe(false);
    expect(envelope.exitCode).toBe(400);
  });
});
