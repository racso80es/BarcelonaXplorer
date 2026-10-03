import { z } from 'zod';
import {
  OperationEnvelope,
  createSuccessEnvelope,
  createErrorEnvelope,
} from '@/shared/operation-envelope';
import { ItineraryPersistencePort } from './itinerary-persistence.port';
import { TelemetryRepositoryPort, TelemetryEntry } from '@/features/telemetry';

export const UpdateNodeSelectionSchema = z.object({
  nodeId: z.string().min(1, 'nodeId es requerido'),
  optionId: z.string().min(1, 'optionId es requerido'),
});
export type UpdateNodeSelectionInput = z.infer<typeof UpdateNodeSelectionSchema>;

export const NodeTimeUpdateSchema = z.object({
  nodeId: z.string().min(1, 'nodeId es requerido'),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato HH:MM requerido para startTime'),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato HH:MM requerido para endTime')
    .optional(),
});
export type NodeTimeUpdate = z.infer<typeof NodeTimeUpdateSchema>;

export const ShiftNodeTimesSchema = z.object({
  updates: z
    .array(NodeTimeUpdateSchema)
    .min(1, 'Se requiere al menos una actualización horaria'),
});
export type ShiftNodeTimesInput = z.infer<typeof ShiftNodeTimesSchema>;

/**
 * Caso de Uso: Persistencia de selección de alternativas y reajuste cronológico en MySQL.
 *
 * Implementa el cierre de ciclo del Lienzo Interactivo (PBI-ARCH-ORCH-008):
 * - Persiste la conmutación de opciones A/B en el JSON y columnas del nodo.
 * - Persiste en lote los horarios del nodo editado y nodos posteriores propagados.
 * - Opera bajo fail-soft: registra telemetría sin propagar fallos a la interfaz de usuario.
 */
export class UpdateItineraryNodeUseCase {
  constructor(
    private readonly itineraryRepo: ItineraryPersistencePort,
    private readonly telemetryRepo?: TelemetryRepositoryPort,
  ) {}

  async selectOption(
    rawInput: unknown,
  ): Promise<OperationEnvelope<{ updated: boolean; nodeId: string; optionId: string }>> {
    const startTime = Date.now();
    const parsed = UpdateNodeSelectionSchema.safeParse(rawInput);
    if (!parsed.success) {
      return createErrorEnvelope(
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
        400,
        'Entrada de selección de opción inválida',
      );
    }

    const { nodeId, optionId } = parsed.data;

    try {
      const updated = await this.itineraryRepo.updateNodeSelection(nodeId, optionId);
      if (!updated) {
        await this.logTelemetry(
          'WARN',
          `[Itinerario] Clave no correlacionada o nodo no encontrado al seleccionar opción: ${nodeId}`,
          { nodeId, optionId },
          404,
          Date.now() - startTime,
        );
        return createErrorEnvelope(
          [`Nodo no encontrado o no correlacionado con clave: ${nodeId}`],
          404,
          'Fallo de correlación de nodo',
        );
      }

      await this.logTelemetry(
        'INFO',
        `[Itinerario] Selección de opción persistida con éxito en nodo: ${nodeId}`,
        { nodeId, optionId },
        200,
        Date.now() - startTime,
      );

      return createSuccessEnvelope({ updated: true, nodeId, optionId });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.logTelemetry(
        'ERROR',
        `[Itinerario] Error en persistencia de selección de opción: ${errorMsg}`,
        { nodeId, optionId, error: errorMsg },
        500,
        Date.now() - startTime,
      );
      return createErrorEnvelope(
        [errorMsg],
        500,
        'Error interno en persistencia de selección',
      );
    }
  }

  async shiftTimes(
    rawInput: unknown,
  ): Promise<OperationEnvelope<{ updatedCount: number }>> {
    const startTime = Date.now();
    const parsed = ShiftNodeTimesSchema.safeParse(rawInput);
    if (!parsed.success) {
      return createErrorEnvelope(
        parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
        400,
        'Entrada de actualización horaria inválida',
      );
    }

    const { updates } = parsed.data;
    let updatedCount = 0;
    const errors: string[] = [];

    try {
      for (const update of updates) {
        const success = await this.itineraryRepo.updateNodeTime(
          update.nodeId,
          update.startTime,
          update.endTime,
        );
        if (success) {
          updatedCount++;
        } else {
          errors.push(`Nodo no correlacionado o no encontrado: ${update.nodeId}`);
        }
      }

      if (errors.length > 0) {
        await this.logTelemetry(
          'WARN',
          `[Itinerario] Actualización horaria parcial o nodos no encontrados (${errors.length}/${updates.length})`,
          { updates, errors },
          207,
          Date.now() - startTime,
        );
      } else {
        await this.logTelemetry(
          'INFO',
          `[Itinerario] Horarios propagados persistidos con éxito (${updatedCount} nodos)`,
          { updatedCount },
          200,
          Date.now() - startTime,
        );
      }

      return createSuccessEnvelope(
        { updatedCount },
        errors.length > 0 ? 'Actualización parcial' : undefined,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.logTelemetry(
        'ERROR',
        `[Itinerario] Error al persistir propagación horaria: ${errorMsg}`,
        { error: errorMsg },
        500,
        Date.now() - startTime,
      );
      return createErrorEnvelope(
        [errorMsg],
        500,
        'Error interno al persistir propagación horaria',
      );
    }
  }

  private async logTelemetry(
    level: 'INFO' | 'WARN' | 'ERROR',
    message: string,
    payload: Record<string, unknown>,
    statusCode: number,
    durationMs: number,
  ): Promise<void> {
    if (!this.telemetryRepo) return;
    try {
      await this.telemetryRepo.log(
        new TelemetryEntry(
          level,
          'SERVER_API',
          message,
          payload,
          statusCode,
          durationMs,
        ),
      );
    } catch {
      // fail-soft telemetría
    }
  }
}
