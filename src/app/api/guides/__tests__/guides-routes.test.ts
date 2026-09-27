import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getCategoriesRoute } from '../categories/route';
import { GET as getTemplateBySlugRoute } from '../[categorySlug]/[templateSlug]/route';
import { prisma } from '@/shared/persistence/prisma';

vi.mock('@/shared/persistence/prisma', () => ({
  prisma: {
    templateCategory: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    guideTemplate: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Guides API Routes Handlers (Next.js App Router)', () => {
  const mockDate = new Date('2026-09-27T10:00:00Z');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/guides/categories', () => {
    it('debe devolver 200 con listado de categorías activas y encabezado de caché', async () => {
      vi.mocked(prisma.templateCategory.findMany).mockResolvedValue([
        {
          id: 'cat-1',
          slug: 'rutas-literarias',
          name: 'Literatura',
          description: 'Desc',
          icon: 'book',
          displayOrder: 0,
          isActive: true,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ] as never);

      const response = await getCategoriesRoute();
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toContain('public');

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.result).toHaveLength(1);
      expect(data.result[0].slug).toBe('rutas-literarias');
    });
  });

  describe('GET /api/guides/[categorySlug]/[templateSlug]', () => {
    it('debe devolver 200 con el detalle del template si está publicado', async () => {
      const mockCategory = {
        id: 'cat-1',
        slug: 'rutas-literarias',
        name: 'Literatura',
        description: 'Desc',
        icon: null,
        displayOrder: 0,
        isActive: true,
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      const mockTemplate = {
        id: 'tmpl-1',
        categoryId: 'cat-1',
        slug: 'la-sombra-del-viento',
        title: 'La Barcelona de La Sombra del Viento',
        abstract: 'Ruta literaria',
        estimatedDuration: 180,
        status: 'PUBLISHED',
        isFeatured: true,
        createdAt: mockDate,
        updatedAt: mockDate,
        items: [
          {
            id: 'item-1',
            templateId: 'tmpl-1',
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

      vi.mocked(prisma.templateCategory.findUnique).mockResolvedValue(mockCategory as never);
      vi.mocked(prisma.guideTemplate.findUnique).mockResolvedValue(mockTemplate as never);

      const request = new Request('http://localhost:3000/api/guides/rutas-literarias/la-sombra-del-viento');
      const context = {
        params: Promise.resolve({
          categorySlug: 'rutas-literarias',
          templateSlug: 'la-sombra-del-viento',
        }),
      };

      const response = await getTemplateBySlugRoute(request, context);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.result.title).toBe('La Barcelona de La Sombra del Viento');
      expect(data.result.items).toHaveLength(1);
    });

    it('debe devolver 404 si la categoría o template no existe o no está publicado', async () => {
      vi.mocked(prisma.templateCategory.findUnique).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/guides/inexistente/no-existe');
      const context = {
        params: Promise.resolve({
          categorySlug: 'inexistente',
          templateSlug: 'no-existe',
        }),
      };

      const response = await getTemplateBySlugRoute(request, context);
      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.exitCode).toBe(404);
    });

    it('debe devolver 400 si los slugs contienen caracteres no permitidos', async () => {
      const request = new Request('http://localhost:3000/api/guides/mal_formado/valido');
      const context = {
        params: Promise.resolve({
          categorySlug: 'mal_formado',
          templateSlug: 'valido',
        }),
      };

      const response = await getTemplateBySlugRoute(request, context);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.exitCode).toBe(400);
    });
  });
});
