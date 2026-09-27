/**
 * ============================================================================
 * VALUE OBJECT: SupportedLanguageVo (Protocolo de Acero S+ Grade)
 * ============================================================================
 * 
 * Gobierna de forma inmutable la representación y normalización de idiomas admitidos
 * en BarcelonaXplorer.
 * 
 * Principios:
 * 1. Tolerancia Cero a la Inferencia: Whitelist cerrada innegociable.
 * 2. Defensa en Profundidad: Mapeo de alias comunes BCP 47 y lenguaje natural
 *    para evitar que sutilezas de formato descarten la soberanía biológica del usuario.
 * 3. Fallback Determinista: Idioma maestro inmutable 'es' (Castellano).
 */

export const SUPPORTED_LANGUAGES = ['es', 'en', 'fr', 'de', 'it', 'ca'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'es';

/**
 * Diccionario de normalización determinista para alias y etiquetas regionales comunes.
 */
const CANONICAL_LANGUAGE_ALIASES: Readonly<Record<string, SupportedLanguage>> = {
  // Español / Castellano
  es: 'es',
  spa: 'es',
  spanish: 'es',
  espanol: 'es',
  español: 'es',
  castellano: 'es',
  // Inglés
  en: 'en',
  eng: 'en',
  english: 'en',
  ingles: 'en',
  inglés: 'en',
  // Francés
  fr: 'fr',
  fra: 'fr',
  fre: 'fr',
  french: 'fr',
  francais: 'fr',
  français: 'fr',
  frances: 'fr',
  francés: 'fr',
  // Alemán
  de: 'de',
  deu: 'de',
  ger: 'de',
  german: 'de',
  deutsch: 'de',
  aleman: 'de',
  alemán: 'de',
  // Italiano
  it: 'it',
  ita: 'it',
  italian: 'it',
  italiano: 'it',
  // Catalán
  ca: 'ca',
  cat: 'ca',
  catalan: 'ca',
  catalán: 'ca',
  catala: 'ca',
  català: 'ca',
};

export class SupportedLanguageVo {
  private readonly _value: SupportedLanguage;

  private constructor(value: SupportedLanguage) {
    this._value = value;
  }

  /**
   * Fábrica estática con normalización determinista a prueba de fallos.
   */
  public static from(raw?: string | null): SupportedLanguageVo {
    if (!raw || typeof raw !== 'string') {
      return new SupportedLanguageVo(DEFAULT_LANGUAGE);
    }

    const clean = raw.trim().toLowerCase();
    if (clean.length === 0) {
      return new SupportedLanguageVo(DEFAULT_LANGUAGE);
    }

    // 1. Coincidencia directa en alias naturales o canónicos
    if (clean in CANONICAL_LANGUAGE_ALIASES) {
      return new SupportedLanguageVo(CANONICAL_LANGUAGE_ALIASES[clean]);
    }

    // 2. Extracción de subtag primario en códigos compuestos (ej. "en-US", "fr_FR" -> "en", "fr")
    const primarySubtag = clean.split(/[-_]/)[0];
    if (primarySubtag in CANONICAL_LANGUAGE_ALIASES) {
      return new SupportedLanguageVo(CANONICAL_LANGUAGE_ALIASES[primarySubtag]);
    }

    // 3. Fallback Determinista innegociable
    return new SupportedLanguageVo(DEFAULT_LANGUAGE);
  }

  public get value(): SupportedLanguage {
    return this._value;
  }

  public isDefault(): boolean {
    return this._value === DEFAULT_LANGUAGE;
  }

  public equals(other: SupportedLanguageVo): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}
