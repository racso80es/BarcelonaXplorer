import { TemplateSlugVO } from './value-objects/template-slug.vo';
import {
  TacticalMetadata,
  AffiliateRefs,
  TemplateStatus,
  TacticalMetadataSchema,
  AffiliateRefsSchema,
} from './guide-template.schema';

export interface TemplateItemProps {
  id: string;
  templateId: string;
  orderIndex: number;
  title: string;
  description: string;
  coordinatesLat?: number | null;
  coordinatesLng?: number | null;
  approxDurationMin: number;
  tacticalMetadata?: TacticalMetadata | null;
  affiliateRefs?: AffiliateRefs | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entidad de Dominio para los nodos secuenciales de una guía curada.
 */
export class TemplateItemEntity {
  private constructor(private readonly props: TemplateItemProps) {}

  public static create(params: {
    id: string;
    templateId: string;
    orderIndex: number;
    title: string;
    description: string;
    coordinatesLat?: number | null;
    coordinatesLng?: number | null;
    approxDurationMin?: number;
    tacticalMetadata?: TacticalMetadata | null;
    affiliateRefs?: AffiliateRefs | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): TemplateItemEntity {
    const validatedTactical = params.tacticalMetadata
      ? TacticalMetadataSchema.parse(params.tacticalMetadata)
      : null;
    const validatedAffiliates = params.affiliateRefs
      ? AffiliateRefsSchema.parse(params.affiliateRefs)
      : null;
    const now = new Date();

    return new TemplateItemEntity({
      id: params.id,
      templateId: params.templateId,
      orderIndex: params.orderIndex,
      title: params.title.trim(),
      description: params.description.trim(),
      coordinatesLat: params.coordinatesLat ?? null,
      coordinatesLng: params.coordinatesLng ?? null,
      approxDurationMin: params.approxDurationMin ?? 30,
      tacticalMetadata: validatedTactical,
      affiliateRefs: validatedAffiliates,
      createdAt: params.createdAt ?? now,
      updatedAt: params.updatedAt ?? now,
    });
  }

  public getId(): string {
    return this.props.id;
  }

  public getTemplateId(): string {
    return this.props.templateId;
  }

  public getOrderIndex(): number {
    return this.props.orderIndex;
  }

  public getTitle(): string {
    return this.props.title;
  }

  public getDescription(): string {
    return this.props.description;
  }

  public getCoordinatesLat(): number | null {
    return this.props.coordinatesLat ?? null;
  }

  public getCoordinatesLng(): number | null {
    return this.props.coordinatesLng ?? null;
  }

  public getApproxDurationMin(): number {
    return this.props.approxDurationMin;
  }

  public getTacticalMetadata(): TacticalMetadata | null {
    return this.props.tacticalMetadata ?? null;
  }

  public getAffiliateRefs(): AffiliateRefs | null {
    return this.props.affiliateRefs ?? null;
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
      templateId: this.props.templateId,
      orderIndex: this.props.orderIndex,
      title: this.props.title,
      description: this.props.description,
      coordinatesLat: this.props.coordinatesLat,
      coordinatesLng: this.props.coordinatesLng,
      approxDurationMin: this.props.approxDurationMin,
      tacticalMetadata: this.props.tacticalMetadata,
      affiliateRefs: this.props.affiliateRefs,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}

export interface GuideTemplateProps {
  id: string;
  categoryId: string;
  slug: TemplateSlugVO;
  title: string;
  abstract: string;
  estimatedDuration: number;
  status: TemplateStatus;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: TemplateItemEntity[];
}

/**
 * Entidad de Dominio pura para la cabecera de la guía curada.
 */
export class GuideTemplateEntity {
  private constructor(private readonly props: GuideTemplateProps) {}

  public static create(params: {
    id: string;
    categoryId: string;
    slug: string | TemplateSlugVO;
    title: string;
    abstract: string;
    estimatedDuration: number;
    status?: TemplateStatus;
    isFeatured?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    items?: TemplateItemEntity[];
  }): GuideTemplateEntity {
    const slugVO = params.slug instanceof TemplateSlugVO ? params.slug : new TemplateSlugVO(params.slug);
    const now = new Date();

    return new GuideTemplateEntity({
      id: params.id,
      categoryId: params.categoryId,
      slug: slugVO,
      title: params.title.trim(),
      abstract: params.abstract.trim(),
      estimatedDuration: params.estimatedDuration,
      status: params.status ?? 'DRAFT',
      isFeatured: params.isFeatured ?? false,
      createdAt: params.createdAt ?? now,
      updatedAt: params.updatedAt ?? now,
      items: params.items ?? [],
    });
  }

  public getId(): string {
    return this.props.id;
  }

  public getCategoryId(): string {
    return this.props.categoryId;
  }

  public getSlug(): TemplateSlugVO {
    return this.props.slug;
  }

  public getTitle(): string {
    return this.props.title;
  }

  public getAbstract(): string {
    return this.props.abstract;
  }

  public getEstimatedDuration(): number {
    return this.props.estimatedDuration;
  }

  public getStatus(): TemplateStatus {
    return this.props.status;
  }

  public isFeatured(): boolean {
    return this.props.isFeatured;
  }

  public isPublished(): boolean {
    return this.props.status === 'PUBLISHED';
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public getItems(): TemplateItemEntity[] {
    return [...this.props.items];
  }

  public toJSON() {
    return {
      id: this.props.id,
      categoryId: this.props.categoryId,
      slug: this.props.slug.getValue(),
      title: this.props.title,
      abstract: this.props.abstract,
      estimatedDuration: this.props.estimatedDuration,
      status: this.props.status,
      isFeatured: this.props.isFeatured,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      items: this.props.items.map((item) => item.toJSON()),
    };
  }
}
