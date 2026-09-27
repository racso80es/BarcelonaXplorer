import { PrismaClient } from '@prisma/client';
import { IGuideTemplateRepositoryPort } from '../ports/guide-template-repository.port';
import {
  GuideTemplateDTO,
  GuideTemplateDetailDTO,
  GuideTemplateDetailDTOSchema,
  GuideTemplateDTOSchema,
  TemplateItemDTO,
  TemplateItemDTOSchema,
  CreateGuideTemplateInput,
  CreateGuideTemplateInputSchema,
  CreateTemplateItemInput,
  CreateTemplateItemInputSchema,
} from '../domain/guide-template.schema';

/**
 * Adaptador Prisma para persistencia del catálogo de templates de autor.
 * Cumple con Clean Architecture, Pure DI y Fronteras Deterministas (Zod).
 */
export class PrismaGuideTemplateRepository implements IGuideTemplateRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  public async findPublishedByCategoryAndSlug(
    categorySlug: string,
    templateSlug: string,
  ): Promise<GuideTemplateDetailDTO | null> {
    const category = await this.prisma.templateCategory.findUnique({
      where: { slug: categorySlug },
    });
    if (!category || !category.isActive) {
      return null;
    }

    const template = await this.prisma.guideTemplate.findUnique({
      where: {
        categoryId_slug: {
          categoryId: category.id,
          slug: templateSlug,
        },
      },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!template || template.status !== 'PUBLISHED') {
      return null;
    }

    return GuideTemplateDetailDTOSchema.parse({
      ...template,
      category,
    });
  }

  public async findById(id: string): Promise<GuideTemplateDetailDTO | null> {
    const template = await this.prisma.guideTemplate.findUnique({
      where: { id },
      include: {
        category: true,
        items: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    if (!template) {
      return null;
    }
    return GuideTemplateDetailDTOSchema.parse(template);
  }

  public async listPublishedByCategory(categorySlug: string): Promise<GuideTemplateDTO[]> {
    const category = await this.prisma.templateCategory.findUnique({
      where: { slug: categorySlug },
    });
    if (!category || !category.isActive) {
      return [];
    }

    const templates = await this.prisma.guideTemplate.findMany({
      where: {
        categoryId: category.id,
        status: 'PUBLISHED',
      },
      orderBy: { createdAt: 'desc' },
    });

    return templates.map((tmpl) => GuideTemplateDTOSchema.parse(tmpl));
  }

  public async create(data: CreateGuideTemplateInput): Promise<GuideTemplateDTO> {
    const validated = CreateGuideTemplateInputSchema.parse(data);
    const created = await this.prisma.guideTemplate.create({
      data: {
        categoryId: validated.categoryId,
        slug: validated.slug,
        title: validated.title,
        abstract: validated.abstract,
        estimatedDuration: validated.estimatedDuration,
        status: validated.status,
        isFeatured: validated.isFeatured,
      },
    });
    return GuideTemplateDTOSchema.parse(created);
  }

  public async createItem(data: CreateTemplateItemInput): Promise<TemplateItemDTO> {
    const validated = CreateTemplateItemInputSchema.parse(data);
    const created = await this.prisma.templateItem.create({
      data: {
        templateId: validated.templateId,
        orderIndex: validated.orderIndex,
        title: validated.title,
        description: validated.description,
        coordinatesLat: validated.coordinatesLat ?? null,
        coordinatesLng: validated.coordinatesLng ?? null,
        approxDurationMin: validated.approxDurationMin,
        tacticalMetadata: validated.tacticalMetadata ?? undefined,
        affiliateRefs: validated.affiliateRefs ?? undefined,
      },
    });
    return TemplateItemDTOSchema.parse(created);
  }
}
