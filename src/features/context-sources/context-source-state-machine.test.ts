import { describe, expect, it } from 'vitest';
import {
  applyIngestionResult,
  transitionContextSource,
} from './context-source-state-machine';
import { ContextSourceSnapshot } from './context-source.types';

function createMockSource(overrides: Partial<ContextSourceSnapshot> = {}): ContextSourceSnapshot {
  return {
    id: 'ctx-123',
    sourceTag: 'test-source',
    displayName: 'Fuente de Prueba',
    endpoint: 'https://example.com/api',
    type: 'SOCRATA',
    category: 'EVENT',
    status: 'PENDING_APPROVAL',
    failedAttempts: 0,
    lastSuccessAt: null,
    lastErrorAt: null,
    lastError: null,
    proposedBy: 'SEED',
    supersedesSourceTag: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ContextSourceStateMachine (PBI-CTX-004)', () => {
  describe('CA-3: Matriz declarativa de 9 transiciones legales', () => {
    it('1. PENDING_APPROVAL -> APPROVE por HUMAN => ACTIVE (failedAttempts = 0)', () => {
      const source = createMockSource({ status: 'PENDING_APPROVAL', failedAttempts: 2 });
      const res = transitionContextSource(source, 'APPROVE', 'HUMAN');

      expect(res.success).toBe(true);
      expect(res.result?.status).toBe('ACTIVE');
      expect(res.result?.failedAttempts).toBe(0);
    });

    it('2. PENDING_APPROVAL -> REJECT por HUMAN => INACTIVE', () => {
      const source = createMockSource({ status: 'PENDING_APPROVAL' });
      const res = transitionContextSource(source, 'REJECT', 'HUMAN');

      expect(res.success).toBe(true);
      expect(res.result?.status).toBe('INACTIVE');
    });

    it('3. ACTIVE -> INGEST_OK por CRON => ACTIVE (failedAttempts reset a 0, lastSuccessAt actualizado)', () => {
      const pastDate = new Date('2026-01-01');
      const nowDate = new Date('2026-10-02T12:00:00Z');
      const source = createMockSource({
        status: 'ACTIVE',
        failedAttempts: 2,
        lastSuccessAt: pastDate,
      });

      const res = transitionContextSource(source, 'INGEST_OK', 'CRON', { now: nowDate });

      expect(res.success).toBe(true);
      expect(res.result?.status).toBe('ACTIVE');
      expect(res.result?.failedAttempts).toBe(0);
      expect(res.result?.lastSuccessAt).toEqual(nowDate);
    });

    it('4. ACTIVE -> INGEST_FAIL por CRON (intento 1 y 2) => ACTIVE con failedAttempts incrementado', () => {
      const source = createMockSource({ status: 'ACTIVE', failedAttempts: 0 });
      const res1 = transitionContextSource(source, 'INGEST_FAIL', 'CRON', {
        error: 'Timeout 504',
      });

      expect(res1.success).toBe(true);
      expect(res1.result?.status).toBe('ACTIVE');
      expect(res1.result?.failedAttempts).toBe(1);
      expect(res1.result?.lastError).toBe('Timeout 504');

      const res2 = transitionContextSource(res1.result!, 'INGEST_FAIL', 'CRON', {
        error: 'Timeout 504',
      });
      expect(res2.success).toBe(true);
      expect(res2.result?.status).toBe('ACTIVE');
      expect(res2.result?.failedAttempts).toBe(2);
    });

    it('5. ACTIVE -> INGEST_FAIL por CRON (tercer intento consecutivo) => DEGRADED (Circuit Breaker)', () => {
      const source = createMockSource({ status: 'ACTIVE', failedAttempts: 2 });
      const res = transitionContextSource(source, 'INGEST_FAIL', 'CRON', {
        error: 'HTTP 500 fatal',
      });

      expect(res.success).toBe(true);
      expect(res.result?.status).toBe('DEGRADED');
      expect(res.result?.failedAttempts).toBe(3);
      expect(res.result?.lastError).toBe('HTTP 500 fatal');
    });

    it('6. DEGRADED -> REACTIVATE por HUMAN => ACTIVE (failedAttempts reset a 0)', () => {
      const source = createMockSource({
        status: 'DEGRADED',
        failedAttempts: 3,
        lastError: 'HTTP 500',
      });
      const res = transitionContextSource(source, 'REACTIVATE', 'HUMAN');

      expect(res.success).toBe(true);
      expect(res.result?.status).toBe('ACTIVE');
      expect(res.result?.failedAttempts).toBe(0);
      expect(res.result?.lastError).toBeNull();
    });

    it('7. DEGRADED -> PROPOSE_CORRECTION por ARGOS => DEGRADED (permanece degradada)', () => {
      const source = createMockSource({ status: 'DEGRADED', failedAttempts: 3 });
      const res = transitionContextSource(source, 'PROPOSE_CORRECTION', 'ARGOS');

      expect(res.success).toBe(true);
      expect(res.result?.status).toBe('DEGRADED');
    });

    it('8a. ACTIVE -> DEACTIVATE por HUMAN => INACTIVE', () => {
      const source = createMockSource({ status: 'ACTIVE' });
      const res = transitionContextSource(source, 'DEACTIVATE', 'HUMAN');

      expect(res.success).toBe(true);
      expect(res.result?.status).toBe('INACTIVE');
    });

    it('8b. DEGRADED -> DEACTIVATE por HUMAN => INACTIVE', () => {
      const source = createMockSource({ status: 'DEGRADED', failedAttempts: 3 });
      const res = transitionContextSource(source, 'DEACTIVATE', 'HUMAN');

      expect(res.success).toBe(true);
      expect(res.result?.status).toBe('INACTIVE');
    });

    it('9. INACTIVE -> REACTIVATE por HUMAN => PENDING_APPROVAL', () => {
      const source = createMockSource({ status: 'INACTIVE', failedAttempts: 3 });
      const res = transitionContextSource(source, 'REACTIVATE', 'HUMAN');

      expect(res.success).toBe(true);
      expect(res.result?.status).toBe('PENDING_APPROVAL');
      expect(res.result?.failedAttempts).toBe(0);
    });
  });

  describe('Filtro A y Soberanía Biológica: Rechazo de transiciones ilegales', () => {
    it('debe rechazar promover a ACTIVE a un actor que no sea HUMAN (ej. ARGOS o CRON)', () => {
      const source = createMockSource({ status: 'PENDING_APPROVAL' });
      const resArgos = transitionContextSource(source, 'APPROVE', 'ARGOS');
      expect(resArgos.success).toBe(false);
      expect(resArgos.exitCode).toBe(422);

      const resCron = transitionContextSource(source, 'APPROVE', 'CRON');
      expect(resCron.success).toBe(false);
    });

    it('debe rechazar transiciones no contempladas (ej. ACTIVE -> APPROVE)', () => {
      const source = createMockSource({ status: 'ACTIVE' });
      const res = transitionContextSource(source, 'APPROVE', 'HUMAN');

      expect(res.success).toBe(false);
      expect(res.exitCode).toBe(422);
      expect(res.errors?.[0]).toContain("Transición ilegal: No está permitida la combinación");
    });

    it('debe rechazar INGEST_OK sobre una fuente INACTIVE o PENDING_APPROVAL', () => {
      const pendingSource = createMockSource({ status: 'PENDING_APPROVAL' });
      const resPending = transitionContextSource(pendingSource, 'INGEST_OK', 'CRON');
      expect(resPending.success).toBe(false);

      const inactiveSource = createMockSource({ status: 'INACTIVE' });
      const resInactive = transitionContextSource(inactiveSource, 'INGEST_OK', 'CRON');
      expect(resInactive.success).toBe(false);
    });
  });

  describe('CA-4: Circuit Breaker puro (applyIngestionResult)', () => {
    it('debe aplicar la secuencia 0 -> 1 -> 2 -> 3 (DEGRADED) en fallos continuados', () => {
      let source = createMockSource({ status: 'ACTIVE', failedAttempts: 0 });

      // Fallo 1
      const f1 = applyIngestionResult(source, { success: false, error: 'Network error' });
      expect(f1.success).toBe(true);
      expect(f1.result?.status).toBe('ACTIVE');
      expect(f1.result?.failedAttempts).toBe(1);
      source = f1.result!;

      // Fallo 2
      const f2 = applyIngestionResult(source, { success: false, error: 'Network error 2' });
      expect(f2.success).toBe(true);
      expect(f2.result?.status).toBe('ACTIVE');
      expect(f2.result?.failedAttempts).toBe(2);
      source = f2.result!;

      // Fallo 3 -> Disparo de Circuit Breaker
      const f3 = applyIngestionResult(source, { success: false, error: 'Network error 3' });
      expect(f3.success).toBe(true);
      expect(f3.result?.status).toBe('DEGRADED');
      expect(f3.result?.failedAttempts).toBe(3);
      expect(f3.result?.lastError).toBe('Network error 3');
    });

    it('debe resetear failedAttempts a 0 si tras 2 fallos el siguiente intento es exitoso', () => {
      const source = createMockSource({ status: 'ACTIVE', failedAttempts: 2 });
      const okRes = applyIngestionResult(source, { success: true });

      expect(okRes.success).toBe(true);
      expect(okRes.result?.status).toBe('ACTIVE');
      expect(okRes.result?.failedAttempts).toBe(0);
      expect(okRes.result?.lastSuccessAt).toBeInstanceOf(Date);
    });

    it('debe rechazar la ingesta si la fuente ya está en estado DEGRADED', () => {
      const source = createMockSource({ status: 'DEGRADED', failedAttempts: 3 });
      const res = applyIngestionResult(source, { success: true });

      expect(res.success).toBe(false);
      expect(res.exitCode).toBe(422);
    });
  });
});
