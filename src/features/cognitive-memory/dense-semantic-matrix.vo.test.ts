import { describe, it, expect } from 'vitest';
import { DenseSemanticMatrix } from './dense-semantic-matrix.vo';

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

  it('debe truncar defensivamente cadenas largas y acotar colecciones extensas (PBI-COGN-MEM-006)', () => {
    const longVibe =
      'Quiero una experiencia sumamente exclusiva y bohemia recorriendo los callejones oscuros y secretos de la ciudad vieja sin prisas';
    const longTime =
      'Desde las 9 de la mañana hasta altas horas de la madrugada del día siguiente ininterrumpidamente';
    const excessiveConstraints = [
      'sin gluten estricto de grado celíaco certificado',
      'presupuesto hiper bajo',
      'accesibilidad para silla de ruedas',
      'sin escaleras mecánicas',
      'evitar trampas para turistas',
      'opción vegana garantizada',
      'cerca de estación de metro',
    ];
    const excessiveDistricts = [
      'Ciutat Vella',
      'Eixample',
      'Gràcia',
      'Sants-Montjuïc',
      'Les Corts',
      'Sarrià-Sant Gervasi',
      'Horta-Guinardó',
    ];

    const matrix = DenseSemanticMatrix.create({
      sessionId: 'session-oversized',
      payload: {
        vibe: longVibe,
        time_window: longTime,
        constraints: excessiveConstraints,
        districts: excessiveDistricts,
      },
    });

    const snapshot = matrix.propsSnapshot;

    // Vibe debe estar truncado a 45 chars + '...'
    expect(snapshot.vibe).toBeDefined();
    expect(snapshot.vibe!.length).toBeLessThanOrEqual(48);
    expect(snapshot.vibe!.endsWith('...')).toBe(true);

    // TimeWindow debe estar truncado a 40 chars + '...'
    expect(snapshot.timeWindow).toBeDefined();
    expect(snapshot.timeWindow!.length).toBeLessThanOrEqual(43);
    expect(snapshot.timeWindow!.endsWith('...')).toBe(true);

    // Constraints acotadas a 3 elementos y cada uno <= 28 chars
    expect(snapshot.constraints).toHaveLength(3);
    for (const c of snapshot.constraints) {
      expect(c.length).toBeLessThanOrEqual(28);
    }

    // Districts acotados a 3 elementos
    expect(snapshot.districts).toHaveLength(3);

    // toDensePromptString debe emitir una cadena acotada y canónica
    const denseString = matrix.toDensePromptString();
    expect(denseString.startsWith('[')).toBe(true);
    expect(denseString.endsWith(']')).toBe(true);
    // Verificar que la cadena resultante es estrictamente compacta (<= 280 caracteres, cota ~45 tokens)
    expect(denseString.length).toBeLessThanOrEqual(280);
  });
});
