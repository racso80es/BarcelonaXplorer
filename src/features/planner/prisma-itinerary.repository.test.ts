import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaItineraryRepository } from './prisma-itinerary.repository';
import { EnrichedRoute } from './affiliate/affiliate-enricher.schema';

describe('PrismaItineraryRepository (Protocolo de Acero S+)', () => {
  let mockPrisma: PrismaClient;
  let repo: PrismaItineraryRepository;

  const mockDate = new Date('2026-09-26T12:00:00Z');

  beforeEach(() => {
    mockPrisma = {
      tacticalItinerary: {
        create: vi.fn(),
        findFirst: vi.fn(),
      },
      tacticalItineraryNode: {
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
    } as unknown as PrismaClient;

    repo = new PrismaItineraryRepository(mockPrisma);
  });

  it('debe persistir un itinerario enriquecido con sus nodos en MySQL', async () => {
    const route: EnrichedRoute = {
      id: 'route-test-1',
      summary: 'Día Gourmet y Cultural en Barcelona',
      waypoints: [
        {
          id: 'wp-1',
          title: 'Restaurante 7 Portes',
          description: 'Paellas históricas cerca del Port Vell',
          category: 'GASTRONOMY',
          timeSpan: { start: '13:30', end: '15:00' },
          coordinates: { lat: 41.3825, lng: 2.1833 },
          recommendations: ['Arroz Parellada'],
          affiliateProvider: 'THEFORK',
          affiliateUrl: 'https://www.thefork.es/7portes',
          options: [
            {
              id: 'opt-1-1',
              title: '7 Portes Principal',
              description: 'Mesa interior',
              provider: 'THEFORK',
              isSelected: true,
            },
          ],
        },
      ],
    };

    const mockDbRecord = {
      id: 'itin-uuid-1',
      sessionId: 'sess-123',
      summary: route.summary,
      status: 'ACTIVE',
      createdAt: mockDate,
      updatedAt: mockDate,
      waypoints: [
        {
          id: 'node-uuid-1',
          title: route.waypoints[0].title,
          description: route.waypoints[0].description,
          category: 'GASTRONOMY',
          startTime: '13:30',
          endTime: '15:00',
          orderIndex: 0,
          coordinatesLat: 41.3825,
          coordinatesLng: 2.1833,
          affiliateProvider: 'THEFORK',
          affiliateUrl: 'https://www.thefork.es/7portes',
          isSelected: true,
          options: route.waypoints[0].options,
        },
      ],
    };

    vi.mocked(mockPrisma.tacticalItinerary.create).mockResolvedValue(
      mockDbRecord as unknown as Awaited<ReturnType<typeof mockPrisma.tacticalItinerary.create>>,
    );

    const result = await repo.saveItinerary('sess-123', route);

    expect(mockPrisma.tacticalItinerary.create).toHaveBeenCalledOnce();
    expect(result.id).toBe('itin-uuid-1');
    expect(result.sessionId).toBe('sess-123');
    expect(result.waypoints).toHaveLength(1);
    expect(result.waypoints[0].affiliateProvider).toBe('THEFORK');
  });

  it('debe actualizar la selección de opción en un nodo existente', async () => {
    const mockNode = {
      id: 'node-1',
      affiliateProvider: 'THEFORK',
      affiliateUrl: 'https://www.thefork.es/opt1',
      options: [
        { id: 'opt-1', title: 'Opción 1', provider: 'THEFORK', isSelected: true, description: 'Desc 1' },
        { id: 'opt-2', title: 'Opción 2', provider: 'THEFORK', isSelected: false, description: 'Desc 2', affiliateUrl: 'https://www.thefork.es/opt2' },
      ],
    };

    vi.mocked(mockPrisma.tacticalItineraryNode.findUnique).mockResolvedValue(
      mockNode as unknown as Awaited<ReturnType<typeof mockPrisma.tacticalItineraryNode.findUnique>>,
    );
    vi.mocked(mockPrisma.tacticalItineraryNode.update).mockResolvedValue(
      mockNode as unknown as Awaited<ReturnType<typeof mockPrisma.tacticalItineraryNode.update>>,
    );

    const updated = await repo.updateNodeSelection('node-1', 'opt-2');

    expect(updated).toBe(true);
    expect(mockPrisma.tacticalItineraryNode.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'node-1' },
        data: expect.objectContaining({
          affiliateUrl: 'https://www.thefork.es/opt2',
        }),
      }),
    );
  });

  it('debe actualizar los tiempos de un nodo atómicamente', async () => {
    vi.mocked(mockPrisma.tacticalItineraryNode.updateMany).mockResolvedValue({ count: 1 });

    const updated = await repo.updateNodeTime('node-1', '14:00', '15:30');

    expect(updated).toBe(true);
    expect(mockPrisma.tacticalItineraryNode.updateMany).toHaveBeenCalledWith({
      where: { id: 'node-1' },
      data: { startTime: '14:00', endTime: '15:30' },
    });
  });
});
