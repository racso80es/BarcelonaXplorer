import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockFindMany,
  mockSendMessage,
  mockGetItineraryBySessionId,
  mockGetBarcelonaWeather,
} = vi.hoisted(() => {
  return {
    mockFindMany: vi.fn(),
    mockSendMessage: vi.fn().mockResolvedValue(undefined),
    mockGetItineraryBySessionId: vi.fn(),
    mockGetBarcelonaWeather: vi.fn(),
  };
});

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      userAnchor = {
        findMany: mockFindMany,
      };
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

describe('POST /api/telegram/patrol (Aduana y Centinela EDA)', () => {
  const validSecret = 'test_patrol_secret_123';

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

  it('rechaza con 401 si no se envía la cabecera secreta autorizada', async () => {
    const req = new NextRequest('http://localhost:3000/api/telegram/patrol', {
      method: 'POST',
      headers: {
        'x-telegram-patrol-token': 'wrong-secret',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).toContain('Unauthorized');
  });

  it('retorna 200 con dropsDispatched: 0 si no hay usuarios anclados', async () => {
    mockFindMany.mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/telegram/patrol', {
      method: 'POST',
      headers: {
        'x-telegram-patrol-token': validSecret,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.totalAnchorsChecked).toBe(0);
    expect(body.dropsDispatched).toBe(0);
  });

  it('ejecuta la patrulla, evalúa fatiga y despacha drop al usuario con ruta > 5km', async () => {
    mockFindMany.mockResolvedValue([
      {
        sessionId: 'sess-fatigue-999',
        telegramChatId: 'chat-tg-999',
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
      body: JSON.stringify({ sessionId: 'sess-fatigue-999' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.totalAnchorsChecked).toBe(1);
    expect(body.dropsDispatched).toBe(1);
    expect(body.details[0].outcome.result.dropType).toBe('FATIGUE_RELIEF');
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });

  it('ejecuta la patrulla y despacha refugio por lluvia inminente', async () => {
    mockGetBarcelonaWeather.mockResolvedValue({
      summary: 'Lluvia torrencial',
      temperatureCelsius: 17,
      conditionCode: 65,
      isAdverse: true,
    });

    mockFindMany.mockResolvedValue([
      {
        sessionId: 'sess-rain-888',
        telegramChatId: 'chat-rain-888',
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
      headers: {
        'x-telegram-patrol-token': validSecret,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.dropsDispatched).toBe(1);
    expect(body.details[0].outcome.result.dropType).toBe('WEATHER_SHELTER');
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
  });
});
