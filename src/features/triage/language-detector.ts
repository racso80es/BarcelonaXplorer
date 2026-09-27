import { z } from 'zod';
import {
  SupportedLanguage,
  SupportedLanguageVo,
  SUPPORTED_LANGUAGES,
} from '@/features/i18n';

export const BX_LANG_COOKIE = 'bx_lang';

export const LanguageIntentSchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES),
});

export type LanguageIntent = z.infer<typeof LanguageIntentSchema>;

/**
 * Directrices declarativas para que Gemini redacte el itinerario
 * en el idioma soberano de la sesión (CA-4).
 */
export const ROUTE_LANGUAGE_DIRECTIVES: Readonly<
  Record<SupportedLanguage, string>
> = {
  es: 'Redacta el itinerario íntegramente en castellano (español de España).',
  en: 'Write the entire itinerary in English.',
  fr: "Rédige l'itinéraire entièrement en français.",
  de: 'Verfasse die gesamte Route vollständig auf Deutsch.',
  it: "Redigi l'itinerario interamente in italiano.",
  ca: "Redacta l'itinerari íntegrament en català.",
};

const EXPLICIT_SWITCH_MATRIX: ReadonlyArray<{
  pattern: RegExp;
  language: SupportedLanguage;
}> = [
  {
    pattern:
      /\b(h[aá]blame en ingl[eé]s|speak (in )?english|switch to english|in english)\b/i,
    language: 'en',
  },
  {
    pattern:
      /\b(h[aá]blame en franc[eé]s|parle[rz]?( en)? fran[cç]ais|switch to french|en fran[cç]ais)\b/i,
    language: 'fr',
  },
  {
    pattern:
      /\b(h[aá]blame en alem[aá]n|sprich( auf)? deutsch|switch to german|auf deutsch)\b/i,
    language: 'de',
  },
  {
    pattern:
      /\b(h[aá]blame en italiano|parla( in)? italiano|switch to italian|in italiano)\b/i,
    language: 'it',
  },
  {
    pattern: /(?:^|[^\w])(parla['’ ]?m en catal[aà]|parla catal[aà]|en catal[aà])(?:[^\w]|$)/i,
    language: 'ca',
  },
  {
    pattern:
      /\b(h[aá]bla(?:r)?me en (espa[nñ]ol|castellano)|habla en (espa[nñ]ol|castellano)|switch to spanish|in spanish)\b/i,
    language: 'es',
  },
];

const ORGANIC_VOCABULARY_MATRIX: ReadonlyArray<{
  pattern: RegExp;
  language: SupportedLanguage;
}> = [
  {
    pattern:
      /\b(can you|i want to|where is|how to|good morning|thank you|please plan)\b/i,
    language: 'en',
  },
  {
    pattern:
      /\b(bonjour|je veux|merci|o[uù] est|s'il vous pla[iî]t|sil vous plait)\b/i,
    language: 'fr',
  },
  {
    pattern: /\b(guten tag|ich m[oö]chte|ich will|bitte|wo ist|vielen dank)\b/i,
    language: 'de',
  },
  {
    pattern:
      /\b(buongiorno|vorrei|per favore|grazie|dov'[eè]|dove si trova)\b/i,
    language: 'it',
  },
  {
    pattern: /\b(bon dia|vull|si us plau|gr[aà]cies|on [eé]s)\b/i,
    language: 'ca',
  },
];

const LANGUAGE_SWITCH_HINT =
  /\b(idioma|language|langue|sprache|h[aá]blame|hablame|speak|switch|parle|parla|sprich|cambia(r)?( el)? idioma)\b/i;

/**
 * Normaliza la salida libre del SLM al enum cerrado de la Whitelist.
 * Defensa en profundidad: alias naturales ("English") → código canónico.
 */
export function parseLanguageIntent(
  raw: unknown,
  fallback: SupportedLanguage,
): SupportedLanguage {
  const parsed = LanguageIntentSchema.safeParse(raw);
  if (parsed.success) {
    return parsed.data.language;
  }

  if (typeof raw === 'string') {
    return SupportedLanguageVo.from(raw).value;
  }

  const loose = z.object({ language: z.string() }).safeParse(raw);
  if (loose.success) {
    return SupportedLanguageVo.from(loose.data.language).value;
  }

  return fallback;
}

export function looksLikeLanguageSwitch(prompt: string): boolean {
  return LANGUAGE_SWITCH_HINT.test(prompt);
}

export function resolveBaselineLanguage(
  persisted?: string | null,
  cookieOrClient?: string | null,
): SupportedLanguage {
  const raw =
    persisted && persisted.trim().length > 0 ? persisted : cookieOrClient;
  return SupportedLanguageVo.from(raw).value;
}

/**
 * Detecta la intención de idioma o el switch conversacional en el prompt.
 * Cumple Soberanía Biológica (Axioma III): la voluntad explícita prevalece.
 */
export function detectLanguageFromPrompt(
  prompt: string,
  currentLanguage: SupportedLanguage = 'es',
): SupportedLanguage {
  const lower = prompt.toLowerCase().trim();

  for (const rule of EXPLICIT_SWITCH_MATRIX) {
    if (rule.pattern.test(lower)) {
      return rule.language;
    }
  }

  for (const rule of ORGANIC_VOCABULARY_MATRIX) {
    if (rule.pattern.test(lower)) {
      return rule.language;
    }
  }

  return currentLanguage;
}

export function buildRouteLanguageDirective(
  language: SupportedLanguage,
): string {
  return `[Idioma soberano: ${language}] ${ROUTE_LANGUAGE_DIRECTIVES[language]}`;
}
