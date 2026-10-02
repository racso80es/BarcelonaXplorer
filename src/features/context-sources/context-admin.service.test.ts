import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContextAdminService } from './context-admin.service';
import { IContextSourceRepository } from './context-source.repository.port';
import { ContextSourceSnapshot } from './context-source.types';
import { createSuccessEnvelope } from '@/shared/operation-envelope';

describe('ContextAdminService', () => {
  let mockSourceRepo: IContextSourceRepository;
  const dummySource: ContextSourceSnapshot = {
    id: 'src-123',
    sourceTag: 'test-source',
    displayName: 'Fuente de Prueba',
    endpoint: 'https://test.bcn/events',
    type: 'JSON_LD',
    category: 'EVENT',
    status: 'PENDING_APPROVAL',
    failedAttempts: 0,
    proposedBy: 'ARGOS',
  };

  beforeEach(() => {
    mockSourceRepo = {
      findAll: vi.fn().mockResolvedValue([dummySource]),
      findByStatus: vi.fn().mockResolvedValue([dummySource]),
      findByTag: vi.fn().mockResolvedValue(dummySource),
      save: vi.fn().mockImplementation((s) => Promise.resolve(createSuccessEnvelope(s))),
      create: vi.fn(),
      upsertFromSeed: vi.fn(),
    };
  });

  it('lista fuentes registradas en el repositorio', async () => {
    const service = new ContextAdminService(mockSourceRepo);
    const sources = await service.listSources();
    expect(sources).toHaveLength(1);
    expect(sources[0].sourceTag).toBe('test-source');
  });

  it('permite transiciones legales como APPROVE desde PENDING_APPROVAL hacia ACTIVE (CA-4)', async () => {
    const service = new ContextAdminService(mockSourceRepo);
    const envelope = await service.transitionSource('src-123', 'APPROVE', 'HUMAN');

    expect(envelope.success).toBe(true);
    expect(envelope.result?.status).toBe('ACTIVE');
    expect(mockSourceRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ACTIVE',
      })
    );
  });

  it('rechaza transiciones ilegales con código 422 sin mutar la base de datos (CA-4 / Escenario 4)', async () => {
    // Para PENDING_APPROVAL, el evento INGEST_OK o INGEST_FAIL no es legal para HUMAN
    const service = new ContextAdminService(mockSourceRepo);
    const envelope = await service.transitionSource('src-123', 'INGEST_OK', 'HUMAN');

    expect(envelope.success).toBe(false);
    expect(envelope.exitCode).toBe(422);
    expect(envelope.errors?.[0]).toContain('Transición ilegal');
    expect(mockSourceRepo.save).not.toHaveBeenCalled();
  });

  it('permite PROPOSE_CORRECTION actualizando el endpoint', async () => {
    const service = new ContextAdminService(mockSourceRepo);
    const envelope = await service.transitionSource(
      'src-123',
      'PROPOSE_CORRECTION',
      'HUMAN',
      { endpoint: 'https://test.bcn/events-corregido' }
    );

    expect(envelope.success).toBe(true);
    expect(envelope.result?.endpoint).toBe('https://test.bcn/events-corregido');
  });
});
