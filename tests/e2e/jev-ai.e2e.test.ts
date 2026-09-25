import React from 'react';
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { JevClient } from '@/infrastructure/ai/jev/jevClient';
import { AuditJevHealthUseCase } from '@/application/use-cases/audit-jev-health.use-case';
import { JevTelemetryCard } from '@/app/Admin/System/JevTelemetryCard';
import { TelemetryRepositoryPort } from '@/features/telemetry';
import { getJevConfig } from '@/infrastructure/ai/jev/config';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Suite E2E: Verificación en Vivo contra el Servicio Upstream Jev AI (System One).
 *
 * Utiliza las credenciales reales configuradas en .env.local (JEV_API_KEY).
 * Audita el wire protocol real, la sonda de coste cero /v1/models y la inferencia /v1/systemone.
 */
describe('Jev AI Upstream Live E2E (HU-INFRA-JEV-001)', () => {
  beforeAll(() => {
    // Asegurar carga de .env.local en el entorno de prueba
    if (!process.env.JEV_API_KEY) {
      const envPath = path.resolve(__dirname, '../../src/.env.local');
      if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
        process.loadEnvFile(envPath);
      }
    }
  });

  it('E2E-1: Sonda de salud térmica en vivo contra GET /v1/models (Coste Cero)', async () => {
    const config = getJevConfig();
    expect(config.apiKey).toBeDefined();

    const client = new JevClient();
    const probe = await client.evaluateHealth();

    expect(probe.isHealthy).toBe(true);
    expect(probe.statusCode).toBe(200);
    expect(probe.error).toBeUndefined();
    expect(probe.latencyMs).toBeGreaterThan(0);
    expect(probe.modelCount).toBeGreaterThanOrEqual(1);
  }, 15000);

  it('E2E-2: Inferencia System One en vivo para intención afirmativa en Barcelona', async () => {
    const client = new JevClient();
    const evaluation = await client.evaluateNoul(
      'El usuario desea visitar la Basílica de la Sagrada Família y el Parc Güell.',
      '¿La intención ocurre dentro del término de Barcelona?',
      0.5,
    );

    expect(evaluation.probability).toBeGreaterThanOrEqual(0.7);
    expect(evaluation.isAffirmative).toBe(true);
  }, 15000);

  it('E2E-3: Inferencia System One en vivo para intención fuera de Barcelona (Fuga a Madrid)', async () => {
    const client = new JevClient();
    const evaluation = await client.evaluateNoul(
      'El usuario busca tapas y espectáculo en la Gran Vía y la Plaza Mayor de Madrid.',
      '¿La intención ocurre dentro del término de Barcelona?',
      0.5,
    );

    expect(evaluation.probability).toBeLessThanOrEqual(0.3);
    expect(evaluation.isAffirmative).toBe(false);
  }, 15000);

  it('E2E-4: Orquestación end-to-end con AuditJevHealthUseCase en vivo', async () => {
    const client = new JevClient();
    const mockTelemetryRepo: TelemetryRepositoryPort = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    const useCase = new AuditJevHealthUseCase(client, mockTelemetryRepo);
    const result = await useCase.execute();

    expect(result.isHealthy).toBe(true);
    expect(['ok', 'warn']).toContain(result.state);
    expect(result.latencyMs).toBeGreaterThan(0);
    expect(result.msg).toMatch(/(Operativo|Latencia Alta)/);
  }, 15000);

  it('E2E-5: Renderizado del Server Component JevTelemetryCard con datos reales en vivo', async () => {
    const client = new JevClient();
    const mockTelemetryRepo: TelemetryRepositoryPort = {
      log: vi.fn().mockResolvedValue(undefined),
      getRecentLogs: vi.fn().mockResolvedValue([]),
      prune: vi.fn().mockResolvedValue({ deletedCount: 0 }),
    };

    const liveUseCase = new AuditJevHealthUseCase(client, mockTelemetryRepo);
    const card = await JevTelemetryCard({ useCase: liveUseCase });

    expect(React.isValidElement(card)).toBe(true);
    // Verificar que el elemento devuelto es un Card de shadcn
    expect(card.type).toBeDefined();
  }, 15000);
});
