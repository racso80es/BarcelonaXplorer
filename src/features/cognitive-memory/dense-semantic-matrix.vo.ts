import { DefaultDensityPayload } from '@/features/planner';

export interface DenseSemanticMatrixProps {
  readonly sessionId: string;
  readonly matrixId: string;
  readonly timeWindow?: string;
  readonly groupSize?: number;
  readonly vibe?: string;
  readonly constraints: readonly string[];
  readonly districts: readonly string[];
  readonly score: number;
  readonly survivalThreshold: number;
  readonly updatedAt: Date;
}

/**
 * Objeto de Valor Inmutable: Matriz Semántica de Alta Densidad.
 * 
 * Cumple con los Axiomas de Forja S+ Grade (La Vía del Yunque):
 * 1. Economía Termodinámica: Transmuta lenguaje conversacional difuso en
 *    estructuras paramétricas sintéticas compactas (< 45 tokens).
 * 2. Tolerancia Cero a la Inferencia: Inmutabilidad estricta y formato canónico
 *    para embedding y RAG silencioso.
 */
export class DenseSemanticMatrix {
  private constructor(private readonly props: DenseSemanticMatrixProps) {
    if (!props.sessionId || props.sessionId.trim().length === 0) {
      throw new Error('DenseSemanticMatrix: sessionId no puede estar vacío.');
    }
    if (!props.matrixId || props.matrixId.trim().length === 0) {
      throw new Error('DenseSemanticMatrix: matrixId no puede estar vacío.');
    }
  }

  public static create(raw: {
    sessionId: string;
    matrixId?: string;
    payload?: Partial<DefaultDensityPayload> | Record<string, unknown>;
    score?: number;
    survivalThreshold?: number;
    updatedAt?: Date;
  }): DenseSemanticMatrix {
    const payload = (raw.payload ?? {}) as Partial<DefaultDensityPayload>;
    const matrixId = raw.matrixId && raw.matrixId.trim().length > 0 ? raw.matrixId.trim() : 'default';
    const score = typeof raw.score === 'number' ? Math.max(0, Math.min(100, raw.score)) : 0;
    const survivalThreshold =
      typeof raw.survivalThreshold === 'number'
        ? Math.max(0, Math.min(100, raw.survivalThreshold))
        : 60;

    const constraints = Array.isArray(payload.constraints)
      ? Array.from(new Set(payload.constraints.filter(Boolean).map(String)))
      : [];

    const districts = Array.isArray(payload.districts)
      ? Array.from(new Set(payload.districts.filter(Boolean).map(String)))
      : [];

    return new DenseSemanticMatrix({
      sessionId: raw.sessionId.trim(),
      matrixId,
      timeWindow: payload.time_window?.trim() || undefined,
      groupSize: typeof payload.group_size === 'number' && payload.group_size > 0 ? payload.group_size : undefined,
      vibe: payload.vibe?.trim() || undefined,
      constraints: Object.freeze(constraints),
      districts: Object.freeze(districts),
      score,
      survivalThreshold,
      updatedAt: raw.updatedAt ?? new Date(),
    });
  }

  /**
   * Genera la representación sintética hiper-densa para el embedding y la inyección silenciosa en el prompt.
   * Formato canónico: [Grupo: N | Ventana: ... | Vibe: ... | Distritos: ... | Restricciones: ...]
   */
  public toDensePromptString(): string {
    const segments: string[] = [];

    if (this.props.groupSize !== undefined) {
      segments.push(`Grupo: ${this.props.groupSize} ${this.props.groupSize === 1 ? 'persona' : 'personas'}`);
    }

    if (this.props.timeWindow) {
      segments.push(`Ventana: ${this.props.timeWindow}`);
    }

    if (this.props.vibe) {
      segments.push(`Vibe: ${this.props.vibe}`);
    }

    if (this.props.districts.length > 0) {
      segments.push(`Distritos: ${this.props.districts.join(', ')}`);
    }

    if (this.props.constraints.length > 0) {
      segments.push(`Restricciones: ${this.props.constraints.join(', ')}`);
    }

    if (segments.length === 0) {
      return '[Contexto: Base]';
    }

    return `[${segments.join(' | ')}]`;
  }

  /**
   * Serializa los metadatos en un diccionario plano para Apache Arrow / LanceDB.
   */
  public toMetadata(): Record<string, unknown> {
    return {
      sessionId: this.props.sessionId,
      matrixId: this.props.matrixId,
      timeWindow: this.props.timeWindow ?? null,
      groupSize: this.props.groupSize ?? null,
      vibe: this.props.vibe ?? null,
      constraints: [...this.props.constraints],
      districts: [...this.props.districts],
      score: this.props.score,
      survivalThreshold: this.props.survivalThreshold,
      updatedAt: this.props.updatedAt.toISOString(),
      denseString: this.toDensePromptString(),
    };
  }

  /**
   * Convierte la matriz nuevamente al payload de dominio DefaultDensityPayload.
   */
  public toPayload(): DefaultDensityPayload {
    return {
      time_window: this.props.timeWindow,
      group_size: this.props.groupSize,
      vibe: this.props.vibe,
      constraints: [...this.props.constraints],
      districts: [...this.props.districts],
    };
  }

  public get isThresholdSatisfied(): boolean {
    return this.props.score >= this.props.survivalThreshold;
  }

  public get propsSnapshot(): Readonly<DenseSemanticMatrixProps> {
    return { ...this.props };
  }
}
