import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditJevHealthUseCase } from '@/application/use-cases/audit-jev-health.use-case';
import { ITypedDecisionEngine } from '@/application/ports/out/ITypedDecisionEngine';
import { TelemetryRepositoryPort } from '@/application/ports/out/telemetry-repository.port';

describe('AuditJevHealthUseCase (Principio DIP - Vía del Yunque)', () => {
  let mockEngine: ITypedDecisionEngine;
  let mockTelemetryRepo: TelemetryRepositoryPort;

  beforeEach(() => {
    mockEngine = {
      evaluateHealth: vi.fn(),
      evaluateNoul: vi.fn(),
    };

    mockTelemetryRepo = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };
  });

  it('debe clasificar el estado como OK y no registrar telemetría de alerta si latencia < 800ms', async () => {
    vi.mocked(mockEngine.evaluateHealth).mockResolvedValue({
      isHealthy: true,
      latencyMs: 140,
      modelCount: 2,
      statusCode: 200,
    });

    const useCase = new AuditJevHealthUseCase(mockEngine, mockTelemetryRepo);
    const result = await useCase.execute();

    expect(result.state).toBe('ok');
    expect(result.isHealthy).toBe(true);
    expect(result.latencyMs).toBe(140);
    expect(result.msg).toBe('Operativo (140ms)');
    expect(mockTelemetryRepo.log).not.toHaveBeenCalled();
  });

  it('debe clasificar el estado como WARN en el umbral exacto de 800ms', async () => {
    vi.mocked(mockEngine.evaluateHealth).mockResolvedValue({
      isHealthy: true,
      latencyMs: 800,
      modelCount: 2,
      statusCode: 200,
    });

    const useCase = new AuditJevHealthUseCase(mockEngine, mockTelemetryRepo);
    const result = await useCase.execute();

    expect(result.state).toBe('warn');
    expect(result.msg).toBe('Latencia Alta (800ms)');
    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);
  });

  it('debe admitir configuración personalizada para umbral de latencia y modelo por defecto', async () => {
    vi.mocked(mockEngine.evaluateHealth).mockResolvedValue({
      isHealthy: true,
      latencyMs: 550,
      modelCount: 3,
      statusCode: 200,
    });

    const useCase = new AuditJevHealthUseCase(mockEngine, mockTelemetryRepo, {
      latencyWarnThresholdMs: 500,
      defaultModel: 'laya-multilingual',
    });
    const result = await useCase.execute();

    expect(result.state).toBe('warn');
    expect(result.model).toBe('laya-multilingual');
  });

  it('debe clasificar el estado como ERROR y registrar telemetría si isHealthy es false', async () => {
    vi.mocked(mockEngine.evaluateHealth).mockResolvedValue({
      isHealthy: false,
      latencyMs: 2100,
      error: 'Timeout perimetral excedido (2000ms)',
      statusCode: 504,
    });

    const useCase = new AuditJevHealthUseCase(mockEngine, mockTelemetryRepo);
    const result = await useCase.execute();

    expect(result.state).toBe('error');
    expect(result.isHealthy).toBe(false);
    expect(result.latencyMs).toBe(2100);
    expect(result.msg).toBe('Timeout perimetral excedido (2000ms)');
    expect(mockTelemetryRepo.log).toHaveBeenCalledTimes(1);

    const loggedEntry = vi.mocked(mockTelemetryRepo.log).mock.calls[0][0];
    expect(loggedEntry.level).toBe('ERROR');
    expect(loggedEntry.context).toBe('SECURITY_PERIMETER');
  });

  it('debe aplicar Fail-Soft y no propagar errores si el repositorio de telemetría falla', async () => {
    vi.mocked(mockEngine.evaluateHealth).mockResolvedValue({
      isHealthy: false,
      latencyMs: 300,
      error: 'HTTP Error 401',
      statusCode: 401,
    });

    vi.mocked(mockTelemetryRepo.log).mockRejectedValue(new Error('MySQL connection pool full'));

    const useCase = new AuditJevHealthUseCase(mockEngine, mockTelemetryRepo);
    const result = await useCase.execute();

    expect(result.state).toBe('error');
    expect(result.isHealthy).toBe(false);
    expect(result.msg).toBe('HTTP Error 401');
  });

  it('debe registrar error con código 503 por defecto cuando statusCode viene indefinido', async () => {
    vi.mocked(mockEngine.evaluateHealth).mockResolvedValue({
      isHealthy: false,
      latencyMs: 1500,
      error: 'Error de socket no especificado',
    });

    const useCase = new AuditJevHealthUseCase(mockEngine, mockTelemetryRepo);
    const result = await useCase.execute();

    expect(result.state).toBe('error');
    const loggedEntry = vi.mocked(mockTelemetryRepo.log).mock.calls[0][0];
    expect(loggedEntry.statusCode).toBe(503);
  });
});
