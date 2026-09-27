import { describe, it, expect } from 'vitest';
import {
  detectLanguageFromPrompt,
  looksLikeLanguageSwitch,
  parseLanguageIntent,
  resolveBaselineLanguage,
  buildRouteLanguageDirective,
} from './language-detector';

describe('detectLanguageFromPrompt (Soberanía Biológica S+ Grade)', () => {
  it('debe detectar comandos explícitos de cambio de idioma', () => {
    expect(detectLanguageFromPrompt('A partir de ahora háblame en inglés por favor', 'es')).toBe('en');
    expect(detectLanguageFromPrompt('Please switch to english', 'es')).toBe('en');
    expect(detectLanguageFromPrompt('Parlez-moi en français', 'es')).toBe('fr');
    expect(detectLanguageFromPrompt('Sprich auf deutsch', 'es')).toBe('de');
    expect(detectLanguageFromPrompt('Parla in italiano', 'es')).toBe('it');
    expect(detectLanguageFromPrompt("Parla'm en català", 'es')).toBe('ca');
    expect(detectLanguageFromPrompt('Vuelve a hablarme en español', 'en')).toBe('es');
  });

  it('debe detectar switches orgánicos por vocabulario característico', () => {
    expect(detectLanguageFromPrompt('Can you plan a 2 hour route in Gothic Quarter?', 'es')).toBe('en');
    expect(detectLanguageFromPrompt('Bonjour, je veux visiter la Sagrada Familia', 'es')).toBe('fr');
    expect(detectLanguageFromPrompt('Guten Tag, ich möchte ein Museum besuchen', 'es')).toBe('de');
    expect(detectLanguageFromPrompt('Buongiorno, vorrei fare una passeggiata', 'es')).toBe('it');
    expect(detectLanguageFromPrompt('Bon dia, vull anar a Montjuïc', 'es')).toBe('ca');
  });

  it('debe mantener el idioma actual si el prompt no expresa cambio', () => {
    expect(detectLanguageFromPrompt('Quiero una ruta de 3 horas por Gracia', 'es')).toBe('es');
    expect(detectLanguageFromPrompt('Just walking around Born', 'en')).toBe('en');
  });

  it('debe resolver la línea base priorizando el idioma persistido sobre la cookie', () => {
    expect(resolveBaselineLanguage('fr', 'en')).toBe('fr');
    expect(resolveBaselineLanguage(undefined, 'de-DE')).toBe('de');
    expect(resolveBaselineLanguage(undefined, 'ru-RU')).toBe('es');
    expect(resolveBaselineLanguage(undefined, undefined)).toBe('es');
  });

  it('debe acorralar la salida libre del SLM al enum de la Whitelist', () => {
    expect(parseLanguageIntent({ language: 'en' }, 'es')).toBe('en');
    expect(parseLanguageIntent({ language: 'English' }, 'es')).toBe('en');
    expect(parseLanguageIntent('français', 'es')).toBe('fr');
    expect(parseLanguageIntent({ language: 'ru' }, 'es')).toBe('es');
    expect(parseLanguageIntent(null, 'it')).toBe('it');
  });

  it('debe detectar pistas de switch para delegar en el SLM', () => {
    expect(looksLikeLanguageSwitch('Cambia el idioma de la conversación')).toBe(true);
    expect(looksLikeLanguageSwitch('Quiero una ruta de 3 horas')).toBe(false);
  });

  it('debe construir la directriz de redacción de ruta por idioma soberano', () => {
    expect(buildRouteLanguageDirective('en')).toContain('[Idioma soberano: en]');
    expect(buildRouteLanguageDirective('en')).toContain('English');
  });
});
