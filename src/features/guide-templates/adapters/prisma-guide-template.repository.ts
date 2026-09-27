import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '@/shared/persistence/prisma';
import { IGuideTemplateRepositoryPort } from '../ports/guide-template-repository.port';
import {
  GuideTemplateDTO,
  GuideTemplateDetailDTO,
  GuideTemplateDetailDTOSchema,
  LocalizedGuideTemplateDetailDTO,
  LocalizedGuideTemplateDetailDTOSchema,
  GuideTemplateDTOSchema,
  TemplateItemDTO,
  TemplateItemDTOSchema,
  CreateGuideTemplateInput,
  CreateGuideTemplateInputSchema,
  CreateTemplateItemInput,
  CreateTemplateItemInputSchema,
} from '../domain/guide-template.schema';
import { SupportedLanguage, LocalizedTemplateTranslation } from '@/features/i18n';

/**
 * Adaptador Prisma para persistencia del catálogo de templates de autor y traducciones satélite.
 * Cumple con Clean Architecture, Pure DI y Fronteras Deterministas (Zod).
 */
export class PrismaGuideTemplateRepository implements IGuideTemplateRepositoryPort {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

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

  public async findPublishedByCategoryAndSlugLocalized(
    categorySlug: string,
    templateSlug: string,
    language: SupportedLanguage,
  ): Promise<LocalizedGuideTemplateDetailDTO | null> {
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
        translations: {
          where: { language },
        },
      },
    });

    if (!template || template.status !== 'PUBLISHED') {
      return null;
    }

    // Si el idioma es castellano (maestro), se sirve directo
    if (language === 'es') {
      return LocalizedGuideTemplateDetailDTOSchema.parse({
        ...template,
        category,
        language: 'es',
        isTranslated: false,
      });
    }

    const translation = template.translations[0];
    if (!translation) {
      // Cache Miss: no existe traducción de cabecera en BD
      return LocalizedGuideTemplateDetailDTOSchema.parse({
        ...template,
        category,
        language: 'es',
        isTranslated: false,
      });
    }

    // Buscamos las traducciones de los items
    const itemIds = template.items.map((i) => i.id);
    const itemTranslations = await this.prisma.templateItemTranslation.findMany({
      where: {
        itemId: { in: itemIds },
        language,
      },
    });

    const itemTransMap = new Map(itemTranslations.map((it) => [it.itemId, it]));

    const localizedItems = template.items.map((item) => {
      const trans = itemTransMap.get(item.id);
      return {
        ...item,
        title: trans?.title ?? item.title,
        description: trans?.description ?? item.description,
      };
    });

    return LocalizedGuideTemplateDetailDTOSchema.parse({
      ...template,
      title: translation.title,
      abstract: translation.abstract,
      items: localizedItems,
      category,
      language,
      isTranslated: true,
    });
  }

  public async saveTemplateTranslation(
    translation: LocalizedTemplateTranslation,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Upsert cabecera de traducción
      await tx.guideTemplateTranslation.upsert({
        where: {
          templateId_language: {
            templateId: translation.templateId,
            language: translation.language,
          },
        },
        update: {
          title: translation.title,
          abstract: translation.abstract,
        },
        create: {
          templateId: translation.templateId,
          language: translation.language,
          title: translation.title,
          abstract: translation.abstract,
        },
      });

      // 2. Upsert traducciones de ítems secuenciales
      for (const item of translation.items) {
        await tx.templateItemTranslation.upsert({
          where: {
            itemId_language: {
              itemId: item.itemId,
              language: translation.language,
            },
          },
          update: {
            title: item.title,
            description: item.description,
          },
          create: {
            itemId: item.itemId,
            language: translation.language,
            title: item.title,
            description: item.description,
          },
        });
      }
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
