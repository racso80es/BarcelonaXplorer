import { OutOfScopeGeographicException } from '../exceptions/out-of-scope-geographic.exception';

export type CanonicalDistrict = (typeof GeographicScope.CANONICAL_DISTRICTS)[number];
export type PeriurbanException = (typeof GeographicScope.PERIURBAN_EXCEPTIONS)[number];

/**
 * Objeto de Valor inmutable que modela y valida el anclaje perimetral geográfico
 * de BarcelonaXplorer bajo los dogmas de la Constitución (La Vía del Yunque).
 *
 * Erradica tipos primitivos y blinda el dominio contra estados inválidos.
 */
export class GeographicScope {
  public static readonly CANONICAL_CITY = 'Barcelona';

  /** 10 distritos canónicos oficiales del término municipal de Barcelona */
  public static readonly CANONICAL_DISTRICTS = [
    'Ciutat Vella',
    'Eixample',
    'Sants-Montjuïc',
    'Les Corts',
    'Sarrià-Sant Gervasi',
    'Gràcia',
    'Horta-Guinardó',
    'Nou Barris',
    'Sant Andreu',
    'Sant Martí',
  ] as const;

  /**
   * Nodos logísticos periurbanos tolerados estrictamente bajo la doctrina de Micro-Logística de Última Milla.
   * Se limita exclusivamente a infraestructura de tránsito/acceso (aeropuertos, terminales portuarias, estaciones).
   * Se prohíbe taxativamente la admisión de atracciones o POIs turísticos externos al municipio.
   */
  public static readonly PERIURBAN_EXCEPTIONS = [
    'Aeropuerto de El Prat',
    'Aeroport Josep Tarradellas Barcelona-El Prat',
    'El Prat de Llobregat',
    'Port de Barcelona (Terminales de Cruceros)',
    'Estació d’El Prat',
  ] as const;

  /** Bounding Box Perimetral aproximado de Barcelona Metropolitana */
  public static readonly BOUNDING_BOX = {
    minLat: 41.317,
    maxLat: 41.468,
    minLng: 2.052,
    maxLng: 2.235,
  } as const;

  private constructor(
    public readonly isWithinScope: boolean,
    public readonly targetCity: string,
    public readonly detectedDistricts: readonly string[],
    public readonly confidenceScore: number,
    public readonly rejectedEntity?: string,
  ) {
    if (!targetCity || targetCity.trim().length === 0) {
      throw new OutOfScopeGeographicException('Target city must not be empty');
    }
    if (confidenceScore < 0 || confidenceScore > 1) {
      throw new OutOfScopeGeographicException('Confidence score must be between 0 and 1');
    }
    if (!isWithinScope && (!rejectedEntity || rejectedEntity.trim().length === 0)) {
      throw new OutOfScopeGeographicException(
        'Rejected geographic entity must be specified when out of scope',
      );
    }
    Object.freeze(this.detectedDistricts);
    Object.freeze(this);
  }

  /**
   * Fábrica para intenciones implícitas (Fricción Cero).
   * Si el usuario no menciona ciudad, se asume Barcelona con confianza absoluta.
   */
  public static createImplicitBarcelona(): GeographicScope {
    return new GeographicScope(true, GeographicScope.CANONICAL_CITY, [], 1.0);
  }

  /**
   * Fábrica para intenciones explícitas dentro del perímetro (Blindaje S+ Grade sin 'any').
   */
  public static createExplicitInScope(
    districts: string[] = [],
    confidence = 1.0,
  ): GeographicScope {
    const validDistricts = districts.filter((d) => {
      const isCanonical = (GeographicScope.CANONICAL_DISTRICTS as readonly string[]).includes(d);
      const isPeriurban = GeographicScope.PERIURBAN_EXCEPTIONS.some(
        (p) => p.toLowerCase() === d.toLowerCase(),
      );
      return isCanonical || isPeriurban;
    });

    return new GeographicScope(
      true,
      GeographicScope.CANONICAL_CITY,
      validDistricts,
      confidence,
    );
  }

  /**
   * Fábrica para desvíos geográficos fuera de dominio (Bloqueo Out-of-Scope).
   */
  public static createOutOfScope(
    rejectedEntity: string,
    confidence = 1.0,
  ): GeographicScope {
    if (!rejectedEntity || rejectedEntity.trim().length === 0) {
      throw new OutOfScopeGeographicException('Rejected geographic entity must be specified');
    }
    return new GeographicScope(
      false,
      rejectedEntity.trim(),
      [],
      confidence,
      rejectedEntity.trim(),
    );
  }

  /** Comprueba si un string coincide con un distrito canónico de Barcelona */
  public static isCanonicalDistrict(district: string): district is CanonicalDistrict {
    return (GeographicScope.CANONICAL_DISTRICTS as readonly string[]).includes(district);
  }

  /** Comprueba si un string coincide con una excepción logística periurbana */
  public static isPeriurbanTransitHub(hub: string): hub is PeriurbanException {
    return GeographicScope.PERIURBAN_EXCEPTIONS.some(
      (p) => p.toLowerCase() === hub.toLowerCase(),
    );
  }
}
