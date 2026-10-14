import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GatewayConversationalSlmAdapter } from './gateway-conversational-slm.adapter';
import type { IaGatewayClient } from './ia-gateway.client';
import type { TelemetryRepositoryPort } from '@/features/telemetry';

describe('GatewayConversationalSlmAdapter (CA-5, CA-6, CA-7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env['GROQ_API_KEY'];
    delete process.env['GROQ_FAST_MODEL'];
  });

  const mockTelemetry: TelemetryRepositoryPort = {
    log: vi.fn().mockResolvedValue(undefined),
    getRecentLogs: vi.fn().mockResolvedValue([]),
    prune: vi.fn().mockResolvedValue(0),
  };

  it('CA-5: getActiveModelId devuelve el identificador de modelo configurado sin leer process.env', () => {
    const adapter = new GatewayConversationalSlmAdapter();
    expect(adapter.getActiveModelId()).toBe('llama-3.3-70b-versatile');

    const customAdapter = new GatewayConversationalSlmAdapter(
      undefined,
      undefined,
      'qwen/qwen3.8-27b'
    );
    expect(customAdapter.getActiveModelId()).toBe('qwen/qwen3.8-27b');
  });

  it('CA-7: generateBounceMessage genera mensaje si el cliente responde, y reserva si falla', async () => {
    const mockClient = {
      generateText: vi.fn().mockResolvedValue('Barcelona tiene mil rincones increíbles esperándote.'),
    } as unknown as IaGatewayClient;

    const adapter = new GatewayConversationalSlmAdapter(mockClient, mockTelemetry);
    const msg = await adapter.generateBounceMessage('Madrid', 'Ruta por Gran Vía');
    expect(msg).toBe('Barcelona tiene mil rincones increíbles esperándote.');

    // Simular caída o falta de clave en el cliente
    const failingClient = {
      generateText: vi.fn().mockRejectedValue(new Error('GROQ_API_KEY no configurada en el gateway')),
    } as unknown as IaGatewayClient;

    const failingAdapter = new GatewayConversationalSlmAdapter(failingClient, mockTelemetry);
    const fallbackMsg = await failingAdapter.generateBounceMessage('Madrid', 'Ruta por Gran Vía');

    expect(fallbackMsg).toContain('calibrado exclusivamente para el asfalto de Barcelona');
    expect(fallbackMsg).not.toContain('GROQ_API_KEY');
    expect(fallbackMsg).not.toContain('gateway');
  });

  it('CA-6 y CA-7: generateRepromptMessage devuelve la repregunta o reserva ante fallo', async () => {
    const mockClient = {
      generateText: vi.fn().mockResolvedValue('¿Cuántas horas tenéis para esta visita?'),
    } as unknown as IaGatewayClient;

    const adapter = new GatewayConversationalSlmAdapter(mockClient, mockTelemetry);
    const reprompt = await adapter.generateRepromptMessage('time_window', 'Quiero ver el Born');
    expect(reprompt).toBe('¿Cuántas horas tenéis para esta visita?');

    const failingClient = {
      generateText: vi.fn().mockRejectedValue(new Error('503 Service Unavailable')),
    } as unknown as IaGatewayClient;

    const failingAdapter = new GatewayConversationalSlmAdapter(failingClient, mockTelemetry);
    const fallback = await failingAdapter.generateRepromptMessage('group_size', 'Ir a cenar');
    expect(fallback).toContain('¿cuántas personas seréis?');

    // CA-8: fallback de concrete_date nombra el día y pide fecha concreta sin preguntar por horas
    const dateFallback = await failingAdapter.generateRepromptMessage(
      'concrete_date',
      'Quiero una ruta cultural el domingo',
    );
    expect(dateFallback).toContain('domingo');
    expect(dateFallback).toContain('fecha concreta');
    expect(dateFallback).not.toContain('cuántas horas');
  });

  it('CA-6 y CA-7: generateEmpatheticDialogue devuelve diálogo empático o reserva ante fallo', async () => {
    const mockClient = {
      generateText: vi.fn().mockResolvedValue('Un café al sol por Gràcia siempre sienta de maravilla.'),
    } as unknown as IaGatewayClient;

    const adapter = new GatewayConversationalSlmAdapter(mockClient, mockTelemetry);
    const res = await adapter.generateEmpatheticDialogue('Qué buen día hace hoy');
    expect(res.message).toBe('Un café al sol por Gràcia siempre sienta de maravilla.');

    const failingClient = {
      generateText: vi.fn().mockRejectedValue(new Error('Network error')),
    } as unknown as IaGatewayClient;

    const failingAdapter = new GatewayConversationalSlmAdapter(failingClient, mockTelemetry);
    const fallback = await failingAdapter.generateEmpatheticDialogue('Hola');
    expect(fallback.message).toContain('relajarse en una terracita');
  });

  it('CA-6: generateContextualGreeting devuelve saludo contextual o reserva según sensor', async () => {
    const mockClient = {
      generateText: vi.fn().mockResolvedValue('¡Hola! Gràcia te espera en una mañana luminosa.'),
    } as unknown as IaGatewayClient;

    const adapter = new GatewayConversationalSlmAdapter(mockClient, mockTelemetry);
    const greeting = await adapter.generateContextualGreeting({
      sessionId: 'sess-1',
      device: 'DESKTOP',
      language: 'es',
      clientTimestamp: 1000,
      serverTimestamp: 1001,
      detectedHour: 10,
      period: 'MORNING',
    });
    expect(greeting).toBe('¡Hola! Gràcia te espera en una mañana luminosa.');

    const failingClient = {
      generateText: vi.fn().mockRejectedValue(new Error('Timeout')),
    } as unknown as IaGatewayClient;

    const failingAdapter = new GatewayConversationalSlmAdapter(failingClient, mockTelemetry);
    const fallback = await failingAdapter.generateContextualGreeting({
      sessionId: 'sess-2',
      device: 'MOBILE',
      language: 'es',
      clientTimestamp: 2000,
      serverTimestamp: 2001,
      detectedHour: 17,
      period: 'AFTERNOON',
    });
    expect(fallback).toContain('¡Buenas tardes!');
  });

  it('detectLanguageIntent clasifica con JSON o cae a idioma actual ante fallo', async () => {
    const mockClient = {
      generateText: vi.fn().mockResolvedValue('{"language":"en"}'),
    } as unknown as IaGatewayClient;

    const adapter = new GatewayConversationalSlmAdapter(mockClient, mockTelemetry);
    const lang = await adapter.detectLanguageIntent('Hello, show me around', 'es');
    expect(lang).toBe('en');

    const failingClient = {
      generateText: vi.fn().mockRejectedValue(new Error('Down')),
    } as unknown as IaGatewayClient;

    const failingAdapter = new GatewayConversationalSlmAdapter(failingClient, mockTelemetry);
    const fallbackLang = await failingAdapter.detectLanguageIntent('Bonjour', 'ca');
    expect(fallbackLang).toBe('ca');
  });

  it('PBI-ORCH-PRO-002 CA-4: generateClaudicationMessage genera frase de claudicación en idioma de sesión y cae al diccionario ante fallo', async () => {
    const mockClient = {
      generateText: vi.fn().mockResolvedValue('No se ha podido cerrar el horario de la ruta en este momento. Puedes reenviar tu consulta.'),
    } as unknown as IaGatewayClient;

    const adapter = new GatewayConversationalSlmAdapter(mockClient, mockTelemetry);
    const msg = await adapter.generateClaudicationMessage('Ruta en 2 horas', 'es');
    expect(msg).toBe('No se ha podido cerrar el horario de la ruta en este momento. Puedes reenviar tu consulta.');

    // Fallback ante fallo
    const failingClient = {
      generateText: vi.fn().mockRejectedValue(new Error('Gateway timeout')),
    } as unknown as IaGatewayClient;

    const failingAdapter = new GatewayConversationalSlmAdapter(failingClient, mockTelemetry);
    const fallbackMsg = await failingAdapter.generateClaudicationMessage('Ruta en 2 horas', 'es');
    expect(fallbackMsg).toContain('El motor de rutas no está disponible temporalmente');
    expect(fallbackMsg).not.toContain('aduana');
    expect(fallbackMsg).not.toContain('Zod');
    expect(fallbackMsg).not.toContain('contrato de datos');
  });
});
