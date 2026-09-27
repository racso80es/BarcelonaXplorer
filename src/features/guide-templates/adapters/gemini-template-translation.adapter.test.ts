import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiTemplateTranslationAdapter } from './gemini-template-translation.adapter';
import { GuideTemplateDetailDTO } from '../domain/guide-template.schema';
import { GoogleGenAI } from '@google/genai';

describe('GeminiTemplateTranslationAdapter (SingleFlight & Timeout S+ Grade)', () => {
  let mockGenAI: GoogleGenAI;
  let mockGenerateContent: ReturnType<typeof vi.fn>;

  const mockDate = new Date('2026-09-27T10:00:00Z');

  const sampleTemplate: GuideTemplateDetailDTO = {
    id: 'tmpl-100',
    categoryId: 'cat-1',
    slug: 'gothic-quarter',
    title: 'Gòtic Històric',
    abstract: 'Passeig pel barri gòtic',
    estimatedDuration: 120,
    status: 'PUBLISHED',
    isFeatured: true,
    createdAt: mockDate,
    updatedAt: mockDate,
    category: {
      id: 'cat-1',
      slug: 'historia',
      name: 'Història',
      description: 'Descripció',
      icon: null,
      displayOrder: 1,
      isActive: true,
      createdAt: mockDate,
      updatedAt: mockDate,
    },
    items: [
      {
        id: 'item-101',
        templateId: 'tmpl-100',
        orderIndex: 0,
        title: 'Catedral de Barcelona',
        description: 'Façana gòtica',
        coordinatesLat: 41.383,
        coordinatesLng: 2.176,
        approxDurationMin: 30,
        tacticalMetadata: null,
        affiliateRefs: null,
        createdAt: mockDate,
        updatedAt: mockDate,
      },
    ],
  };

  beforeEach(() => {
    mockGenerateContent = vi.fn();
    mockGenAI = {
      models: {
        generateContent: mockGenerateContent,
      },
    } as unknown as GoogleGenAI;
  });

  it('debe traducir con éxito un template devolviendo el esquema estructurado', async () => {
    const mockApiResponse = {
      templateId: 'tmpl-100',
      language: 'en',
      title: 'Historical Gothic Quarter',
      abstract: 'Walk through the gothic quarter',
      items: [
        {
          itemId: 'item-101',
          title: 'Barcelona Cathedral',
          description: 'Gothic facade',
        },
      ],
    };

    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(mockApiResponse),
    });

    const adapter = new GeminiTemplateTranslationAdapter(mockGenAI, undefined, {
      timeoutMs: 3000,
    });

    const result = await adapter.translateTemplate(sampleTemplate, 'en');

    expect(result.templateId).toBe('tmpl-100');
    expect(result.language).toBe('en');
    expect(result.title).toBe('Historical Gothic Quarter');
    expect(result.items[0].title).toBe('Barcelona Cathedral');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('debe aplicar SingleFlight deduplicando llamadas concurrentes para el mismo template e idioma', async () => {
    const mockApiResponse = {
      templateId: 'tmpl-100',
      language: 'fr',
      title: 'Quartier Gothique Historique',
      abstract: 'Promenade dans le quartier gothique',
      items: [
        {
          itemId: 'item-101',
          title: 'Cathédrale de Barcelone',
          description: 'Façade gothique',
        },
      ],
    };

    mockGenerateContent.mockImplementation(async () => {
      // Retardo simulado de inferencia
      await new Promise((r) => setTimeout(r, 50));
      return {
        text: JSON.stringify(mockApiResponse),
      };
    });

    const adapter = new GeminiTemplateTranslationAdapter(mockGenAI, undefined, {
      timeoutMs: 3000,
    });

    // Disparamos 3 llamadas concurrentes para el mismo template e idioma
    const [res1, res2, res3] = await Promise.all([
      adapter.translateTemplate(sampleTemplate, 'fr'),
      adapter.translateTemplate(sampleTemplate, 'fr'),
      adapter.translateTemplate(sampleTemplate, 'fr'),
    ]);

    expect(res1.title).toBe('Quartier Gothique Historique');
    expect(res2.title).toBe('Quartier Gothique Historique');
    expect(res3.title).toBe('Quartier Gothique Historique');

    // SingleFlight: generateContent solo debe haberse invocado 1 VEZ
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('debe abortar con error si se excede el timeout configurado', async () => {
    mockGenerateContent.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 200));
      return { text: '{}' };
    });

    const adapter = new GeminiTemplateTranslationAdapter(mockGenAI, undefined, {
      timeoutMs: 50, // Timeout muy corto para provocar la condición de carrera
    });

    await expect(adapter.translateTemplate(sampleTemplate, 'de')).rejects.toThrow(
      /Timeout de 50ms excedido/,
    );
  });
});
