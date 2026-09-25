import type {
  FastContextDto,
  FastInteractionAiPort,
} from '@/features/ai-engine';

/**
 * Caso de Uso: Generar micro-tip del Radar BX en streaming.
 *
 * Actúa como intermediario entre la capa de Presentación (HTTP)
 * y el Puerto de Salida (IA), blindando la Regla de Dependencia
 * de los anillos concéntricos. La capa HTTP nunca conoce la
 * implementación concreta del adaptador de IA.
 */
export class GenerateFastRadarUseCase {
  constructor(private readonly aiPort: FastInteractionAiPort) {}

  execute(context: FastContextDto): Promise<ReadableStream> {
    return this.aiPort.generateImmediateContextStream(context);
  }
}
