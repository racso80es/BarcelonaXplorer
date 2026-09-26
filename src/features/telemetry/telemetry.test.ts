import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaTelemetryRepository } from './prisma-telemetry.repository';
import { TelemetryEntry } from './telemetry-entry.entity';
import { PrismaClient } from '@prisma/client';

describe('PrismaTelemetryRepository (Vía del Yunque S+)', () => {
  let mockPrisma: {
    telemetryLog: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
  };
  let repository: PrismaTelemetryRepository;

  beforeEach(() => {
    mockPrisma = {
      telemetryLog: {
        create: vi.fn().mockResolvedValue({ id: 'log-1' }),
        findMany: vi.fn().mockResolvedValue([]),
        deleteMany: vi.fn().mockResolvedValue({ count: 5 }),
      },
    };
    repository = new PrismaTelemetryRepository(mockPrisma as unknown as PrismaClient);
  });

  describe('log()', () => {
    it('debe persistir un registro sanitizando propiedades sensibles en el payload', async () => {
      const entry = new TelemetryEntry(
        'WARN',
        'SECURITY_PERIMETER',
        'Intento sospechoso en /Admin',
        {
          ip: '192.168.1.50',
          password: 'supersecretpassword',
          apiKey: 'key_12345',
          safeData: 'visible',
        },
        401,
        25,
      );

      await repository.log(entry);

      expect(mockPrisma.telemetryLog.create).toHaveBeenCalledTimes(1);
      const callArgs = mockPrisma.telemetryLog.create.mock.calls[0][0];

      expect(callArgs.data.level).toBe('WARN');
      expect(callArgs.data.context).toBe('SECURITY_PERIMETER');
      expect(callArgs.data.message).toBe('Intento sospechoso en /Admin');
      expect(callArgs.data.payload.password).toBe('[REDACTED]');
      expect(callArgs.data.payload.apiKey).toBe('[REDACTED]');
      expect(callArgs.data.payload.safeData).toBe('visible');
    });

    it('principio Fail-Safe: no debe lanzar excepción si la base de datos MySQL falla o está caída', async () => {
      mockPrisma.telemetryLog.create.mockRejectedValueOnce(
        new Error('MySQL connection pool exhausted'),
      );
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const entry = new TelemetryEntry('ERROR', 'SERVER_API', 'Error de conexión');

      // No debe propagar la excepción hacia arriba
      await expect(repository.log(entry)).resolves.toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Telemetry Fallback Error]'),
        expect.stringContaining('MySQL connection pool exhausted'),
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('getRecentLogs()', () => {
    it('debe mapear los registros de Prisma a entidades puras de dominio TelemetryEntry', async () => {
      const dbDate = new Date();
      mockPrisma.telemetryLog.findMany.mockResolvedValueOnce([
        {
          id: 'log-100',
          createdAt: dbDate,
          level: 'ERROR',
          context: 'CLIENT_UI',
          message: 'Error en render',
          payload: { stack: '...' },
          statusCode: 500,
          durationMs: 120,
          environment: 'production',
        },
      ]);

      const logs = await repository.getRecentLogs({ level: 'ERROR', limit: 10 });

      expect(logs).toHaveLength(1);
      expect(logs[0]).toBeInstanceOf(TelemetryEntry);
      expect(logs[0].id).toBe('log-100');
      expect(logs[0].level).toBe('ERROR');
      expect(logs[0].context).toBe('CLIENT_UI');
    });
  });

  describe('prune() (Poda Ontológica)', () => {
    it('debe ejecutar deleteMany con las políticas de retención de 7 y 30 días', async () => {
      const result = await repository.prune({
        debugInfoMaxAgeDays: 7,
        warnErrorMaxAgeDays: 30,
      });

      expect(mockPrisma.telemetryLog.deleteMany).toHaveBeenCalledTimes(1);
      const callArgs = mockPrisma.telemetryLog.deleteMany.mock.calls[0][0];

      expect(callArgs.where.OR).toBeDefined();
      expect(callArgs.where.OR).toHaveLength(2);
      expect(result.deletedCount).toBe(5);
    });
  });

  describe('Eventos Sensorizados de Orquestación Híbrida (PBI-OPS-TELEM-002)', () => {
    it('CA-1 & CA-2: debe validar determinísticamente los esquemas TRIAGE_ROUTED, DENSITY_THRESHOLD_CHECK y PROVIDER_AFFILIATE_FETCH', async () => {
      const {
        TriageRoutedEventSchema,
        DensityThresholdCheckEventSchema,
        ProviderAffiliateFetchEventSchema,
        HybridOrchestrationEventSchema,
      } = await import('./telemetry.schema');

      const triageEvent = TriageRoutedEventSchema.parse({
        eventType: 'TRIAGE_ROUTED',
        sessionId: 'sess-123',
        intent: 'dialogue',
        decisionEngine: 'jev-ai',
        model: 'groq/qwen3.8-27b',
        promptLength: 25,
        durationMs: 45,
        statusCode: 200,
        tokenEstimate: 50,
        tokensSaved: 850,
      });
      expect(triageEvent.intent).toBe('dialogue');
      expect(triageEvent.tokensSaved).toBe(850);

      const densityEvent = DensityThresholdCheckEventSchema.parse({
        eventType: 'DENSITY_THRESHOLD_CHECK',
        sessionId: 'sess-123',
        score: 75,
        survivalThreshold: 60,
        isSatisfied: true,
        durationMs: 12,
        statusCode: 200,
      });
      expect(densityEvent.isSatisfied).toBe(true);
      expect(densityEvent.score).toBe(75);

      const affiliateEvent = ProviderAffiliateFetchEventSchema.parse({
        eventType: 'PROVIDER_AFFILIATE_FETCH',
        sessionId: 'sess-123',
        provider: 'THEFORK',
        query: 'tapas el born',
        optionsGenerated: 2,
        durationMs: 85,
        statusCode: 200,
      });
      expect(affiliateEvent.provider).toBe('THEFORK');
      expect(affiliateEvent.optionsGenerated).toBe(2);

      // Verificación mediante la unión discriminada
      expect(HybridOrchestrationEventSchema.parse(triageEvent)).toBeDefined();
      expect(HybridOrchestrationEventSchema.parse(densityEvent)).toBeDefined();
      expect(HybridOrchestrationEventSchema.parse(affiliateEvent)).toBeDefined();
    });

    it('CA-4: debe persistir un evento de telemetría de orquestación híbrida en MySQL sanitizado', async () => {
      const entry = new TelemetryEntry(
        'INFO',
        'SECURITY_PERIMETER',
        '[Aduana] Diálogo casual interceptado con empatía',
        {
          eventType: 'TRIAGE_ROUTED',
          sessionId: 'sess-abc',
          intent: 'dialogue',
          durationMs: 35,
          tokensSaved: 850,
        },
        200,
        35,
      );

      await repository.log(entry);

      expect(mockPrisma.telemetryLog.create).toHaveBeenCalledTimes(1);
      const callArgs = mockPrisma.telemetryLog.create.mock.calls[0][0];
      expect(callArgs.data.payload.eventType).toBe('TRIAGE_ROUTED');
      expect(callArgs.data.payload.tokensSaved).toBe(850);
    });
  });
});
