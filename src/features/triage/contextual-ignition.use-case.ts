import { IConversationalSLMPort } from '@/features/ai-engine';
import { ICognitiveMemoryPort } from '@/features/cognitive-memory';
import { TelemetryRepositoryPort, TelemetryEntry } from '@/features/telemetry';
import { IWeatherPort } from './weather.port';
import {
  classifyTimeWindow,
  detectDeviceType,
  IgnitionSensoryContextSchema,
  IgnitionSensoryContextDto,
  IgnitionOutcome,
  IgnitionSpark,
  TimeWindowPeriod,
  DeviceType,
} from './ignition.schema';
import { OperationEnvelope, createSuccessEnvelope } from '@/shared/operation-envelope';

export interface ContextualIgnitionInput {
  sessionId: string;
  userAgent?: string | null;
  language?: string;
  clientTimestamp?: number;
}

/**
 * Matriz declarativa de saludos canónicos heurísticos para Fail-Soft (Axioma III).
 */
const CANONICAL_HEURISTIC_GREETINGS: Record<TimeWindowPeriod, Record<DeviceType, string>> = {
  DAWN: {
    MOBILE: '¡Buenas noches! Si estás paseando a estas horas por Barcelona, cuéntame qué buscas y te guiamos con seguridad.',
    DESKTOP: '¿Planificando a deshoras? Vamos a dejar lista tu ruta táctica por Barcelona para que mañana no tengas que pensar en nada.',
    TABLET: 'Buenas noches. Si estás diseñando tu estancia tranquilamente, indícame tus preferencias para trazar tu itinerario.',
  },
  MORNING: {
    MOBILE: '¡Buenos días! Barcelona amanece en movimiento. ¿Buscamos un café con encanto o arrancamos la exploración?',
    DESKTOP: '¡Buenos días! Comenzamos a forjar tu ruta por Barcelona. ¿De cuánto tiempo dispones para hoy?',
    TABLET: '¡Buenos días! Explora la ciudad a tu ritmo. Cuéntame qué te apetece visitar hoy.',
  },
  AFTERNOON: {
    MOBILE: '¡Buenas tardes! ¿Hacemos una parada gastronómica o continuamos descubriendo rincones de la ciudad?',
    DESKTOP: '¡Buenas tardes! Vamos a optimizar la segunda mitad del día en Barcelona. ¿Qué plan tienes en mente?',
    TABLET: '¡Buenas tardes! Ideal para un paseo cultural o un descanso táctico. ¿Qué te gustaría priorizar?',
  },
  NIGHT: {
    MOBILE: '¡Buenas noches! La noche barcelonesa ofrece infinitas posibilidades. ¿Buscamos una buena cena o un paseo nocturno?',
    DESKTOP: '¡Buenas noches! Cerremos tu plan táctico para disfrutar de lo mejor de la noche en Barcelona.',
    TABLET: '¡Buenas noches! Momento de saborear la gastronomía y el ocio de la ciudad. ¿Por dónde empezamos?',
  },
};

/**
 * Caso de Uso: Ignición Contextual y Saludo Dinámico (Aduana Universal S+ Grade).
 */
export class ContextualIgnitionUseCase {
  constructor(
    private readonly conversationalSlm: IConversationalSLMPort,
    private readonly weatherPort: IWeatherPort,
    private readonly cognitiveMemory?: ICognitiveMemoryPort,
    private readonly telemetryRepo?: TelemetryRepositoryPort,
  ) {}

  async execute(input: ContextualIgnitionInput): Promise<OperationEnvelope<IgnitionOutcome>> {
    const startTime = Date.now();
    const serverTimestamp = startTime;
    const clientTimestamp = input.clientTimestamp && input.clientTimestamp > 0
      ? input.clientTimestamp
      : serverTimestamp;

    // 1. Detección horaria en Barcelona (Europe/Madrid)
    const detectedHour = this.getBarcelonaHour(clientTimestamp);
    const period = classifyTimeWindow(detectedHour);
    const device = detectDeviceType(input.userAgent);
    const language = (input.language || 'es').slice(0, 5);

    // 2. Telemetría meteorológica (Fail-Soft incorporado en el puerto)
    const weather = await this.weatherPort.getBarcelonaWeather();

    // 3. Recuperación de memoria cognitiva previa (LanceDB RAG)
    let priorMemoryExcerpt: string | undefined;
    if (this.cognitiveMemory) {
      try {
        const memory = await this.cognitiveMemory.getLatestSessionMemory(input.sessionId, 'default');
        if (memory) {
          const denseStr = memory.toDensePromptString();
          if (denseStr && denseStr !== '[Contexto: Base]') {
            priorMemoryExcerpt = denseStr;
          }
        }
      } catch (err) {
        // Fail-soft en lectura de LanceDB
        if (this.telemetryRepo) {
          void this.telemetryRepo.log(
            new TelemetryEntry(
              'WARN',
              'SYSTEM',
              `[Contextual Ignition] Fallo no bloqueante al consultar LanceDB: ${err instanceof Error ? err.message : String(err)}`,
              { sessionId: input.sessionId },
              500,
              0,
            ),
          ).catch(() => {});
        }
      }
    }

    // 4. Validación de esquema Zod determinista
    const sensoryContext: IgnitionSensoryContextDto = IgnitionSensoryContextSchema.parse({
      sessionId: input.sessionId,
      device,
      language,
      clientTimestamp,
      serverTimestamp,
      detectedHour,
      period,
      weatherSummary: weather.summary,
      temperatureCelsius: weather.temperatureCelsius,
      priorMemoryExcerpt,
    });

    // 5. Generación del saludo proactivo con el SLM (con fallback heurístico si agota timeout o falla)
    let greeting: string;
    let isFallback = false;

    try {
      greeting = await this.conversationalSlm.generateContextualGreeting(sensoryContext);
    } catch {
      greeting = CANONICAL_HEURISTIC_GREETINGS[period][device];
      isFallback = true;
    }

    // 6. Ensamblado de Chispas Tácticas Sensoriales
    const sparks: IgnitionSpark[] = [];

    // Chispa Meteorológica
    const weatherLocation = weather.summary.toLowerCase().includes('barcelona')
      ? ''
      : ' en Barcelona';
    sparks.push({
      id: `spark-weather-${serverTimestamp}`,
      type: 'weather',
      insight: `${weather.summary}${weatherLocation} (${weather.temperatureCelsius}ºC)${weather.isAdverse ? '. Considera actividades bajo cubierto.' : '.'}`,
      urgency: weather.isAdverse ? 'high' : 'low',
    });


    // Chispa de Continuidad si existe memoria previa
    if (priorMemoryExcerpt) {
      sparks.push({
        id: `spark-memory-${serverTimestamp}`,
        type: 'logistics',
        insight: `Sesión recuperada: ${priorMemoryExcerpt}.`,
        urgency: 'medium',
      });
    }

    const outcome: IgnitionOutcome = {
      greeting,
      isFallback,
      period,
      device,
      sparks,
      contextSummary: `Hora: ${detectedHour}:00 (${period}) | Dispositivo: ${device} | Clima: ${weather.summary} (${weather.temperatureCelsius}ºC)`,
    };

    const durationMs = Date.now() - startTime;
    if (this.telemetryRepo) {
      void this.telemetryRepo.log(
        new TelemetryEntry(
          'INFO',
          'SERVER_API',
          `[Contextual Ignition] Ignición completada para sesión ${input.sessionId.slice(0, 8)}... (${durationMs}ms)`,
          {
            sessionId: input.sessionId,
            period,
            device,
            isFallback,
            durationMs,
          },
          200,
          durationMs,
        ),
      ).catch(() => {});
    }


    return createSuccessEnvelope(outcome, 'Ignición contextual ejecutada con éxito');
  }

  private getBarcelonaHour(timestampMs: number): number {
    try {
      const formatter = new Intl.DateTimeFormat('es-ES', {
        timeZone: 'Europe/Madrid',
        hour: 'numeric',
        hour12: false,
      });
      const hourStr = formatter.format(new Date(timestampMs));
      const parsed = parseInt(hourStr, 10);
      return isNaN(parsed) ? 12 : parsed;
    } catch {
      return new Date(timestampMs).getHours();
    }
  }
}
