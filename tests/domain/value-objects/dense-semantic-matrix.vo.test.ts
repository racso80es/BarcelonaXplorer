import { describe, it, expect } from 'vitest';
import { DenseSemanticMatrix } from '@/domain/value-objects/dense-semantic-matrix.vo';

describe('DenseSemanticMatrix (Value Object)', () => {
  it('debe arrojar error si sessionId está vacío', () => {
    expect(() =>
      DenseSemanticMatrix.create({
        sessionId: '',
        payload: {},
      }),
    ).toThrow('sessionId no puede estar vacío');
  });

  it('debe crear una instancia con valores por defecto', () => {
    const matrix = DenseSemanticMatrix.create({
      sessionId: 'session-123',
    });

    expect(matrix.propsSnapshot.sessionId).toBe('session-123');
    expect(matrix.propsSnapshot.matrixId).toBe('default');
    expect(matrix.propsSnapshot.score).toBe(0);
    expect(matrix.propsSnapshot.survivalThreshold).toBe(60);
    expect(matrix.isThresholdSatisfied).toBe(false);
    expect(matrix.toDensePromptString()).toBe('[Contexto: Base]');
  });

  it('debe formatear correctamente una matriz densa completa', () => {
    const matrix = DenseSemanticMatrix.create({
      sessionId: 'session-abc',
      matrixId: 'nightlife',
      payload: {
        group_size: 4,
        time_window: '4 horas',
        vibe: 'tapas y copas',
        districts: ['Ciutat Vella', 'Eixample'],
        constraints: ['sin gluten'],
      },
      score: 85,
      survivalThreshold: 60,
    });

    expect(matrix.isThresholdSatisfied).toBe(true);
    const denseString = matrix.toDensePromptString();
    expect(denseString).toBe(
      '[Grupo: 4 personas | Ventana: 4 horas | Vibe: tapas y copas | Distritos: Ciutat Vella, Eixample | Restricciones: sin gluten]',
    );
  });

  it('debe usar singular para grupo de 1 persona', () => {
    const matrix = DenseSemanticMatrix.create({
      sessionId: 'session-single',
      payload: {
        group_size: 1,
        vibe: 'cultural',
      },
    });

    expect(matrix.toDensePromptString()).toBe('[Grupo: 1 persona | Vibe: cultural]');
  });

  it('debe serializar a metadatos planos y revertir a payload', () => {
    const payload = {
      group_size: 2,
      time_window: 'tarde',
      vibe: 'romántico',
      districts: ['Gràcia'],
      constraints: ['evitar aglomeraciones'],
    };

    const matrix = DenseSemanticMatrix.create({
      sessionId: 'sess-meta',
      payload,
      score: 65,
      survivalThreshold: 60,
    });

    const meta = matrix.toMetadata();
    expect(meta.sessionId).toBe('sess-meta');
    expect(meta.denseString).toContain('Grupo: 2 personas');
    expect(meta.denseString).toContain('Vibe: romántico');

    const recoveredPayload = matrix.toPayload();
    expect(recoveredPayload.group_size).toBe(2);
    expect(recoveredPayload.vibe).toBe('romántico');
    expect(recoveredPayload.districts).toEqual(['Gràcia']);
  });
});
