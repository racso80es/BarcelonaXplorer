import { describe, it, expect } from 'vitest';
import {
  SupportedLanguageVo,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
} from './supported-language.vo';

describe('SupportedLanguageVo (Protocolo de Acero S+ Grade)', () => {
  it('debe inicializarse con el idioma por defecto si la entrada es nula o vacía', () => {
    expect(SupportedLanguageVo.from(null).value).toBe(DEFAULT_LANGUAGE);
    expect(SupportedLanguageVo.from(undefined).value).toBe(DEFAULT_LANGUAGE);
    expect(SupportedLanguageVo.from('').value).toBe(DEFAULT_LANGUAGE);
    expect(SupportedLanguageVo.from('   ').value).toBe(DEFAULT_LANGUAGE);
  });

  it('debe admitir exactamente los 6 idiomas de la Whitelist', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const vo = SupportedLanguageVo.from(lang);
      expect(vo.value).toBe(lang);
      expect(vo.toString()).toBe(lang);
    }
  });

  it('debe normalizar defensivamente códigos con región (BCP 47)', () => {
    expect(SupportedLanguageVo.from('en-US').value).toBe('en');
    expect(SupportedLanguageVo.from('en-GB').value).toBe('en');
    expect(SupportedLanguageVo.from('es-ES').value).toBe('es');
    expect(SupportedLanguageVo.from('es_AR').value).toBe('es');
    expect(SupportedLanguageVo.from('fr-FR').value).toBe('fr');
    expect(SupportedLanguageVo.from('de-DE').value).toBe('de');
    expect(SupportedLanguageVo.from('it-IT').value).toBe('it');
    expect(SupportedLanguageVo.from('ca-ES').value).toBe('ca');
  });

  it('debe normalizar nombres naturales de idioma protegiendo la soberanía del usuario', () => {
    expect(SupportedLanguageVo.from('english').value).toBe('en');
    expect(SupportedLanguageVo.from('Inglés').value).toBe('en');
    expect(SupportedLanguageVo.from('french').value).toBe('fr');
    expect(SupportedLanguageVo.from('Français').value).toBe('fr');
    expect(SupportedLanguageVo.from('german').value).toBe('de');
    expect(SupportedLanguageVo.from('Deutsch').value).toBe('de');
    expect(SupportedLanguageVo.from('Italiano').value).toBe('it');
    expect(SupportedLanguageVo.from('catalan').value).toBe('ca');
    expect(SupportedLanguageVo.from('català').value).toBe('ca');
  });

  it('debe aplicar fallback determinista a castellano si el idioma no está en la Whitelist', () => {
    expect(SupportedLanguageVo.from('ru').value).toBe('es');
    expect(SupportedLanguageVo.from('ru-RU').value).toBe('es');
    expect(SupportedLanguageVo.from('russian').value).toBe('es');
    expect(SupportedLanguageVo.from('zh-CN').value).toBe('es');
    expect(SupportedLanguageVo.from('japanese').value).toBe('es');
    expect(SupportedLanguageVo.from('unknown_lang').value).toBe('es');
  });

  it('debe evaluar correctamente la igualdad y si es el idioma por defecto', () => {
    const es1 = SupportedLanguageVo.from('es');
    const es2 = SupportedLanguageVo.from('Spanish');
    const en = SupportedLanguageVo.from('en');

    expect(es1.equals(es2)).toBe(true);
    expect(es1.equals(en)).toBe(false);
    expect(es1.isDefault()).toBe(true);
    expect(en.isDefault()).toBe(false);
  });
});
