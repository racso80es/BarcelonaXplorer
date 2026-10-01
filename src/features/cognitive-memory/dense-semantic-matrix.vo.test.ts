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

  describe('PBI-MEM-002: Metadatos, Mood, Language y Matriz de Durabilidad', () => {
    it('CA-1: debe clasificar exhaustivamente todas las variables en MEMORY_VARIABLE_DURABILITY', async () => {
      const { MEMORY_VARIABLE_DURABILITY } = await import(
        './cognitive-memory-metadata.schema'
      );
      expect(MEMORY_VARIABLE_DURABILITY.time_window).toBe('ephemeral');
      expect(MEMORY_VARIABLE_DURABILITY.group_size).toBe('durable');
      expect(MEMORY_VARIABLE_DURABILITY.vibe).toBe('durable');
      expect(MEMORY_VARIABLE_DURABILITY.constraints).toBe('durable');
      expect(MEMORY_VARIABLE_DURABILITY.districts).toBe('durable');
      expect(MEMORY_VARIABLE_DURABILITY.mood).toBe('durable');
      expect(MEMORY_VARIABLE_DURABILITY.language).toBe('durable');
    });

    it('CA-3: debe incorporar mood y language en props, toMetadata y toPayload', () => {
      const matrix = DenseSemanticMatrix.create({
        sessionId: 'sess-mood-lang',
        payload: {
          group_size: 2,
          mood: 'cultural',
          language: 'ca',
        },
      });

      expect(matrix.propsSnapshot.mood).toBe('cultural');
      expect(matrix.propsSnapshot.language).toBe('ca');

      const meta = matrix.toMetadata();
      expect(meta.mood).toBe('cultural');
      expect(meta.language).toBe('ca');

      const payload = matrix.toPayload();
      expect(payload.mood).toBe('cultural');
      expect(payload.language).toBe('ca');

      expect(matrix.toDensePromptString()).toContain('Ánimo: cultural');
    });

    it('CA-3: debe omitir mood de toDensePromptString si la cadena excede el presupuesto de 280 caracteres', () => {
      const longVibe = 'experiencia gastronómica sumamente refinada en los mejores rincones del ensanche';
      const longTime = 'desde el amanecer hasta altas horas de la noche con múltiples paradas';
      const longConstraints = ['accesibilidad total en silla de ruedas', 'opción vegana y sin gluten'];
      const longDistricts = ['Eixample', 'Sarrià-Sant Gervasi', 'Ciutat Vella'];

      const matrix = DenseSemanticMatrix.create({
        sessionId: 'sess-budget',
        payload: {
          vibe: longVibe,
          time_window: longTime,
          constraints: longConstraints,
          districts: longDistricts,
          group_size: 4,
          mood: 'adventurous',
        },
      });

      const denseString = matrix.toDensePromptString();
      expect(denseString.length).toBeLessThanOrEqual(280);
    });

    it('CA-5 y CA-6: fromMetadata debe reconstruir fielmente filas nuevas y legadas (compatibilidad hacia atrás)', () => {
      // Fila legada sin mood ni language
      const legacyMeta = {
        sessionId: 'sess-legacy',
        matrixId: 'default',
        timeWindow: '2 horas',
        groupSize: 2,
        vibe: 'relax',
        constraints: ['terraza'],
        districts: ['Gràcia'],
        score: 70,
        survivalThreshold: 60,
      };

      const matrixLegacy = DenseSemanticMatrix.fromMetadata(legacyMeta);
      expect(matrixLegacy.propsSnapshot.sessionId).toBe('sess-legacy');
      expect(matrixLegacy.propsSnapshot.mood).toBeUndefined();
      expect(matrixLegacy.propsSnapshot.language).toBeUndefined();
      expect(matrixLegacy.propsSnapshot.groupSize).toBe(2);

      // Fila moderna con mood y language
      const modernMeta = {
        sessionId: 'sess-modern',
        matrixId: 'default',
        timeWindow: null,
        groupSize: 4,
        vibe: 'familiar',
        mood: 'cultural' as const,
        language: 'es' as const,
        constraints: ['niños'],
        districts: [],
        score: 65,
        survivalThreshold: 60,
      };

      const matrixModern = DenseSemanticMatrix.fromMetadata(modernMeta);
      expect(matrixModern.propsSnapshot.sessionId).toBe('sess-modern');
      expect(matrixModern.propsSnapshot.mood).toBe('cultural');
      expect(matrixModern.propsSnapshot.language).toBe('es');
      expect(matrixModern.propsSnapshot.groupSize).toBe(4);
    });
  });
});
