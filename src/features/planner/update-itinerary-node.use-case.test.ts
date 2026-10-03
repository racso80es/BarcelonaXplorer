import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UpdateItineraryNodeUseCase,
} from './update-itinerary-node.use-case';
import { ItineraryPersistencePort } from './itinerary-persistence.port';
import { TelemetryRepositoryPort } from '@/features/telemetry';

describe('UpdateItineraryNodeUseCase (PBI-ARCH-ORCH-008)', () => {
  let mockItineraryRepo: ItineraryPersistencePort;
  let mockTelemetryRepo: TelemetryRepositoryPort;
  let useCase: UpdateItineraryNodeUseCase;

  beforeEach(() => {
    mockItineraryRepo = {
      saveItinerary: vi.fn(),
      getItineraryBySessionId: vi.fn(),
      updateNodeSelection: vi.fn().mockResolvedValue(true),
      updateNodeTime: vi.fn().mockResolvedValue(true),
    };

    mockTelemetryRepo = {
      log: vi.fn().mockResolvedValue(undefined),
      query: vi.fn(),
      count: vi.fn(),
      purgeOldEntries: vi.fn(),
    } as unknown as TelemetryRepositoryPort;

    useCase = new UpdateItineraryNodeUseCase(mockItineraryRepo, mockTelemetryRepo);
  });

  describe('selectOption (CA-1 & CA-3)', () => {
    it('debe persistir la selección de opción y retornar OperationEnvelope exitoso (CA-1)', async () => {
      const result = await useCase.selectOption({
        nodeId: 'cuid-node-1',
        optionId: 'opt-2',
      });

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.result).toEqual({
        updated: true,
        nodeId: 'cuid-node-1',
        optionId: 'opt-2',
      });
      expect(mockItineraryRepo.updateNodeSelection).toHaveBeenCalledWith('cuid-node-1', 'opt-2');
      expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'INFO',
          message: expect.stringContaining('Selección de opción persistida con éxito'),
        }),
      );
    });

    it('debe retornar fallo y registrar advertencia si la clave no está correlacionada en BD (CA-3)', async () => {
      vi.mocked(mockItineraryRepo.updateNodeSelection).mockResolvedValueOnce(false);

      const result = await useCase.selectOption({
        nodeId: 'wp-unmapped-id',
        optionId: 'opt-2',
      });

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(404);
      expect(result.errors?.[0]).toContain('wp-unmapped-id');
      expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'WARN',
          message: expect.stringContaining('Clave no correlacionada o nodo no encontrado'),
        }),
      );
    });

    it('debe capturar excepciones de BD bajo fail-soft sin propagar errores no controlados (CA-4)', async () => {
      vi.mocked(mockItineraryRepo.updateNodeSelection).mockRejectedValueOnce(
        new Error('MySQL connection timeout'),
      );

      const result = await useCase.selectOption({
        nodeId: 'cuid-node-1',
        optionId: 'opt-1',
      });

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(500);
      expect(result.errors?.[0]).toContain('MySQL connection timeout');
      expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'ERROR',
          message: expect.stringContaining('MySQL connection timeout'),
        }),
      );
    });

    it('debe rechazar entradas con campos vacíos o tipos inválidos mediante Zod', async () => {
      const result = await useCase.selectOption({
        nodeId: '',
        optionId: 'opt-1',
      });

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(400);
      expect(mockItineraryRepo.updateNodeSelection).not.toHaveBeenCalled();
    });
  });

  describe('shiftTimes (CA-2 & CA-3)', () => {
    it('debe persistir el nuevo inicio y fin del nodo editado y de los posteriores desplazados (CA-2)', async () => {
      const updates = [
        { nodeId: 'cuid-node-1', startTime: '12:00', endTime: '13:30' },
        { nodeId: 'cuid-node-2', startTime: '13:45', endTime: '15:00' },
        { nodeId: 'cuid-node-3', startTime: '15:15', endTime: '16:30' },
      ];

      const result = await useCase.shiftTimes({ updates });

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ updatedCount: 3 });
      expect(mockItineraryRepo.updateNodeTime).toHaveBeenCalledTimes(3);
      expect(mockItineraryRepo.updateNodeTime).toHaveBeenNthCalledWith(
        1,
        'cuid-node-1',
        '12:00',
        '13:30',
      );
      expect(mockItineraryRepo.updateNodeTime).toHaveBeenNthCalledWith(
        2,
        'cuid-node-2',
        '13:45',
        '15:00',
      );
      expect(mockItineraryRepo.updateNodeTime).toHaveBeenNthCalledWith(
        3,
        'cuid-node-3',
        '15:15',
        '16:30',
      );
      expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'INFO',
          message: expect.stringContaining('Horarios propagados persistidos con éxito (3 nodos)'),
        }),
      );
    });

    it('debe registrar advertencia si alguno de los nodos no existe en BD (CA-3)', async () => {
      vi.mocked(mockItineraryRepo.updateNodeTime)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false); // second node not found

      const updates = [
        { nodeId: 'cuid-node-1', startTime: '10:00', endTime: '11:00' },
        { nodeId: 'wp-not-found', startTime: '11:15', endTime: '12:30' },
      ];

      const result = await useCase.shiftTimes({ updates });

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ updatedCount: 1 });
      expect(result.feedback).toBe('Actualización parcial');
      expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'WARN',
          message: expect.stringContaining('Actualización horaria parcial o nodos no encontrados (1/2)'),
        }),
      );
    });

    it('debe capturar errores de base de datos bajo fail-soft (CA-4)', async () => {
      vi.mocked(mockItineraryRepo.updateNodeTime).mockRejectedValueOnce(
        new Error('Deadlock detected'),
      );

      const result = await useCase.shiftTimes({
        updates: [{ nodeId: 'cuid-node-1', startTime: '10:00' }],
      });

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(500);
      expect(result.errors?.[0]).toContain('Deadlock detected');
      expect(mockTelemetryRepo.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'ERROR',
          message: expect.stringContaining('Deadlock detected'),
        }),
      );
    });

    it('debe rechazar formatos de hora inválidos según el esquema Zod', async () => {
      const result = await useCase.shiftTimes({
        updates: [{ nodeId: 'cuid-node-1', startTime: '25:99' }],
      });

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(400);
      expect(mockItineraryRepo.updateNodeTime).not.toHaveBeenCalled();
    });
  });
});
