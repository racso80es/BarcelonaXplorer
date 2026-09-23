import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryDensityMatrixRepository } from '@/infrastructure/repositories/in-memory-density-matrix.repository';

describe('InMemoryDensityMatrixRepository (Laudo 2: Gobernanza del Estado)', () => {
  let repo: InMemoryDensityMatrixRepository;

  beforeEach(() => {
    InMemoryDensityMatrixRepository.clearAll();
    repo = new InMemoryDensityMatrixRepository();
  });

  it('retorna null si la sesión no tiene matriz previa', async () => {
    const data = await repo.getMatrixPayload('session-none', 'default');
    expect(data).toBeNull();
  });

  it('persiste y recupera el payload de la matriz por sesión y matrixId', async () => {
    await repo.saveMatrixPayload('session-1', 'default', {
      vibe: 'gastronomía',
      group_size: 2,
    });

    const retrieved = await repo.getMatrixPayload('session-1', 'default');
    expect(retrieved).toEqual({
      vibe: 'gastronomía',
      group_size: 2,
    });
  });

  it('aisla correctamente estados entre diferentes sesiones', async () => {
    await repo.saveMatrixPayload('session-A', 'default', { vibe: 'relax' });
    await repo.saveMatrixPayload('session-B', 'default', { vibe: 'fiesta' });

    expect(await repo.getMatrixPayload('session-A', 'default')).toEqual({ vibe: 'relax' });
    expect(await repo.getMatrixPayload('session-B', 'default')).toEqual({ vibe: 'fiesta' });
  });

  it('purga el estado de una matriz específica', async () => {
    await repo.saveMatrixPayload('session-C', 'default', { time_window: '3 horas' });
    await repo.clearMatrixPayload('session-C', 'default');

    expect(await repo.getMatrixPayload('session-C', 'default')).toBeNull();
  });

  it('purga todos los estados asociados a una sesión', async () => {
    await repo.saveMatrixPayload('session-D', 'default', { time_window: '2 horas' });
    await repo.saveMatrixPayload('session-D', 'gastronomy', { group_size: 4 });

    await repo.clearMatrixPayload('session-D');

    expect(await repo.getMatrixPayload('session-D', 'default')).toBeNull();
    expect(await repo.getMatrixPayload('session-D', 'gastronomy')).toBeNull();
  });
});
