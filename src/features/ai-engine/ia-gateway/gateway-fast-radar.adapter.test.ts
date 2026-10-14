import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GatewayFastRadarAdapter } from './gateway-fast-radar.adapter';
import type { IaGatewayClient } from './ia-gateway.client';
import type { FastContextDto } from '@/features/ai-engine';
import type { TelemetryRepositoryPort } from '@/features/telemetry';

describe('GatewayFastRadarAdapter (CA-5, CA-6, CA-7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env['GROQ_API_KEY'];
    delete process.env['GROQ_FAST_MODEL'];
  });

  const sampleContext: FastContextDto = {
    intention: 'Quiero tomar un café tranquilo por Gràcia',
    currentLocation: 'Plaça del Sol',
    localTime: '10:30',
  };

  const mockTelemetry: TelemetryRepositoryPort = {
    log: vi.fn().mockResolvedValue(undefined),
    getRecentLogs: vi.fn().mockResolvedValue([]),
    prune: vi.fn().mockResolvedValue(0),
  };

  it('CA-7: con el cliente sustituido, el radar emite el NDJSON de insights en el stream', async () => {
    const ndjsonContent =
      '{"category":"environmental","observation":"Día soleado y agradable en Gràcia","severityLevel":1}\n' +
      '{"category":"transit","observation":"Calles peatonales con tránsito fluido","severityLevel":1}\n';

    const mockClient = {
      generateText: vi.fn().mockResolvedValue(ndjsonContent),
    } as unknown as IaGatewayClient;

    const adapter = new GatewayFastRadarAdapter(mockClient, mockTelemetry);
    const stream = await adapter.generateImmediateContextStream(sampleContext);

    expect(stream).toBeInstanceOf(ReadableStream);

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      accumulated += decoder.decode(value);
    }

    const lines = accumulated.trim().split('\n');
    expect(lines).toHaveLength(2);

    const parsed1 = JSON.parse(lines[0]!);
    expect(parsed1.category).toBe('environmental');
    expect(parsed1.severityLevel).toBe(1);

    const parsed2 = JSON.parse(lines[1]!);
    expect(parsed2.category).toBe('transit');
    expect(parsed2.severityLevel).toBe(1);

    expect(mockClient.generateText).toHaveBeenCalledWith(
      expect.stringContaining('Plaça del Sol'),
      'FAST_LLM',
      expect.objectContaining({ temperature: 0.6 })
    );
  });

  it('CA-6: si el gateway responde texto no parseable, emite la línea de reserva definida', async () => {
    const mockClient = {
      generateText: vi.fn().mockResolvedValue('Texto plano sin formato NDJSON alguno'),
    } as unknown as IaGatewayClient;

    const adapter = new GatewayFastRadarAdapter(mockClient, mockTelemetry);
    const stream = await adapter.generateImmediateContextStream(sampleContext);

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      accumulated += decoder.decode(value);
    }

    const lines = accumulated.trim().split('\n');
    expect(lines).toHaveLength(1);
    const fallback = JSON.parse(lines[0]!);
    expect(fallback.category).toBe('transit');
    expect(fallback.observation).toContain('Radar BX temporalmente fuera de alcance');
  });

  it('CA-6: si el gateway está caído o falta credencial, propaga el error para responder error HTTP', async () => {
    const mockClient = {
      generateText: vi.fn().mockRejectedValue(new Error('IA Gateway inalcanzable (503)')),
    } as unknown as IaGatewayClient;

    const adapter = new GatewayFastRadarAdapter(mockClient, mockTelemetry);

    await expect(adapter.generateImmediateContextStream(sampleContext)).rejects.toThrow(
      'IA Gateway inalcanzable (503)'
    );
  });
});
