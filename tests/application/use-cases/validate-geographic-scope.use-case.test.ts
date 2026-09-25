import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidateGeographicScopeUseCase } from '@/application/use-cases/validate-geographic-scope.use-case';
import { GeographicDecisionEnginePort } from '@/application/ports/out/geographic-decision-engine.port';
import { GeographicBounceGeneratorPort } from '@/application/ports/out/geographic-bounce-generator.port';
import { TelemetryRepositoryPort } from '@/features/telemetry';

describe('ValidateGeographicScopeUseCase (HU-PERIM-GEO-001)', () => {
  let mockDecisionEngine: GeographicDecisionEnginePort;
  let mockBounceGenerator: GeographicBounceGeneratorPort;
  let mockTelemetryRepo: TelemetryRepositoryPort;
  let useCase: ValidateGeographicScopeUseCase;

  beforeEach(() => {
    mockDecisionEngine = {
      evaluateScope: vi.fn(),
    };
    mockBounceGenerator = {
      generateBounceMessage: vi.fn(),
    };
    mockTelemetryRepo = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    useCase = new ValidateGeographicScopeUseCase(
      mockDecisionEngine,
      mockBounceGenerator,
      mockTelemetryRepo,
    );
  });

  describe('Escenario 1: Prompt Implícito (Fricción Cero e Inyección Silenciosa)', () => {
    it('debe inyectar Barcelona de forma invisible sin consultar al usuario', async () => {
      const prompt = 'Tengo 3 horas libres esta tarde, quiero comer paella y ver algo histórico';

      vi.mocked(mockDecisionEngine.evaluateScope).mockResolvedValueOnce({
        is_barcelona_scope: true,
        canonical_city: 'Barcelona',
        detected_districts: [],
        confidence: 0.99,
      });

      const outcome = await useCase.execute({ prompt });

      expect(outcome.status).toBe('IN_SCOPE');
      if (outcome.status === 'IN_SCOPE') {
        expect(outcome.scope.isWithinScope).toBe(true);
        expect(outcome.scope.targetCity).toBe('Barcelona');
        expect(outcome.isImplicit).toBe(true);
        expect(outcome.enrichedPrompt).toBe(`[Geo: Barcelona] ${prompt}`);
      }

      expect(mockBounceGenerator.generateBounceMessage).not.toHaveBeenCalled();
    });
  });

  describe('Escenario 2: Prompt Fuera de Dominio (Rebote Táctico y Filtro de Eficiencia)', () => {
    it('debe abortar la petición hacia el motor pesado y emitir rebote táctico en < 200 ms', async () => {
      const prompt = 'Recomiéndame una ruta para ver museos y comer tapas en Valencia';

      vi.mocked(mockDecisionEngine.evaluateScope).mockResolvedValueOnce({
        is_barcelona_scope: false,
        canonical_city: 'Barcelona',
        detected_districts: [],
        confidence: 0.95,
        out_of_scope_entity: 'Valencia',
      });

      vi.mocked(mockBounceGenerator.generateBounceMessage).mockResolvedValueOnce(
        'Mi radar táctico está calibrado exclusivamente para el asfalto de Barcelona. Si te pasas por aquí, forjamos una ruta a medida.',
      );

      const outcome = await useCase.execute({ prompt });

      expect(outcome.status).toBe('REJECTED_OUT_OF_SCOPE');
      if (outcome.status === 'REJECTED_OUT_OF_SCOPE') {
        expect(outcome.scope.isWithinScope).toBe(false);
        expect(outcome.rejectedEntity).toBe('Valencia');
        expect(outcome.bounceMessage).toContain('asfalto de Barcelona');
      }

      expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'WARN',
          context: 'SECURITY_PERIMETER',
          statusCode: 422,
        }),
      );
    });
  });

  describe('Escenario 3: Prompt Explícito Redundante (Normalización e Idempotencia)', () => {
    it('debe validar la ubicación sin añadir prefijo redundante en el prompt enriquecido', async () => {
      const prompt = 'Quiero pasear por Barcelona con mi pareja en Gràcia';

      vi.mocked(mockDecisionEngine.evaluateScope).mockResolvedValueOnce({
        is_barcelona_scope: true,
        canonical_city: 'Barcelona',
        detected_districts: ['Gràcia'],
        confidence: 1.0,
      });

      const outcome = await useCase.execute({ prompt });

      expect(outcome.status).toBe('IN_SCOPE');
      if (outcome.status === 'IN_SCOPE') {
        expect(outcome.scope.detectedDistricts).toEqual(['Gràcia']);
        expect(outcome.isImplicit).toBe(false);
        expect(outcome.enrichedPrompt).toBe(prompt);
      }
    });
  });

  describe('Escenario 4: Tolerancia Periurbana (Micro-Logística de Última Milla)', () => {
    it('debe admitir el Aeropuerto de El Prat como infraestructura logística autorizada', async () => {
      const prompt = 'Acabo de aterrizar en el Aeropuerto de El Prat y tengo 4 horas';

      vi.mocked(mockDecisionEngine.evaluateScope).mockResolvedValueOnce({
        is_barcelona_scope: true,
        canonical_city: 'Barcelona',
        detected_districts: ['Aeropuerto de El Prat'],
        confidence: 0.98,
      });

      const outcome = await useCase.execute({ prompt });

      expect(outcome.status).toBe('IN_SCOPE');
      if (outcome.status === 'IN_SCOPE') {
        expect(outcome.scope.detectedDistricts).toContain('Aeropuerto de El Prat');
        expect(outcome.scope.isWithinScope).toBe(true);
      }
      expect(mockBounceGenerator.generateBounceMessage).not.toHaveBeenCalled();
    });
  });

  describe('Escenario 5: Fail-Soft y Degradación Elegante (Assume-Barcelona-Default)', () => {
    it('debe garantizar continuidad de servicio si el motor de triaje cae', async () => {
      const prompt = 'Quiero comer algo rico cerca del puerto';

      vi.mocked(mockDecisionEngine.evaluateScope).mockRejectedValueOnce(
        new Error('Groq/Jev Gateway Timeout 504'),
      );

      const outcome = await useCase.execute({ prompt });

      expect(outcome.status).toBe('IN_SCOPE');
      if (outcome.status === 'IN_SCOPE') {
        expect(outcome.scope.isWithinScope).toBe(true);
        expect(outcome.scope.targetCity).toBe('Barcelona');
        expect(outcome.isImplicit).toBe(true);
      }

      expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'WARN',
          context: 'SECURITY_PERIMETER',
          statusCode: 500,
        }),
      );
    });
  });
});
