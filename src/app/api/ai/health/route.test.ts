import { describe, it, expect, vi } from 'vitest';
import { GET, createHealthHandler } from './route';
import { IaGatewayClient } from '@/features/ai-engine/server';

describe('GET /api/ai/health (PBI-GW-013)', () => {
  it('responde 200 con OperationEnvelope exitoso cuando el IA Gateway está sano', async () => {
    const mockClient = {
      evaluateHealth: vi.fn().mockResolvedValue({
        isHealthy: true,
        latencyMs: 18,
        statusCode: 200,
      }),
    };

    const handler = createHealthHandler(() => mockClient as unknown as IaGatewayClient);
    const response = await handler();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.exitCode).toBe(0);
    expect(data.result).toEqual({ status: 'healthy', latencyMs: 18 });
    expect(data.feedback).toBe('IA Gateway operacional');
    expect(data.errors).toBeUndefined();
  });

  it('responde 503 con OperationEnvelope de error cuando el IA Gateway responde 401 (secreto inválido)', async () => {
    const mockClient = {
      evaluateHealth: vi.fn().mockResolvedValue({
        isHealthy: false,
        latencyMs: 12,
        statusCode: 401,
        error: 'HTTP 401 en IA Gateway /healthz',
      }),
    };

    const handler = createHealthHandler(() => mockClient as unknown as IaGatewayClient);
    const response = await handler();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.success).toBe(false);
    expect(data.exitCode).toBe(1);
    expect(data.errors).toContain('HTTP 401 en IA Gateway /healthz');
    expect(data.feedback).toBe('IA Gateway degradado o inalcanzable');
  });

  it('responde 503 con OperationEnvelope de error cuando el IA Gateway responde 500', async () => {
    const mockClient = {
      evaluateHealth: vi.fn().mockResolvedValue({
        isHealthy: false,
        latencyMs: 25,
        statusCode: 500,
        error: 'HTTP 500 en IA Gateway /healthz',
      }),
    };

    const handler = createHealthHandler(() => mockClient as unknown as IaGatewayClient);
    const response = await handler();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.success).toBe(false);
    expect(data.exitCode).toBe(1);
    expect(data.errors).toContain('HTTP 500 en IA Gateway /healthz');
  });

  it('responde 503 cuando el IA Gateway es inalcanzable por timeout o fallo de red', async () => {
    const mockClient = {
      evaluateHealth: vi.fn().mockResolvedValue({
        isHealthy: false,
        latencyMs: 3000,
        error: 'Timeout en healthcheck de IA Gateway (3000ms)',
      }),
    };

    const handler = createHealthHandler(() => mockClient as unknown as IaGatewayClient);
    const response = await handler();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.success).toBe(false);
    expect(data.exitCode).toBe(1);
    expect(data.errors).toContain('Timeout en healthcheck de IA Gateway (3000ms)');
  });

  it('responde 503 si el cliente lanza una excepción no capturada en evaluateHealth', async () => {
    const mockClient = {
      evaluateHealth: vi.fn().mockRejectedValue(new Error('Fallo crítico de socket')),
    };

    const handler = createHealthHandler(() => mockClient as unknown as IaGatewayClient);
    const response = await handler();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.success).toBe(false);
    expect(data.exitCode).toBe(1);
    expect(data.errors).toContain('Fallo crítico de socket');
    expect(data.feedback).toBe('Fallo crítico en sonda IA Gateway');
  });

  it('no expone secretos ni variables de entorno sensibles en la respuesta', async () => {
    const mockClient = {
      evaluateHealth: vi.fn().mockResolvedValue({
        isHealthy: true,
        latencyMs: 14,
        statusCode: 200,
      }),
    };

    const handler = createHealthHandler(() => mockClient as unknown as IaGatewayClient);
    const response = await handler();
    const bodyText = JSON.stringify(await response.json());

    expect(bodyText).not.toContain('secret');
    expect(bodyText).not.toContain('key');
    expect(bodyText).not.toContain('bearer');
  });

  it('el export por defecto GET ejecuta evaluateHealth sin fallos sintácticos', async () => {
    // Verificamos que GET invoca el handler por defecto sin explotar
    const response = await GET();
    expect(response).toBeDefined();
    expect([200, 503]).toContain(response.status);
  });
});
