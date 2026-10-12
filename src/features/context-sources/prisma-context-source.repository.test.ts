import { describe, it, expect, vi } from 'vitest';
import { PrismaContextSourceRepository } from './prisma-context-source.repository';
import { SeedSourceInput } from './context-source.repository.port';
import { CkanDatastoreExtractionConfig } from './context-source.types';

describe('PrismaContextSourceRepository (PBI-CTX-014)', () => {
  const sampleExtraction: CkanDatastoreExtractionConfig = {
    strategy: 'CKAN_DATASTORE',
    dataset: 'agenda-cultural',
    resourceSelector: {
      format: 'CSV',
      datastoreActive: true,
    },
    fieldMap: {
      externalId: 'register_id',
      title: 'name',
      summary: ['name', 'institution_name'],
      startsAt: 'start_date',
      endsAt: 'end_date',
    },
    pageSize: 100,
    maxRecords: 500,
    timeoutMs: 30000,
    groupBy: 'register_id',
  };

  it('CA-4: crea una fila nueva persistiendo extractionConfig', async () => {
    const mockPrisma = {
      contextSource: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: 'cs-new',
          sourceTag: 'bcn-agenda-cultural',
          displayName: 'Agenda Cultural',
          endpoint: 'https://example.com/api',
          type: 'API_REST',
          category: 'EVENT',
          status: 'PENDING_APPROVAL',
          failedAttempts: 0,
          proposedBy: 'SEED',
          supersedesSourceTag: null,
          extractionConfig: sampleExtraction,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        update: vi.fn(),
      },
    };

    const repo = new PrismaContextSourceRepository(mockPrisma as unknown as import('@prisma/client').PrismaClient);
    const input: SeedSourceInput = {
      sourceTag: 'bcn-agenda-cultural',
      displayName: 'Agenda Cultural',
      endpoint: 'https://example.com/api',
      type: 'API_REST',
      category: 'EVENT',
      status: 'PENDING_APPROVAL',
      extraction: sampleExtraction,
    };

    const result = await repo.upsertFromSeed([input]);

    expect(result.success).toBe(true);
    expect(result.result).toEqual({ created: 1, updated: 0, untouched: 0 });
    expect(mockPrisma.contextSource.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sourceTag: 'bcn-agenda-cultural',
        extractionConfig: sampleExtraction,
      }),
    });
  });

  it('CA-4: actualiza extractionConfig si cambia, pero no toca status ni bitácora de errores', async () => {
    const existingDbRow = {
      id: 'cs-exist',
      sourceTag: 'bcn-agenda-cultural',
      displayName: 'Agenda Cultural',
      endpoint: 'https://example.com/api',
      type: 'API_REST',
      category: 'EVENT',
      status: 'ACTIVE', // Estado operativo preservado
      failedAttempts: 2,
      lastError: 'Timeout previo',
      lastErrorAt: new Date('2026-10-10T00:00:00Z'),
      extractionConfig: {
        ...sampleExtraction,
        pageSize: 50, // Antiguo tamaño de página
      },
    };

    const mockPrisma = {
      contextSource: {
        findUnique: vi.fn().mockResolvedValue(existingDbRow),
        update: vi.fn().mockResolvedValue({
          ...existingDbRow,
          extractionConfig: sampleExtraction,
        }),
      },
    };

    const repo = new PrismaContextSourceRepository(mockPrisma as unknown as import('@prisma/client').PrismaClient);
    const input: SeedSourceInput = {
      sourceTag: 'bcn-agenda-cultural',
      displayName: 'Agenda Cultural',
      endpoint: 'https://example.com/api',
      type: 'API_REST',
      category: 'EVENT',
      status: 'INACTIVE', // La semilla viene INACTIVE pero no debe pisar ACTIVE
      extraction: sampleExtraction,
    };

    const result = await repo.upsertFromSeed([input]);

    expect(result.success).toBe(true);
    expect(result.result).toEqual({ created: 0, updated: 1, untouched: 0 });
    expect(mockPrisma.contextSource.update).toHaveBeenCalledWith({
      where: { sourceTag: 'bcn-agenda-cultural' },
      data: {
        displayName: 'Agenda Cultural',
        endpoint: 'https://example.com/api',
        type: 'API_REST',
        category: 'EVENT',
        extractionConfig: sampleExtraction,
      },
    });
  });

  it('CA-4: cuenta como untouched si el JSON parseado es equivalente', async () => {
    const existingDbRow = {
      id: 'cs-exist',
      sourceTag: 'bcn-agenda-cultural',
      displayName: 'Agenda Cultural',
      endpoint: 'https://example.com/api',
      type: 'API_REST',
      category: 'EVENT',
      status: 'ACTIVE',
      failedAttempts: 0,
      extractionConfig: sampleExtraction,
    };

    const mockPrisma = {
      contextSource: {
        findUnique: vi.fn().mockResolvedValue(existingDbRow),
        update: vi.fn(),
      },
    };

    const repo = new PrismaContextSourceRepository(mockPrisma as unknown as import('@prisma/client').PrismaClient);
    const input: SeedSourceInput = {
      sourceTag: 'bcn-agenda-cultural',
      displayName: 'Agenda Cultural',
      endpoint: 'https://example.com/api',
      type: 'API_REST',
      category: 'EVENT',
      status: 'ACTIVE',
      extraction: sampleExtraction,
    };

    const result = await repo.upsertFromSeed([input]);

    expect(result.success).toBe(true);
    expect(result.result).toEqual({ created: 0, updated: 0, untouched: 1 });
    expect(mockPrisma.contextSource.update).not.toHaveBeenCalled();
  });
});
