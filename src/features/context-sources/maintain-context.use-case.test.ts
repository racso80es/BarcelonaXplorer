import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSuccessEnvelope } from '@/shared/operation-envelope';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { IaGatewayClient, UnsupportedCapabilityError } from '@/features/ai-engine/ia-gateway/ia-gateway.client';
import { IContextSourceRepository } from './context-source.repository.port';
import { ContextSourceSnapshot } from './context-source.types';
import { MaintainContextUseCase } from './maintain-context.use-case';

describe('MaintainContextUseCase (Argos Sonda)', () => {
  let mockSourceRepo: IContextSourceRepository;
  let mockIaGateway: IaGatewayClient;
  let mockTelemetryRepo: TelemetryRepositoryPort;

  const degradedSource: ContextSourceSnapshot = {
    id: 'src-deg-1',
    sourceTag: 'bcn-agenda-deg',
    displayName: 'Agenda Cultural Degradada',
    endpoint: 'https://bcn.cat/agenda-old',
    type: 'ICAL',
    category: 'EVENT',
    status: 'DEGRADED',
    failedAttempts: 3,
    proposedBy: 'SEED',
  };

  beforeEach(() => {
    mockSourceRepo = {
      findByStatus: vi.fn().mockResolvedValue([degradedSource]),
      findByTag: vi.fn().mockResolvedValue(null),
      findAll: vi.fn().mockResolvedValue([degradedSource]),
      save: vi.fn(),
      create: vi.fn().mockImplementation((src) =>
        Promise.resolve(createSuccessEnvelope({ ...src, id: `gen-${Math.random()}` }))
      ),
      upsertFromSeed: vi.fn(),
    };

    mockIaGateway = {
      generateWithGrounding: vi.fn().mockResolvedValue({
        text: 'Respuesta con grounding',
        groundingSources: [{ uri: 'https://opendata.bcn.cat/nou-endpoint', title: 'OpenData Nou' }],
      }),
    } as unknown as IaGatewayClient;

    mockTelemetryRepo = {
      log: vi.fn().mockResolvedValue(undefined),
      findEntries: vi.fn().mockResolvedValue([]),
      pruneOlderThan: vi.fn().mockResolvedValue(0),
    } as unknown as TelemetryRepositoryPort;
  });

  it('detecta redirección con sonda determinista y propone sin llamar al LLM (CA-1)', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === 'https://bcn.cat/agenda-old') {
        return Promise.resolve({
          ok: true,
          status: 200,
          url: 'https://bcn.cat/agenda-v2-nueva',
        });
      }
      if (url.includes('/robots.txt')) {
        return Promise.resolve({ ok: true, status: 200 });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    const useCase = new MaintainContextUseCase(
      mockSourceRepo,
      mockIaGateway,
      mockTelemetryRepo,
      mockFetch as unknown as typeof fetch,
      { maxProposals: 1 }
    );

    const envelope = await useCase.execute();

    expect(envelope.success).toBe(true);
    expect(envelope.result?.degradedChecked).toBe(1);
    expect(envelope.result?.proposalsCreated).toBe(1);

    const proposal = envelope.result?.proposals[0];
    expect(proposal?.endpoint).toBe('https://bcn.cat/agenda-v2-nueva');
    expect(proposal?.supersedesSourceTag).toBe(degradedSource.sourceTag);

    expect(mockSourceRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PENDING_APPROVAL',
        proposedBy: 'ARGOS',
        supersedesSourceTag: degradedSource.sourceTag,
      })
    );

    // No debe haber llamado al LLM para la fuente degradada
    expect(mockIaGateway.generateWithGrounding).not.toHaveBeenCalledWith(
      expect.stringContaining('Agenda Cultural Degradada'),
      expect.anything()
    );
  });

  it('recurre a hipótesis con grounding cuando la sonda determinista no resuelve (CA-2, CA-5)', async () => {
    // Sonda determinista falla (ej. 404 Not Found)
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      url: 'https://bcn.cat/agenda-old',
    });

    const useCase = new MaintainContextUseCase(
      mockSourceRepo,
      mockIaGateway,
      mockTelemetryRepo,
      mockFetch as unknown as typeof fetch,
      { maxProposals: 1 }
    );

    const envelope = await useCase.execute();

    expect(envelope.success).toBe(true);
    expect(mockIaGateway.generateWithGrounding).toHaveBeenCalled();

    expect(mockSourceRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'https://opendata.bcn.cat/nou-endpoint',
        status: 'PENDING_APPROVAL',
        proposedBy: 'ARGOS',
        supersedesSourceTag: degradedSource.sourceTag,
      })
    );
  });

  it('omite hipótesis y registra WARN si el proveedor no soporta grounding sin reintentar (CA-2)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      url: 'https://bcn.cat/agenda-old',
    });

    vi.mocked(mockIaGateway.generateWithGrounding).mockRejectedValue(
      new UnsupportedCapabilityError('UNSUPPORTED_CAPABILITY: Grounding search not available', 501)
    );

    const useCase = new MaintainContextUseCase(
      mockSourceRepo,
      mockIaGateway,
      mockTelemetryRepo,
      mockFetch as unknown as typeof fetch,
      { maxProposals: 3 }
    );

    const envelope = await useCase.execute();

    expect(envelope.success).toBe(true);
    expect(envelope.result?.groundingUnavailable).toBe(true);
    expect(envelope.result?.proposalsCreated).toBe(0);

    expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'WARN',
        message: expect.stringContaining('Capacidad de Grounding no disponible'),
      })
    );
  });

  it('respeta el límite estricto de propuestas configurado (CA-6)', async () => {
    vi.mocked(mockSourceRepo.findByStatus).mockResolvedValue([]);
    vi.mocked(mockIaGateway.generateWithGrounding).mockResolvedValue({
      text: 'Exploración múltiple',
      groundingSources: [
        { uri: 'https://cultura.bcn/1', title: 'Cultura 1' },
        { uri: 'https://cultura.bcn/2', title: 'Cultura 2' },
        { uri: 'https://cultura.bcn/3', title: 'Cultura 3' },
        { uri: 'https://cultura.bcn/4', title: 'Cultura 4' },
      ],
    });

    const useCase = new MaintainContextUseCase(
      mockSourceRepo,
      mockIaGateway,
      mockTelemetryRepo,
      fetch,
      { maxProposals: 2 }
    );

    const envelope = await useCase.execute();

    expect(envelope.success).toBe(true);
    expect(envelope.result?.proposalsCreated).toBe(2);
    expect(envelope.result?.proposals).toHaveLength(2);
    expect(mockSourceRepo.create).toHaveBeenCalledTimes(2);
  });
});
