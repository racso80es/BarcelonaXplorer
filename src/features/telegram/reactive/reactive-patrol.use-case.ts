// ═══════════════════════════════════════════════════════════════
// Vertical Slice: Telegram / Reactive
// Caso de Uso: ReactivePatrolUseCase (Axiomas I, II, III, IV, V)
// Marco Constitucional: Protocolo de Acero — Grado S+
// ═══════════════════════════════════════════════════════════════

import {
  OperationEnvelope,
  createSuccessEnvelope,
  createErrorEnvelope,
} from '@/shared/operation-envelope';
import { TelegramBotGatewayPort } from '../telegram-bot-gateway.port';
import { IWeatherPort, WeatherReport } from '@/features/triage/weather.port';
import {
  IReactivePatrolUseCasePort,
  PatrolEvaluationInput,
} from './reactive-patrol.use-case.port';
import { ReactiveDropResult } from './reactive-drops.schema';
import { GeometricFatigueVo, WaypointCoordinate } from './geometric-fatigue.vo';
import { findNearestIndoorShelter } from './indoor-tactical-shelters';

export class ReactivePatrolUseCase implements IReactivePatrolUseCasePort {
  private static readonly CABIFY_CPA_URL =
    'https://cabify.com/es/promos?code=BCNXPLORER&discount=15';
  private static readonly DEFAULT_BARCELONA_CENTER = { lat: 41.3879, lng: 2.1699 };

  constructor(
    private readonly telegramGateway: TelegramBotGatewayPort,
    private readonly weatherPort: IWeatherPort
  ) {}

  async execute(
    input: PatrolEvaluationInput
  ): Promise<OperationEnvelope<ReactiveDropResult>> {
    // 1. Validación Inmediata de Frontera
    if (!input.sessionId?.trim() || !input.telegramChatId?.trim()) {
      return createErrorEnvelope<ReactiveDropResult>(
        ['Identificador de sesión o telegramChatId ausente en patrulla reactiva.'],
        1
      );
    }

    try {
      // 2. Escenario 2: Refugio Táctico por Entropía Ambiental (Clima / Lluvia)
      let weather: WeatherReport | null = null;
      try {
        weather = await this.weatherPort.getBarcelonaWeather();
      } catch {
        // Tolerancia Fail-Soft ante caída puntual del sensor meteorológico
        weather = null;
      }

      if (weather && weather.isAdverse) {
        return await this.dispatchWeatherShelterDrop(input, weather);
      }

      // 3. Escenario 1: Drop de Alivio por Fatiga Geométrica (> 5.0 km acumulados)
      const validCoordinates: WaypointCoordinate[] = input.completedWaypoints
        .filter(
          (wp): wp is typeof wp & { lat: number; lng: number } =>
            typeof wp.lat === 'number' && typeof wp.lng === 'number'
        )
        .map((wp) => ({ lat: wp.lat, lng: wp.lng, title: wp.title }));

      if (validCoordinates.length >= 2) {
        const fatigueVo = GeometricFatigueVo.create(validCoordinates);
        const thresholdKm = input.fatigueThresholdKm ?? 5.0;

        if (fatigueVo.isFatigueThresholdExceeded(thresholdKm)) {
          return await this.dispatchFatigueReliefDrop(input, fatigueVo);
        }
      }

      // 4. Condición Nominal: Sin alertas ni fatiga crítica
      return createSuccessEnvelope<ReactiveDropResult>({
        dispatched: false,
        dropType: 'NONE',
        reason: 'Condiciones nominales: sin alertas meteorológicas ni fatiga acumulada crítica.',
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return createErrorEnvelope<ReactiveDropResult>(
        [`Fallo en la ejecución de la patrulla reactiva: ${msg}`],
        1,
        'Degradación controlada en patrulla reactiva (Fail-Soft)'
      );
    }
  }

  private async dispatchWeatherShelterDrop(
    input: PatrolEvaluationInput,
    weather: WeatherReport
  ): Promise<OperationEnvelope<ReactiveDropResult>> {
    // Determinación del punto de referencia espacial para el refugio
    const referenceCoords =
      input.nextWaypoint?.lat && input.nextWaypoint?.lng
        ? { lat: input.nextWaypoint.lat, lng: input.nextWaypoint.lng }
        : input.completedWaypoints.length > 0 &&
          input.completedWaypoints[input.completedWaypoints.length - 1]?.lat &&
          input.completedWaypoints[input.completedWaypoints.length - 1]?.lng
        ? {
            lat: input.completedWaypoints[input.completedWaypoints.length - 1].lat!,
            lng: input.completedWaypoints[input.completedWaypoints.length - 1].lng!,
          }
        : ReactivePatrolUseCase.DEFAULT_BARCELONA_CENTER;

    const nearestShelter = findNearestIndoorShelter(referenceCoords);

    const messageText =
      `🌧️ <b>Alerta Meteorológica: Refugio Táctico Inminente</b>\n\n` +
      `Lluvia inminente en 15 minutos en Barcelona (${weather.summary}, ${weather.temperatureCelsius}°C).\n` +
      `Cancela el mirador o tramo al aire libre y refúgiate en <b>${nearestShelter.name}</b>; saca el ticket rápido aquí.`;

    const buttons = [
      [
        {
          text: `🏛️ Refugio en ${nearestShelter.name}`,
          url: nearestShelter.cpaUrl,
        },
      ],
    ];

    await this.telegramGateway.sendMessage(input.telegramChatId, messageText, buttons);

    return createSuccessEnvelope<ReactiveDropResult>(
      {
        dispatched: true,
        dropType: 'WEATHER_SHELTER',
        telegramChatId: input.telegramChatId,
        reason: `Alerta meteorológica activada (${weather.summary}). Refugio asignado: ${nearestShelter.name}.`,
        messagePreview: messageText,
      },
      'Drop de refugio táctico por lluvia despachado exitosamente.'
    );
  }

  private async dispatchFatigueReliefDrop(
    input: PatrolEvaluationInput,
    fatigueVo: GeometricFatigueVo
  ): Promise<OperationEnvelope<ReactiveDropResult>> {
    const accumulatedKm = fatigueVo.calculateTotalDistanceKm();
    const targetTitle = input.nextWaypoint?.title || 'tu siguiente destino';

    const messageText =
      `⚠️ <b>Drop Táctico de Movilidad (Fatiga Acumulada)</b>\n\n` +
      `Llevas mucha tralla en las piernas (${accumulatedKm} km caminados).\n` +
      `Si quieres saltarte la caminata hasta <b>${targetTitle}</b>, aquí tienes un Cabify con descuento para el último tramo.`;

    const buttons = [
      [
        {
          text: '🚖 Cabify con Descuento (15%)',
          url: ReactivePatrolUseCase.CABIFY_CPA_URL,
        },
      ],
    ];

    await this.telegramGateway.sendMessage(input.telegramChatId, messageText, buttons);

    return createSuccessEnvelope<ReactiveDropResult>(
      {
        dispatched: true,
        dropType: 'FATIGUE_RELIEF',
        telegramChatId: input.telegramChatId,
        reason: `Fatiga acumulada (${accumulatedKm} km) supera el umbral. Drop de movilidad despachado.`,
        messagePreview: messageText,
      },
      'Drop de alivio por fatiga geométrica despachado exitosamente.'
    );
  }
}
