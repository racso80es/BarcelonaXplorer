import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReactivePatrolUseCase } from './reactive-patrol.use-case';
import { TelegramBotGatewayPort, TelegramButton } from '../telegram-bot-gateway.port';
import { IWeatherPort, WeatherReport } from '@/features/triage/weather.port';

describe('ReactivePatrolUseCase (Historia de Usuario 11 - EDA S+ Grade)', () => {
  let mockTelegramGateway: TelegramBotGatewayPort;
  let mockWeatherPort: IWeatherPort;
  let useCase: ReactivePatrolUseCase;

  const nominalWeather: WeatherReport = {
    summary: 'Soleado y templado',
    temperatureCelsius: 22,
    conditionCode: 0,
    isAdverse: false,
  };

  const adverseRainWeather: WeatherReport = {
    summary: 'Lluvia moderada con tormenta inminente',
    temperatureCelsius: 16,
    conditionCode: 61,
    isAdverse: true,
  };

  beforeEach(() => {
    mockTelegramGateway = {
      sendMessage: vi.fn().mockResolvedValue(undefined),
      verifySecretHeader: vi.fn().mockReturnValue(true),
      getMe: vi.fn().mockResolvedValue(null),
      getWebhookInfo: vi.fn().mockResolvedValue(null),
      isGatewayEnabled: vi.fn().mockReturnValue(true),
    };

    mockWeatherPort = {
      getBarcelonaWeather: vi.fn().mockResolvedValue(nominalWeather),
    };

    useCase = new ReactivePatrolUseCase(mockTelegramGateway, mockWeatherPort);
  });

  it('PBI-STEEL-013: sin progreso registrado no dispara drop de fatiga', async () => {
    const res = await useCase.execute({
      sessionId: 'sess-no-progress',
      telegramChatId: 'chat-no-progress',
      completedWaypoints: [],
      nextWaypoint: null,
      fatigueThresholdKm: 0.1,
    });

    expect(res.success).toBe(true);
    expect(res.result?.dispatched).toBe(false);
    expect(mockTelegramGateway.sendMessage).not.toHaveBeenCalled();
  });

  it('retorna error envelope si falta sessionId o telegramChatId', async () => {
    const res = await useCase.execute({
      sessionId: '',
      telegramChatId: '',
      completedWaypoints: [],
    });

    expect(res.success).toBe(false);
    expect(res.errors?.[0]).toMatch(/Identificador de sesión o telegramChatId/);
  });

  it('Escenario 1: Despacha Drop de Alivio por Fatiga Geométrica si la ruta acumulada supera 5.0 km', async () => {
    // Secuencia de waypoints que supera 6 km: Pl Catalunya -> Sagrada Família -> Park Güell -> Casa Batlló
    const completedWaypoints = [
      { lat: 41.387, lng: 2.1701, title: 'Plaça Catalunya' },
      { lat: 41.4036, lng: 2.1744, title: 'Sagrada Família' },
      { lat: 41.4145, lng: 2.1527, title: 'Park Güell' },
      { lat: 41.3916, lng: 2.1648, title: 'Casa Batlló' },
    ];

    const nextWaypoint = {
      lat: 41.363,
      lng: 2.166,
      title: 'Castell de Montjuïc',
    };

    const res = await useCase.execute({
      sessionId: 'sess-active-001',
      telegramChatId: 'chat-user-123',
      completedWaypoints,
      nextWaypoint,
    });

    expect(res.success).toBe(true);
    expect(res.result?.dispatched).toBe(true);
    expect(res.result?.dropType).toBe('FATIGUE_RELIEF');
    expect(res.result?.telegramChatId).toBe('chat-user-123');

    // Verifica que se invocó Telegram con el mensaje de movilidad y el botón CPA
    expect(mockTelegramGateway.sendMessage).toHaveBeenCalledTimes(1);
    const [sentChatId, sentText, sentButtons] = vi.mocked(
      mockTelegramGateway.sendMessage
    ).mock.calls[0];

    expect(sentChatId).toBe('chat-user-123');
    expect(sentText).toContain('Llevas mucha tralla en las piernas');
    expect(sentText).toContain('Castell de Montjuïc');
    expect(sentText).toContain('Cabify con descuento');

    const flatButtons: TelegramButton[] = sentButtons?.flat() ?? [];
    expect(flatButtons.length).toBe(1);
    expect(flatButtons[0].text).toContain('Cabify');
    expect(flatButtons[0].url).toContain('cabify.com');
  });

  it('Escenario 2: Despacha Drop de Refugio Táctico si se detecta entropía climática adversa (Lluvia)', async () => {
    vi.mocked(mockWeatherPort.getBarcelonaWeather).mockResolvedValue(adverseRainWeather);

    const completedWaypoints = [
      { lat: 41.387, lng: 2.1701, title: 'Plaça Catalunya' },
    ];

    const nextWaypoint = {
      lat: 41.392,
      lng: 2.165,
      title: 'Mirador al aire libre',
    };

    const res = await useCase.execute({
      sessionId: 'sess-weather-002',
      telegramChatId: 'chat-weather-456',
      completedWaypoints,
      nextWaypoint,
    });

    expect(res.success).toBe(true);
    expect(res.result?.dispatched).toBe(true);
    expect(res.result?.dropType).toBe('WEATHER_SHELTER');

    expect(mockTelegramGateway.sendMessage).toHaveBeenCalledTimes(1);
    const [sentChatId, sentText, sentButtons] = vi.mocked(
      mockTelegramGateway.sendMessage
    ).mock.calls[0];

    expect(sentChatId).toBe('chat-weather-456');
    expect(sentText).toContain('Alerta Meteorológica: Refugio Táctico Inminente');
    expect(sentText).toContain('Casa Batlló'); // Refugio más próximo a (41.392, 2.165)
    expect(sentText).toContain('Lluvia inminente');

    const flatButtons = sentButtons?.flat() ?? [];
    expect(flatButtons[0].text).toContain('Casa Batlló');
    expect(flatButtons[0].url).toMatch(/^https:\/\//);
  });

  it('Condición Nominal: Retorna dispatched: false si el clima es bueno y la fatiga es menor a 5 km', async () => {
    const completedWaypoints = [
      { lat: 41.387, lng: 2.1701, title: 'Plaça Catalunya' },
      { lat: 41.4036, lng: 2.1744, title: 'Sagrada Família' }, // ~1.9 km
    ];

    const res = await useCase.execute({
      sessionId: 'sess-nominal',
      telegramChatId: 'chat-nominal',
      completedWaypoints,
      nextWaypoint: { lat: 41.3916, lng: 2.1648, title: 'Passeig de Gràcia' },
    });

    expect(res.success).toBe(true);
    expect(res.result?.dispatched).toBe(false);
    expect(res.result?.dropType).toBe('NONE');
    expect(mockTelegramGateway.sendMessage).not.toHaveBeenCalled();
  });

  it('Fail-Soft: Absorbe fallo de la API meteorológica y evalúa fatiga sin crashear', async () => {
    vi.mocked(mockWeatherPort.getBarcelonaWeather).mockRejectedValue(
      new Error('Timeout de conexión OpenMeteo')
    );

    const completedWaypoints = [
      { lat: 41.387, lng: 2.1701, title: 'Plaça Catalunya' },
      { lat: 41.4036, lng: 2.1744, title: 'Sagrada Família' },
      { lat: 41.4145, lng: 2.1527, title: 'Park Güell' },
      { lat: 41.3916, lng: 2.1648, title: 'Casa Batlló' },
    ];

    const res = await useCase.execute({
      sessionId: 'sess-fail-soft',
      telegramChatId: 'chat-fail-soft',
      completedWaypoints,
      nextWaypoint: { title: 'Destino final' },
    });

    expect(res.success).toBe(true);
    expect(res.result?.dispatched).toBe(true);
    expect(res.result?.dropType).toBe('FATIGUE_RELIEF');
  });

  it('Fail-Soft: Si el envío de Telegram falla por error de red, retorna sobre con error controlado', async () => {
    vi.mocked(mockWeatherPort.getBarcelonaWeather).mockResolvedValue(adverseRainWeather);
    vi.mocked(mockTelegramGateway.sendMessage).mockRejectedValue(
      new Error('Telegram API 502 Bad Gateway')
    );

    const res = await useCase.execute({
      sessionId: 'sess-tg-fail',
      telegramChatId: 'chat-tg-fail',
      completedWaypoints: [],
      nextWaypoint: { lat: 41.39, lng: 2.16, title: 'Exterior' },
    });

    expect(res.success).toBe(false);
    expect(res.errors?.[0]).toContain('Telegram API 502 Bad Gateway');
    expect(res.feedback).toContain('Degradación controlada');
  });
});
