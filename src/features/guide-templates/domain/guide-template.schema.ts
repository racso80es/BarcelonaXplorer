import { z } from 'zod';

/**
 * ============================================================================
 * ESQUEMAS DETERMINISTAS ZOD: SABIDURÍA HIPERLOCAL Y AFILIACIÓN ASIMÉTRICA
 * ============================================================================
 */

export const PickpocketAlertLevelEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'EXTREME']);
export type PickpocketAlertLevel = z.infer<typeof PickpocketAlertLevelEnum>;

export const TacticalMetadataSchema = z
  .object({
    antiTrapShield: z
      .object({
        warnings: z.array(z.string().max(250)).default([]),
        recommendedAlternatives: z.array(z.string().max(250)).default([]),
      })
      .optional(),
    microLogistics: z
      .object({
        pickpocketAlertLevel: PickpocketAlertLevelEnum.default('LOW'),
        transitTips: z.string().max(300).optional(),
        realWalkingTimeMinutes: z.number().int().nonnegative().optional(),
      })
      .optional(),
    environmentalConditions: z
      .object({
        rainFriendly: z.boolean().default(true),
        requiresDaylight: z.boolean().default(false),
      })
      .optional(),
  })
  .strict();

export type TacticalMetadata = z.infer<typeof TacticalMetadataSchema>;

export const AffiliateProviderEnum = z.enum([
  'THE_FORK',
  'CIVITATIS',
  'TIQETS',
  'CABIFY',
  'FREE_NOW',
]);
export type AffiliateProvider = z.infer<typeof AffiliateProviderEnum>;

export const PlacementTriggerEnum = z.enum([
  'POST_WARNING',
  'ROUTE_END',
  'HIGH_QUEUE_MONUMENT',
  'MEAL_TIME',
]);
export type PlacementTrigger = z.infer<typeof PlacementTriggerEnum>;

export const AffiliateRefSchema = z
  .object({
    provider: AffiliateProviderEnum,
    externalId: z.string().max(64),
    campaignUrl: z.string().url().max(512),
    ctaLabel: z.string().max(60),
    placementTrigger: PlacementTriggerEnum,
  })
  .strict();

export type AffiliateRef = z.infer<typeof AffiliateRefSchema>;
export const AffiliateRefsSchema = z.array(AffiliateRefSchema);
export type AffiliateRefs = z.infer<typeof AffiliateRefsSchema>;

/**
 * ============================================================================
 * ESTADO EDITORIAL Y DTOs DE TRANSFERENCIA
 * ============================================================================
 */

export const TemplateStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export type TemplateStatus = z.infer<typeof TemplateStatusEnum>;

export const TemplateCategoryDTOSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string().nullable().optional(),
  displayOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type TemplateCategoryDTO = z.infer<typeof TemplateCategoryDTOSchema>;

export const TemplateItemDTOSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  orderIndex: z.number().int(),
  title: z.string(),
  description: z.string(),
  coordinatesLat: z.number().nullable().optional(),
  coordinatesLng: z.number().nullable().optional(),
  approxDurationMin: z.number().int(),
  tacticalMetadata: TacticalMetadataSchema.nullable().optional(),
  affiliateRefs: AffiliateRefsSchema.nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type TemplateItemDTO = z.infer<typeof TemplateItemDTOSchema>;

export const GuideTemplateDTOSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  slug: z.string(),
  title: z.string(),
  abstract: z.string(),
  estimatedDuration: z.number().int(),
  status: TemplateStatusEnum,
  isFeatured: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type GuideTemplateDTO = z.infer<typeof GuideTemplateDTOSchema>;

export const GuideTemplateDetailDTOSchema = GuideTemplateDTOSchema.extend({
  category: TemplateCategoryDTOSchema,
  items: z.array(TemplateItemDTOSchema),
});
export type GuideTemplateDetailDTO = z.infer<typeof GuideTemplateDetailDTOSchema>;

/**
 * ============================================================================
 * ESQUEMAS DE ENTRADA (ADMINISTRACIÓN Y MUTACIONES)
 * ============================================================================
 */

export const CreateTemplateCategoryInputSchema = z.object({
  slug: z.string().min(2).max(64),
  name: z.string().min(2).max(128),
  description: z.string().min(10),
  icon: z.string().max(64).optional(),
  displayOrder: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});
export type CreateTemplateCategoryInput = z.infer<typeof CreateTemplateCategoryInputSchema>;

export const CreateGuideTemplateInputSchema = z.object({
  categoryId: z.string(),
  slug: z.string().min(2).max(96),
  title: z.string().min(3).max(255),
  abstract: z.string().min(10),
  estimatedDuration: z.number().int().positive(),
  status: TemplateStatusEnum.default('DRAFT'),
  isFeatured: z.boolean().default(false),
});
export type CreateGuideTemplateInput = z.infer<typeof CreateGuideTemplateInputSchema>;

export const CreateTemplateItemInputSchema = z.object({
  templateId: z.string(),
  orderIndex: z.number().int().nonnegative(),
  title: z.string().min(3).max(255),
  description: z.string().min(10),
  coordinatesLat: z.number().min(-90).max(90).optional(),
  coordinatesLng: z.number().min(-180).max(180).optional(),
  approxDurationMin: z.number().int().positive().default(30),
  tacticalMetadata: TacticalMetadataSchema.optional(),
  affiliateRefs: AffiliateRefsSchema.optional(),
});
export type CreateTemplateItemInput = z.infer<typeof CreateTemplateItemInputSchema>;
