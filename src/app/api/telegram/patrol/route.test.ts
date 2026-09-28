import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockFindRecentActive,
  mockSendMessage,
  mockGetItineraryBySessionId,
  mockGetBarcelonaWeather,
  mockTelemetryLog,
} = vi.hoisted(() => {
  return {
    mockFindRecentActive: vi.fn(),
    mockSendMessage: vi.fn().mockResolvedValue(undefined),
    mockGetItineraryBySessionId: vi.fn(),
    mockGetBarcelonaWeather: vi.fn(),
    mockTelemetryLog: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('@/features/auth/prisma-user-anchor.repository', () => {
  return {
    PrismaUserAnchorRepository: class {
      findRecentActive = mockFindRecentActive;
    },
  };
});

vi.mock('@/features/telemetry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/telemetry')>();
  return {
    ...actual,
    PrismaTelemetryRepository: class {
      log = mockTelemetryLog;
    },
  };
});

vi.mock('@/features/telegram', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/telegram')>();
  return {
    ...actual,
    TelegramBotApiGateway: class {
      sendMessage = mockSendMessage;
      verifySecretHeader = vi.fn().mockReturnValue(true);
      isGatewayEnabled = vi.fn().mockReturnValue(true);
    },
  };
});

vi.mock('@/features/planner/prisma-itinerary.repository', () => {
  return {
    PrismaItineraryRepository: class {
      getItineraryBySessionId = mockGetItineraryBySessionId;
    },
  };
});

vi.mock('@/features/triage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/triage')>();
  return {
    ...actual,
    OpenMeteoWeatherAdapter: class {
      getBarcelonaWeather = mockGetBarcelonaWeather;
    },
  };
});

import { POST } from './route';

describe('POST /api/telegram/patrol (PBI-STEEL-001)', () => {
  const validSecret = 'test_patrol_secret_123456789012345678901234567890';
  const historicalLiteral = 'bcn_patrol_secret_default';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PATROL_SECRET_TOKEN = validSecret;
    mockGetBarcelonaWeather.mockResolvedValue({
      summary: 'Despejado',
      temperatureCelsius: 22,
      conditionCode: 0,
      isAdverse: false,
    });
  });

  it('responde 503 si PATROL_SECRET_TOKEN no está configurado', async () => {
    delete process.env.PATROL_SECRET_TOKEN;

    const req = new NextRequest('http://localhost:3000/api/telegram/patrol', {
      method: 'POST',
      headers: { 'x-telegram-patrol-token': validSecret },
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(mockTelemetryLog).toHaveBeenCalled();
    expect(mockFindRecentActive).not.toHaveBeenCalled();
  });

  it('rechaza con 401 si el token es incorrecto', async () => {
    const req = new NextRequest('http://localhost:3000/api/telegram/patrol', {
      method: 'POST',
      headers: { 'x-telegram-patrol-token': 'wrong-secret' },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('rechaza con 401 el literal histórico comprometido', async () => {
    const req = new NextRequest('http://localhost:3000/api/telegram/patrol', {
      method: 'POST',
      headers: { 'x-telegram-patrol-token': historicalLiteral },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('responde 400 si el cuerpo no cumple el esquema Zod', async () => {
    const req = new NextRequest('http://localhost:3000/api/telegram/patrol', {
      method: 'POST',
      headers: {
        'x-telegram-patrol-token': validSecret,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ sessionId: 'not-a-uuid', fatigueThresholdKm: -1 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('retorna éxito con dropsDispatched: 0 si no hay usuarios anclados', async () => {
    mockFindRecentActive.mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/telegram/patrol', {
      method: 'POST',
      headers: { 'x-telegram-patrol-token': validSecret },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.result.totalAnchorsChecked).toBe(0);
    expect(body.result.dropsDispatched).toBe(0);
    expect(JSON.stringify(body)).not.toMatch(/telegramChatId/);
  });

  it('ejecuta la patrulla y despacha drop sin filtrar identificadores en la respuesta', async () => {
    mockFindRecentActive.mockResolvedValue([
      {
        sessionId: 'sess-fatigue-999',
        telegramChatId: { getValue: () => 'chat-tg-999' },
      },
    ]);

    mockGetItineraryBySessionId.mockResolvedValue({
      id: 'itin-1',
      sessionId: 'sess-fatigue-999',
      summary: 'Ruta larga por Barcelona',
      waypoints: [
        { title: 'Plaça Catalunya', coordinates: { lat: 41.387, lng: 2.1701 } },
        { title: 'Sagrada Família', coordinates: { lat: 41.4036, lng: 2.1744 } },
        { title: 'Park Güell', coordinates: { lat: 41.4145, lng: 2.1527 } },
        { title: 'Casa Batlló', coordinates: { lat: 41.3916, lng: 2.1648 } },
        { title: 'Castell de Montjuïc', coordinates: { lat: 41.363, lng: 2.166 } },
      ],
    });

    const req = new NextRequest('http://localhost:3000/api/telegram/patrol', {
      method: 'POST',
      headers: {
        'x-telegram-patrol-token': validSecret,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ sessionId: '550e8400-e29b-41d4-a716-446655440099' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.result.totalAnchorsChecked).toBe(1);
    expect(body.result.dropsDispatched).toBe(1);
    expect(body.result.statusCounts.EVALUATED).toBe(1);
    expect(JSON.stringify(body)).not.toContain('chat-tg-999');
    expect(JSON.stringify(body)).not.toContain('telegramChatId');
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  it('despacha refugio por lluvia sin exponer telegramChatId', async () => {
    mockGetBarcelonaWeather.mockResolvedValue({
      summary: 'Lluvia torrencial',
      temperatureCelsius: 17,
      conditionCode: 65,
      isAdverse: true,
    });

    mockFindRecentActive.mockResolvedValue([
      {
        sessionId: 'sess-rain-888',
        telegramChatId: { getValue: () => 'chat-rain-888' },
      },
    ]);

    mockGetItineraryBySessionId.mockResolvedValue({
      id: 'itin-2',
      sessionId: 'sess-rain-888',
      summary: 'Ruta exterior',
      waypoints: [
        { title: 'Passeig de Gràcia', coordinates: { lat: 41.391, lng: 2.164 } },
        { title: 'Mirador al aire libre', coordinates: { lat: 41.392, lng: 2.165 } },
      ],
    });

    const req = new NextRequest('http://localhost:3000/api/telegram/patrol', {
      method: 'POST',
      headers: { 'x-telegram-patrol-token': validSecret },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.result.dropsDispatched).toBe(1);
    expect(JSON.stringify(body)).not.toContain('chat-rain-888');
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });
});
