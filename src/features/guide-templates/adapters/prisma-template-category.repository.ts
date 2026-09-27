import { PrismaClient } from '@prisma/client';
import { ITemplateCategoryRepositoryPort } from '../ports/template-category-repository.port';
import { TemplateCategoryEntity } from '../domain/template-category.entity';
import {
  CreateTemplateCategoryInput,
  CreateTemplateCategoryInputSchema,
} from '../domain/guide-template.schema';

/**
 * Adaptador Prisma para persistencia de categorías de templates.
 * Cumple con Clean Architecture y Pure DI.
 */
export class PrismaTemplateCategoryRepository implements ITemplateCategoryRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  public async findBySlug(slug: string): Promise<TemplateCategoryEntity | null> {
    const record = await this.prisma.templateCategory.findUnique({
      where: { slug },
    });
    if (!record) {
      return null;
    }
    return TemplateCategoryEntity.create(record);
  }

  public async findById(id: string): Promise<TemplateCategoryEntity | null> {
    const record = await this.prisma.templateCategory.findUnique({
      where: { id },
    });
    if (!record) {
      return null;
    }
    return TemplateCategoryEntity.create(record);
  }

  public async findActiveCategories(): Promise<TemplateCategoryEntity[]> {
    const records = await this.prisma.templateCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    return records.map((record) => TemplateCategoryEntity.create(record));
  }

  public async create(data: CreateTemplateCategoryInput): Promise<TemplateCategoryEntity> {
    const validated = CreateTemplateCategoryInputSchema.parse(data);
    const created = await this.prisma.templateCategory.create({
      data: {
        slug: validated.slug,
        name: validated.name,
        description: validated.description,
        icon: validated.icon ?? null,
        displayOrder: validated.displayOrder,
        isActive: validated.isActive,
      },
    });
    return TemplateCategoryEntity.create(created);
  }
}
