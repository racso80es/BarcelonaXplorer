import { GeographicDecisionEnginePort } from './geographic-decision-engine.port';
import { GeographicScopeResultDto } from '@/features/planner';
import { GeographicScope } from './geographic-scope.vo';

/**
 * Adaptador de Infraestructura: Motor Heurístico/Determinista de Decisión Geográfica (System One).
 *
 * Ejecuta una evaluación perimetral en < 5 ms sin consumo de cuota de LLM,
 * detectando desvíos out-of-scope hacia otras ciudades o reconociendo distritos y excepciones logísticas.
 */
export class HeuristicGeographicDecisionEngine implements GeographicDecisionEnginePort {
  /**
   * Catálogo de entidades geográficas foráneas no toleradas (activa Rebote Táctico).
   * Incluye tanto ciudades externas como localidades turísticas periféricas no autorizadas.
   */
  private static readonly OUT_OF_SCOPE_PATTERNS = [
    'madrid',
    'valencia',
    'sevilla',
    'bilbao',
    'zaragoza',
    'málaga',
    'malaga',
    'toledo',
    'granada',
    'alicante',
    'córdoba',
    'cordoba',
    'sitges',
    'montserrat',
    'castelldefels',
    'badalona',
    'girona',
    'tarragona',
    'lleida',
    'ibiza',
    'mallorca',
    'paris',
    'roma',
    'londres',
  ];

  async evaluateScope(prompt: string): Promise<GeographicScopeResultDto> {
    const normalizedPrompt = prompt.toLowerCase();

    // 1. Verificación de excepciones periurbanas de transporte autorizadas (Micro-Logística)
    for (const hub of GeographicScope.PERIURBAN_EXCEPTIONS) {
      if (normalizedPrompt.includes(hub.toLowerCase())) {
        return {
          is_barcelona_scope: true,
          canonical_city: 'Barcelona',
          detected_districts: [hub],
          confidence: 0.99,
        };
      }
    }

    // 2. Detección de entidades foráneas explícitas (Rebote Táctico)
    for (const forbidden of HeuristicGeographicDecisionEngine.OUT_OF_SCOPE_PATTERNS) {
      const regex = new RegExp(`\\b${forbidden}\\b`, 'i');
      if (regex.test(normalizedPrompt)) {
        const capitalized = forbidden.charAt(0).toUpperCase() + forbidden.slice(1);
        return {
          is_barcelona_scope: false,
          canonical_city: 'Barcelona',
          detected_districts: [],
          confidence: 0.95,
          out_of_scope_entity: capitalized,
        };
      }
    }

    // 3. Extracción de distritos canónicos y barrios emblemáticos de Barcelona
    const detectedDistricts: string[] = [];
    for (const district of GeographicScope.CANONICAL_DISTRICTS) {
      if (normalizedPrompt.includes(district.toLowerCase())) {
        detectedDistricts.push(district);
      }
    }
    for (const [neighborhood, district] of Object.entries(GeographicScope.CANONICAL_NEIGHBORHOODS)) {
      if (normalizedPrompt.includes(neighborhood.toLowerCase())) {
        if (!detectedDistricts.includes(district)) {
          detectedDistricts.push(district);
        }
      }
    }

    // 4. Default: Fricción Cero (Inyección implícita dentro de Barcelona)
    return {
      is_barcelona_scope: true,
      canonical_city: 'Barcelona',
      detected_districts: detectedDistricts,
      confidence: detectedDistricts.length > 0 || normalizedPrompt.includes('barcelona') ? 1.0 : 0.9,
    };
  }
}
