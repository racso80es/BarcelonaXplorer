import { describe, it, expect, beforeAll, vi } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { TriageInputUseCase } from '@/application/use-cases/triage-input.use-case';
import { JevClient } from '@/infrastructure/ai/jev/jevClient';
import { GroqConversationalSlmAdapter } from '@/infrastructure/ai/groq/groq-conversational-slm.adapter';
import { InMemoryDensityMatrixRepository } from '@/infrastructure/repositories/in-memory-density-matrix.repository';
import { TelemetryRepositoryPort } from '@/features/telemetry';

describe('Aduana Universal y Triaje Entrópico Upstream Live E2E (HU-CORE-TRIAGE-002)', () => {
  beforeAll(() => {
    // Carga de variables de entorno reales desde src/.env.local
    const envPath = path.resolve(__dirname, '../../src/.env.local');
    if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
      process.loadEnvFile(envPath);
    }
  });

  const mockTelemetryRepo: TelemetryRepositoryPort = {
    log: vi.fn().mockResolvedValue(undefined),
    getRecentLogs: vi.fn().mockResolvedValue([]),
    prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
  };

  it('TC-TRIAGE-10A: E2E Live - Rebote Táctico real para destino foráneo en Girona', async () => {
    const jevClient = new JevClient();
    const groqAdapter = new GroqConversationalSlmAdapter(undefined, mockTelemetryRepo);
    const matrixRepo = new InMemoryDensityMatrixRepository();
    const useCase = new TriageInputUseCase(jevClient, groqAdapter, matrixRepo, undefined, mockTelemetryRepo);

    const outcome = await useCase.execute({
      sessionId: 'e2e-live-session-girona',
      prompt: 'Recomiéndame los tres mejores restaurantes de Girona para cenar',
      matrixId: 'default',
    });

    expect(outcome.status).toBe('REBOUND_OUT_OF_SCOPE');
    expect(outcome.isThresholdSatisfied).toBe(false);
    expect(outcome.rejectedEntity).toBe('Girona');
    expect(typeof outcome.bounceMessage).toBe('string');
    expect(outcome.bounceMessage?.length).toBeGreaterThan(10);
    expect(outcome.durationMs).toBeGreaterThan(0);
  }, 15000);

  it('TC-TRIAGE-10B: E2E Live - Repregunta atómica real para prompt sin time_window en Barcelona', async () => {
    const jevClient = new JevClient();
    const groqAdapter = new GroqConversationalSlmAdapter(undefined, mockTelemetryRepo);
    const matrixRepo = new InMemoryDensityMatrixRepository();
    const useCase = new TriageInputUseCase(jevClient, groqAdapter, matrixRepo, undefined, mockTelemetryRepo);

    const outcome = await useCase.execute({
      sessionId: 'e2e-live-session-bcn-incomplete',
      prompt: 'Quiero ver arquitectura modernista con amigos',
      matrixId: 'default',
    });

    expect(outcome.status).toBe('INCOMPLETE_REPROMPT');
    expect(outcome.isThresholdSatisfied).toBe(false);
    expect(outcome.missingVariable).toBe('time_window');
    expect(typeof outcome.repromptMessage).toBe('string');
    expect(outcome.repromptMessage?.length).toBeGreaterThan(10);
  }, 15000);

  it('TC-TRIAGE-10C: E2E Live - Despacho directo real para prompt completo en Barcelona', async () => {
    const jevClient = new JevClient();
    const groqAdapter = new GroqConversationalSlmAdapter(undefined, mockTelemetryRepo);
    const matrixRepo = new InMemoryDensityMatrixRepository();
    const useCase = new TriageInputUseCase(jevClient, groqAdapter, matrixRepo, undefined, mockTelemetryRepo);

    const outcome = await useCase.execute({
      sessionId: 'e2e-live-session-bcn-complete',
      prompt: 'Ruta de 4 horas por el Gótico para 2 personas buscando tapas',
      matrixId: 'default',
    });

    expect(outcome.status).toBe('DISPATCH_READY');
    expect(outcome.isThresholdSatisfied).toBe(true);
    expect(outcome.score).toBeGreaterThanOrEqual(60);
    expect(outcome.payload).toBeDefined();
    expect(outcome.payload?.time_window).toBeDefined();
    expect(outcome.payload?.group_size).toBe(2);
  }, 15000);
});
