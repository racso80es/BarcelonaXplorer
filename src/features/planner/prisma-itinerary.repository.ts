import { PrismaClient, Prisma } from '@prisma/client';
import { ItineraryPersistencePort, PersistedItineraryDto } from './itinerary-persistence.port';
import {
  AffiliateProvider,
  EnrichedRoute,
  EnrichedWaypoint,
  EnrichedWaypointSchema,
  WaypointOption,
  WaypointOptionSchema,
} from './affiliate/affiliate-enricher.schema';

const globalForPrisma = globalThis as unknown as {
  prismaItineraryClient?: PrismaClient;
};

const defaultPrisma = globalForPrisma.prismaItineraryClient ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaItineraryClient = defaultPrisma;
}

export class PrismaItineraryRepository implements ItineraryPersistencePort {
  private readonly prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? defaultPrisma;
  }

  async saveItinerary(
    sessionId: string,
    route: EnrichedRoute,
  ): Promise<PersistedItineraryDto> {
    const created = await this.prisma.tacticalItinerary.create({
      data: {
        sessionId,
        summary: route.summary,
        status: 'ACTIVE',
        waypoints: {
          create: route.waypoints.map((wp, index) => ({
            title: wp.title,
            description: wp.description,
            category: wp.category,
            startTime: wp.timeSpan?.start ?? '10:00',
            endTime: wp.timeSpan?.end ?? null,
            orderIndex: index,
            coordinatesLat: wp.coordinates?.lat ?? null,
            coordinatesLng: wp.coordinates?.lng ?? null,
            affiliateProvider: wp.affiliateProvider,
            affiliateUrl: wp.affiliateUrl ?? null,
            isSelected: true,
            options: wp.options as unknown as Prisma.InputJsonValue,
          })),
        },
      },
      include: {
        waypoints: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return this.mapToDto(created);
  }

  async getItineraryBySessionId(
    sessionId: string,
  ): Promise<PersistedItineraryDto | null> {
    const found = await this.prisma.tacticalItinerary.findFirst({
      where: { sessionId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: {
        waypoints: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!found) {
      return null;
    }

    return this.mapToDto(found);
  }

  async updateNodeSelection(nodeId: string, optionId: string): Promise<boolean> {
    const node = await this.prisma.tacticalItineraryNode.findUnique({
      where: { id: nodeId },
    });

    if (!node || !node.options || !Array.isArray(node.options)) {
      return false;
    }

    const rawOptions = node.options as unknown[];
    const parsedOptions: WaypointOption[] = [];

    for (const opt of rawOptions) {
      const parsed = WaypointOptionSchema.safeParse(opt);
      if (parsed.success) {
        parsedOptions.push({
          ...parsed.data,
          isSelected: parsed.data.id === optionId,
        });
      }
    }

    const selectedOption = parsedOptions.find((o) => o.isSelected);

    await this.prisma.tacticalItineraryNode.update({
      where: { id: nodeId },
      data: {
        options: parsedOptions as unknown as Prisma.InputJsonValue,
        affiliateProvider: selectedOption?.provider ?? node.affiliateProvider,
        affiliateUrl: selectedOption?.affiliateUrl ?? node.affiliateUrl,
      },
    });

    return true;
  }

  async updateNodeTime(
    nodeId: string,
    startTime: string,
    endTime?: string,
  ): Promise<boolean> {
    const result = await this.prisma.tacticalItineraryNode.updateMany({
      where: { id: nodeId },
      data: {
        startTime,
        endTime: endTime ?? null,
      },
    });

    return result.count > 0;
  }

  private mapToDto(record: {
    id: string;
    sessionId: string;
    summary: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    waypoints: Array<{
      id: string;
      title: string;
      description: string;
      category: string;
      startTime: string;
      endTime: string | null;
      orderIndex: number;
      coordinatesLat: number | null;
      coordinatesLng: number | null;
      affiliateProvider: string | null;
      affiliateUrl: string | null;
      isSelected: boolean;
      options: Prisma.JsonValue | null;
    }>;
  }): PersistedItineraryDto {
    const waypoints: EnrichedWaypoint[] = record.waypoints.map((wp) => {
      let rawOptions: WaypointOption[] = [];
      if (Array.isArray(wp.options)) {
        rawOptions = (wp.options as unknown[])
          .map((item) => {
            const parsed = WaypointOptionSchema.safeParse(item);
            return parsed.success ? parsed.data : null;
          })
          .filter((item): item is WaypointOption => item !== null);
      }

      const categoryParsed = ['GASTRONOMY', 'CULTURE', 'ACTIVITY', 'TRANSIT', 'GENERAL'].includes(
        wp.category,
      )
        ? (wp.category as 'GASTRONOMY' | 'CULTURE' | 'ACTIVITY' | 'TRANSIT' | 'GENERAL')
        : 'GENERAL';

      const providerParsed: AffiliateProvider = ['THEFORK', 'CIVITATIS', 'NONE'].includes(
        wp.affiliateProvider ?? '',
      )
        ? (wp.affiliateProvider as AffiliateProvider)
        : 'NONE';

      return EnrichedWaypointSchema.parse({
        id: wp.id,
        title: wp.title,
        description: wp.description,
        category: categoryParsed,
        timeSpan: {
          start: wp.startTime,
          end: wp.endTime ?? undefined,
        },
        coordinates:
          wp.coordinatesLat !== null && wp.coordinatesLng !== null
            ? { lat: wp.coordinatesLat, lng: wp.coordinatesLng }
            : undefined,
        recommendations: [],
        affiliateProvider: providerParsed,
        affiliateUrl: wp.affiliateUrl ?? undefined,
        options: rawOptions,
      });
    });

    return {
      id: record.id,
      sessionId: record.sessionId,
      summary: record.summary,
      status: record.status,
      waypoints,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
