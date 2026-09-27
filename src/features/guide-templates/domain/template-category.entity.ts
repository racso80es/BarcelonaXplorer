import { TemplateSlugVO } from './value-objects/template-slug.vo';

export interface TemplateCategoryProps {
  id: string;
  slug: TemplateSlugVO;
  name: string;
  description: string;
  icon?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entidad de Dominio pura para la taxonomía de categorías de templates.
 * Cumple con DDD y aislamiento hexagonal (Clean Architecture).
 */
export class TemplateCategoryEntity {
  private constructor(private readonly props: TemplateCategoryProps) {}

  public static create(params: {
    id: string;
    slug: string | TemplateSlugVO;
    name: string;
    description: string;
    icon?: string | null;
    displayOrder?: number;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }): TemplateCategoryEntity {
    const slugVO = params.slug instanceof TemplateSlugVO ? params.slug : new TemplateSlugVO(params.slug);
    const now = new Date();

    return new TemplateCategoryEntity({
      id: params.id,
      slug: slugVO,
      name: params.name.trim(),
      description: params.description.trim(),
      icon: params.icon ?? null,
      displayOrder: params.displayOrder ?? 0,
      isActive: params.isActive ?? true,
      createdAt: params.createdAt ?? now,
      updatedAt: params.updatedAt ?? now,
    });
  }

  public getId(): string {
    return this.props.id;
  }

  public getSlug(): TemplateSlugVO {
    return this.props.slug;
  }

  public getName(): string {
    return this.props.name;
  }

  public getDescription(): string {
    return this.props.description;
  }

  public getIcon(): string | null {
    return this.props.icon ?? null;
  }

  public getDisplayOrder(): number {
    return this.props.displayOrder;
  }

  public isActive(): boolean {
    return this.props.isActive;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public toJSON() {
    return {
      id: this.props.id,
      slug: this.props.slug.getValue(),
      name: this.props.name,
      description: this.props.description,
      icon: this.props.icon,
      displayOrder: this.props.displayOrder,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
