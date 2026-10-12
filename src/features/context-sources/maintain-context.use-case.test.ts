import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSuccessEnvelope } from '@/shared/operation-envelope';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { IaGatewayClient, UnsupportedCapabilityError } from '@/features/ai-engine/ia-gateway/ia-gateway.client';
import { IContextSourceRepository } from './context-source.repository.port';
import { ContextSourceSnapshot } from './context-source.types';
import { MaintainContextUseCase, classifyExploredEndpoint } from './maintain-context.use-case';

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

  describe('Matriz de clasificación de Argos (PBI-CTX-027)', () => {
    it('CA-1: asigna CKAN_DATASTORE a URLs con host Ajuntament y pathname /api/3/action', () => {
      const type = classifyExploredEndpoint(
        'https://opendata-ajuntament.barcelona.cat/data/api/3/action/package_show?id=agenda-cultural'
      );
      expect(type).toBe('CKAN_DATASTORE');
    });

    it('CA-2: asigna SOCRATA si el host es analisi.transparenciacatalunya.cat o contiene socrata', () => {
      expect(
        classifyExploredEndpoint('https://analisi.transparenciacatalunya.cat/resource/dataset-123.json')
      ).toBe('SOCRATA');
      expect(classifyExploredEndpoint('https://dadesobertes.gencat.cat/socrata/export')).toBe('SOCRATA');
    });

    it('CA-3: asigna ICAL si contiene .ics o ical; fila 1 tiene prioridad sobre socrata', () => {
      expect(classifyExploredEndpoint('https://opendata-ajuntament.barcelona.cat/data/events.ics')).toBe(
        'ICAL'
      );
      expect(classifyExploredEndpoint('https://opendata.bcn.cat/agenda-ical-export')).toBe('ICAL');
      // Fila 1 (.ics) gana sobre fila 2 (socrata)
      expect(classifyExploredEndpoint('https://analisi.transparenciacatalunya.cat/resource/agenda.ics')).toBe(
        'ICAL'
      );
      expect(classifyExploredEndpoint('https://other.cat/socrata-export.ics')).toBe('ICAL');
    });

    it('CA-4: URL de descarga sin extensión en portal Ajuntament cae en JSON_LD', () => {
      expect(
        classifyExploredEndpoint(
          'https://opendata-ajuntament.barcelona.cat/data/dataset/foo/resource/bar/download'
        )
      ).toBe('JSON_LD');
    });

    it('CA-6: asigna RSS para rss o feed, SPARQL para sparql o wikidata, y JSON_LD por defecto', () => {
      expect(classifyExploredEndpoint('https://bcn.cat/noticies/rss')).toBe('RSS');
      expect(classifyExploredEndpoint('https://bcn.cat/agenda/atom-feed')).toBe('RSS');
      expect(classifyExploredEndpoint('https://query.wikidata.org/sparql')).toBe('SPARQL');
      expect(classifyExploredEndpoint('https://bcn.cat/linked-data/wikidata-entity')).toBe('SPARQL');
      expect(classifyExploredEndpoint('https://bcn.cat/events/generic-webpage')).toBe('JSON_LD');
    });

    it('resiste URLs inválidas evaluando heurísticas de cadena de forma segura', () => {
      expect(classifyExploredEndpoint('cadena-sin-protocolo-con-socrata')).toBe('SOCRATA');
      expect(classifyExploredEndpoint('cadena-sin-protocolo-ni-senales')).toBe('JSON_LD');
    });

    it('CA-1 (Integración): exploración crea propuesta CKAN_DATASTORE sin extractionConfig', async () => {
      vi.mocked(mockSourceRepo.findByStatus).mockResolvedValue([]);
      vi.mocked(mockIaGateway.generateWithGrounding).mockResolvedValue({
        text: 'Exploración Ajuntament CKAN',
        groundingSources: [
          {
            uri: 'https://opendata-ajuntament.barcelona.cat/data/api/3/action/package_show?id=agenda-cultural',
            title: 'Agenda Cultural Open Data',
          },
        ],
      });

      const useCase = new MaintainContextUseCase(
        mockSourceRepo,
        mockIaGateway,
        mockTelemetryRepo,
        fetch,
        { maxProposals: 1 }
      );

      const envelope = await useCase.execute();

      expect(envelope.success).toBe(true);
      expect(envelope.result?.proposalsCreated).toBe(1);
      const proposal = envelope.result?.proposals[0];
      expect(proposal?.type).toBe('CKAN_DATASTORE');
      expect(proposal?.category).toBe('EVENT');

      expect(mockSourceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CKAN_DATASTORE',
          category: 'EVENT',
          status: 'PENDING_APPROVAL',
          proposedBy: 'ARGOS',
          supersedesSourceTag: null,
        })
      );
      const callArg = vi.mocked(mockSourceRepo.create).mock.calls[0][0];
      expect(callArg.extractionConfig).toBeUndefined();
    });

    it('CA-5 (Integración): fuente DEGRADED de tipo ICAL conserva su tipo y categoría ante redirección a CKAN', async () => {
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if (url === 'https://bcn.cat/agenda-old') {
          return Promise.resolve({
            ok: true,
            status: 200,
            url: 'https://opendata-ajuntament.barcelona.cat/data/api/3/action/package_show?id=agenda-cultural',
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
      expect(envelope.result?.proposalsCreated).toBe(1);
      const proposal = envelope.result?.proposals[0];
      // Conserva ICAL y EVENT de la fuente degradada original, no adopta CKAN_DATASTORE
      expect(proposal?.type).toBe('ICAL');
      expect(proposal?.category).toBe('EVENT');
      expect(mockSourceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ICAL',
          category: 'EVENT',
          supersedesSourceTag: degradedSource.sourceTag,
        })
      );
    });
  });
});
