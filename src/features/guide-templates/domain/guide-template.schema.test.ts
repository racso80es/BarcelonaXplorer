import { describe, it, expect } from 'vitest';
import {
  TacticalMetadataSchema,
  AffiliateRefSchema,
  AffiliateRefsSchema,
  CreateTemplateCategoryInputSchema,
  CreateGuideTemplateInputSchema,
  CreateTemplateItemInputSchema,
  GuideTemplateDetailDTOSchema,
} from './guide-template.schema';

describe('Guide Template Schemas (Zod)', () => {
  describe('TacticalMetadataSchema', () => {
    it('debe validar metadatos tácticos completos con Escudo Anti-Trampas y Micro-Logística', () => {
      const valid = {
        antiTrapShield: {
          warnings: ['Evita los restaurantes de la Rambla con fotos plastificadas'],
          recommendedAlternatives: ['Camina hacia Carrer de Blai para tapas auténticas'],
        },
        microLogistics: {
          pickpocketAlertLevel: 'HIGH',
          transitTips: 'Cuidado al subir al metro en Drassanes',
          realWalkingTimeMinutes: 15,
        },
        environmentalConditions: {
          rainFriendly: false,
          requiresDaylight: true,
        },
      };

      const parsed = TacticalMetadataSchema.parse(valid);
      expect(parsed.antiTrapShield?.warnings).toHaveLength(1);
      expect(parsed.microLogistics?.pickpocketAlertLevel).toBe('HIGH');
      expect(parsed.environmentalConditions?.rainFriendly).toBe(false);
    });

    it('debe aplicar defaults de arrays vacíos en antiTrapShield si no se especifican', () => {
      const minimal = {
        antiTrapShield: {},
      };
      const parsed = TacticalMetadataSchema.parse(minimal);
      expect(parsed.antiTrapShield?.warnings).toEqual([]);
      expect(parsed.antiTrapShield?.recommendedAlternatives).toEqual([]);
    });

    it('debe rechazar niveles no contemplados de alerta de carteristas', () => {
      const invalid = {
        microLogistics: {
          pickpocketAlertLevel: 'CRITICAL', // No existe en PickpocketAlertLevelEnum
        },
      };
      expect(() => TacticalMetadataSchema.parse(invalid)).toThrow();
    });

    it('debe rechazar propiedades desconocidas por strict()', () => {
      const invalid = {
        hackerProperty: 'inyeccion-desconocida',
      };
      expect(() => TacticalMetadataSchema.parse(invalid)).toThrow();
    });
  });

  describe('AffiliateRefSchema y AffiliateRefsSchema', () => {
    it('debe validar un enlace CPA con Civitatis y placement correcto', () => {
      const ref = {
        provider: 'CIVITATIS',
        externalId: 'civ-bcn-sagrada-familia-tour',
        campaignUrl: 'https://civitatis.com/es/barcelona/tour-sagrada-familia?aid=bx',
        ctaLabel: 'Evita la cola en la Sagrada Família',
        placementTrigger: 'HIGH_QUEUE_MONUMENT',
      };

      const parsed = AffiliateRefSchema.parse(ref);
      expect(parsed.provider).toBe('CIVITATIS');
      expect(parsed.placementTrigger).toBe('HIGH_QUEUE_MONUMENT');
    });

    it('debe rechazar URLs de campaña mal formadas', () => {
      const invalid = {
        provider: 'THE_FORK',
        externalId: 'tf-123',
        campaignUrl: 'no-es-una-url',
        ctaLabel: 'Reserva mesa',
        placementTrigger: 'MEAL_TIME',
      };
      expect(() => AffiliateRefSchema.parse(invalid)).toThrow();
    });

    it('debe validar arrays de referencias de afiliación', () => {
      const list = [
        {
          provider: 'THE_FORK',
          externalId: 'tf-123',
          campaignUrl: 'https://thefork.es/restaurant/123',
          ctaLabel: 'Reserva con 30% descuento',
          placementTrigger: 'MEAL_TIME',
        },
      ];
      const parsed = AffiliateRefsSchema.parse(list);
      expect(parsed).toHaveLength(1);
    });
  });

  describe('Input Schemas de Creación', () => {
    it('debe validar entrada de categoría con defaults', () => {
      const input = {
        slug: 'rutas-cine',
        name: 'Rutas de Cine',
        description: 'Barcelona a través de las grandes producciones cinematográficas.',
      };
      const parsed = CreateTemplateCategoryInputSchema.parse(input);
      expect(parsed.displayOrder).toBe(0);
      expect(parsed.isActive).toBe(true);
    });

    it('debe validar entrada de template con defaults', () => {
      const input = {
        categoryId: 'cat-123',
        slug: 'la-sombra-del-viento',
        title: 'La Barcelona de La Sombra del Viento',
        abstract: 'Ruta literaria por el Raval, Gòtic y Tibidabo tras los pasos de Daniel Sempere.',
        estimatedDuration: 180,
      };
      const parsed = CreateGuideTemplateInputSchema.parse(input);
      expect(parsed.status).toBe('DRAFT');
      expect(parsed.isFeatured).toBe(false);
    });

    it('debe validar entrada de item con coordenadas geográficas de Barcelona', () => {
      const input = {
        templateId: 'tmpl-123',
        orderIndex: 0,
        title: 'Librería Sempere e Hijos (Carrer de Santa Anna)',
        description: 'Punto de inicio místico en pleno barrio gótico.',
        coordinatesLat: 41.3858,
        coordinatesLng: 2.1715,
        approxDurationMin: 20,
      };
      const parsed = CreateTemplateItemInputSchema.parse(input);
      expect(parsed.coordinatesLat).toBe(41.3858);
      expect(parsed.approxDurationMin).toBe(20);
    });
  });

  describe('GuideTemplateDetailDTOSchema', () => {
    it('debe validar un árbol completo de template con categoría e items ordenados', () => {
      const now = new Date();
      const detail = {
        id: 'tmpl-1',
        categoryId: 'cat-1',
        slug: 'la-sombra-del-viento',
        title: 'La Barcelona de La Sombra del Viento',
        abstract: 'Ruta de autor.',
        estimatedDuration: 120,
        status: 'PUBLISHED',
        isFeatured: true,
        createdAt: now,
        updatedAt: now,
        category: {
          id: 'cat-1',
          slug: 'literatura',
          name: 'Literatura',
          description: 'Rutas inspiradas en novelas ambientadas en Barcelona.',
          icon: 'book',
          displayOrder: 1,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        items: [
          {
            id: 'item-1',
            templateId: 'tmpl-1',
            orderIndex: 0,
            title: 'Rambla de Santa Mònica',
            description: 'Encuentro con Carax.',
            coordinatesLat: 41.378,
            coordinatesLng: 2.176,
            approxDurationMin: 25,
            tacticalMetadata: null,
            affiliateRefs: null,
            createdAt: now,
            updatedAt: now,
          },
        ],
      };

      const parsed = GuideTemplateDetailDTOSchema.parse(detail);
      expect(parsed.category.slug).toBe('literatura');
      expect(parsed.items).toHaveLength(1);
    });
  });
});
