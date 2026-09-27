import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaGuideTemplateRepository } from './prisma-guide-template.repository';
import { PrismaTemplateCategoryRepository } from './prisma-template-category.repository';

describe('Prisma Adapters for Guide Templates (Protocolo de Acero S+)', () => {
  let mockPrisma: PrismaClient;
  let templateRepo: PrismaGuideTemplateRepository;
  let categoryRepo: PrismaTemplateCategoryRepository;

  const mockDate = new Date('2026-09-27T10:00:00Z');

  beforeEach(() => {
    mockPrisma = {
      templateCategory: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
      guideTemplate: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
      templateItem: {
        create: vi.fn(),
      },
    } as unknown as PrismaClient;

    templateRepo = new PrismaGuideTemplateRepository(mockPrisma);
    categoryRepo = new PrismaTemplateCategoryRepository(mockPrisma);
  });

  describe('PrismaTemplateCategoryRepository', () => {
    it('debe buscar una categoría por slug y mapearla a TemplateCategoryEntity', async () => {
      const mockCategory = {
        id: 'cat-1',
        slug: 'rutas-literarias',
        name: 'Literatura y Ficción',
        description: 'Barcelona contada por grandes autores',
        icon: 'book',
        displayOrder: 1,
        isActive: true,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      vi.mocked(mockPrisma.templateCategory.findUnique).mockResolvedValue(mockCategory as never);

      const result = await categoryRepo.findBySlug('rutas-literarias');

      expect(mockPrisma.templateCategory.findUnique).toHaveBeenCalledWith({
        where: { slug: 'rutas-literarias' },
      });
      expect(result).not.toBeNull();
      expect(result?.getId()).toBe('cat-1');
      expect(result?.getSlug().getValue()).toBe('rutas-literarias');
      expect(result?.getName()).toBe('Literatura y Ficción');
    });

    it('debe retornar null si la categoría no existe', async () => {
      vi.mocked(mockPrisma.templateCategory.findUnique).mockResolvedValue(null);

      const result = await categoryRepo.findBySlug('inexistente');
      expect(result).toBeNull();
    });

    it('debe listar categorías activas ordenadas por displayOrder', async () => {
      vi.mocked(mockPrisma.templateCategory.findMany).mockResolvedValue([
        {
          id: 'cat-1',
          slug: 'arquitectura',
          name: 'Arquitectura',
          description: 'Modernismo y Gótico',
          icon: null,
          displayOrder: 0,
          isActive: true,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ] as never);

      const list = await categoryRepo.findActiveCategories();
      expect(list).toHaveLength(1);
      expect(list[0].getSlug().getValue()).toBe('arquitectura');
    });

    it('debe crear una categoría nueva persistida en MySQL', async () => {
      const input = {
        slug: 'rutas-de-cine',
        name: 'Rutas de Cine',
        description: 'Escenarios cinematográficos en Barcelona',
        displayOrder: 2,
        isActive: true,
      };

      vi.mocked(mockPrisma.templateCategory.create).mockResolvedValue({
        id: 'cat-cine',
        slug: input.slug,
        name: input.name,
        description: input.description,
        icon: null,
        displayOrder: input.displayOrder,
        isActive: input.isActive,
        createdAt: mockDate,
        updatedAt: mockDate,
      } as never);

      const created = await categoryRepo.create(input);
      expect(created.getId()).toBe('cat-cine');
      expect(created.getSlug().getValue()).toBe('rutas-de-cine');
    });
  });

  describe('PrismaGuideTemplateRepository', () => {
    it('debe recuperar un template publicado por slugs compuestos (categoría + template)', async () => {
      const mockCategory = {
        id: 'cat-lit',
        slug: 'rutas-literarias',
        name: 'Literatura',
        description: 'Desc',
        icon: null,
        displayOrder: 1,
        isActive: true,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      const mockTemplate = {
        id: 'tmpl-sombra',
        categoryId: 'cat-lit',
        slug: 'la-sombra-del-viento',
        title: 'La Barcelona de La Sombra del Viento',
        abstract: 'Ruta inolvidable',
        estimatedDuration: 180,
        status: 'PUBLISHED',
        isFeatured: true,
        createdAt: mockDate,
        updatedAt: mockDate,
        items: [
          {
            id: 'item-1',
            templateId: 'tmpl-sombra',
            orderIndex: 0,
            title: 'Librería Sempere',
            description: 'Inicio',
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

      vi.mocked(mockPrisma.templateCategory.findUnique).mockResolvedValue(mockCategory as never);
      vi.mocked(mockPrisma.guideTemplate.findUnique).mockResolvedValue(mockTemplate as never);

      const result = await templateRepo.findPublishedByCategoryAndSlug(
        'rutas-literarias',
        'la-sombra-del-viento',
      );

      expect(result).not.toBeNull();
      expect(result?.title).toBe('La Barcelona de La Sombra del Viento');
      expect(result?.category.slug).toBe('rutas-literarias');
      expect(result?.items).toHaveLength(1);
      expect(result?.items[0].title).toBe('Librería Sempere');
      expect(mockPrisma.guideTemplate.findUnique).toHaveBeenCalledWith({
        where: {
          categoryId_slug: {
            categoryId: 'cat-lit',
            slug: 'la-sombra-del-viento',
          },
        },
        include: {
          items: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      });
    });

    it('debe devolver null si el template no está en estado PUBLISHED', async () => {
      const mockCategory = {
        id: 'cat-lit',
        slug: 'rutas-literarias',
        isActive: true,
      };

      const mockTemplate = {
        id: 'tmpl-draft',
        categoryId: 'cat-lit',
        slug: 'ruta-borrador',
        title: 'Borrador',
        status: 'DRAFT', // No publicado
      };

      vi.mocked(mockPrisma.templateCategory.findUnique).mockResolvedValue(mockCategory as never);
      vi.mocked(mockPrisma.guideTemplate.findUnique).mockResolvedValue(mockTemplate as never);

      const result = await templateRepo.findPublishedByCategoryAndSlug(
        'rutas-literarias',
        'ruta-borrador',
      );
      expect(result).toBeNull();
    });

    it('debe crear un nuevo GuideTemplate', async () => {
      const input = {
        categoryId: 'cat-lit',
        slug: 'catedral-del-mar',
        title: 'La Catedral del Mar',
        abstract: 'Ruta medieval por Santa María del Mar',
        estimatedDuration: 120,
      };

      vi.mocked(mockPrisma.guideTemplate.create).mockResolvedValue({
        id: 'tmpl-mar',
        categoryId: input.categoryId,
        slug: input.slug,
        title: input.title,
        abstract: input.abstract,
        estimatedDuration: input.estimatedDuration,
        status: 'DRAFT',
        isFeatured: false,
        createdAt: mockDate,
        updatedAt: mockDate,
      } as never);

      const created = await templateRepo.create(input);
      expect(created.id).toBe('tmpl-mar');
      expect(created.slug).toBe('catedral-del-mar');
    });

    it('debe crear un TemplateItem con metadata táctica', async () => {
      const itemInput = {
        templateId: 'tmpl-mar',
        orderIndex: 0,
        title: 'Basílica de Santa María del Mar',
        description: 'La iglesia de los bastaixos',
        coordinatesLat: 41.3836,
        coordinatesLng: 2.1821,
        approxDurationMin: 45,
        tacticalMetadata: {
          antiTrapShield: {
            warnings: ['Cuidado con guías no acreditados en la puerta'],
            recommendedAlternatives: [],
          },
        },
      };

      vi.mocked(mockPrisma.templateItem.create).mockResolvedValue({
        id: 'item-mar-1',
        templateId: itemInput.templateId,
        orderIndex: itemInput.orderIndex,
        title: itemInput.title,
        description: itemInput.description,
        coordinatesLat: itemInput.coordinatesLat,
        coordinatesLng: itemInput.coordinatesLng,
        approxDurationMin: itemInput.approxDurationMin,
        tacticalMetadata: itemInput.tacticalMetadata,
        affiliateRefs: null,
        createdAt: mockDate,
        updatedAt: mockDate,
      } as never);

      const created = await templateRepo.createItem(itemInput);
      expect(created.id).toBe('item-mar-1');
      expect(created.title).toBe('Basílica de Santa María del Mar');
      expect(created.coordinatesLat).toBe(41.3836);
    });
  });
});
