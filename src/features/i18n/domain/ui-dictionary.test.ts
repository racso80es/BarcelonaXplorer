import { describe, it, expect } from 'vitest';
import {
  UI_DICTIONARY,
  getUiDictionary,
} from './ui-dictionary';
import { SUPPORTED_LANGUAGES } from './supported-language.vo';

describe('UI_DICTIONARY (Cero Disonancia en Cliente)', () => {
  it('debe tener definiciones completas para los 6 idiomas soportados', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const dict = UI_DICTIONARY[lang];
      expect(typeof dict).toBe('object');
      expect(dict).not.toBeNull();

      // ThermalMeter
      expect(typeof dict.thermalMeter.title).toBe('string');
      expect(dict.thermalMeter.title.trim().length).toBeGreaterThan(0);
      expect(typeof dict.thermalMeter.operational).toBe('string');
      expect(dict.thermalMeter.operational.trim().length).toBeGreaterThan(0);
      expect(typeof dict.thermalMeter.saturated).toBe('string');
      expect(dict.thermalMeter.saturated.trim().length).toBeGreaterThan(0);
      expect(typeof dict.thermalMeter.forgeRoute).toBe('string');
      expect(dict.thermalMeter.forgeRoute.trim().length).toBeGreaterThan(0);
      expect(typeof dict.thermalMeter.forging).toBe('string');
      expect(dict.thermalMeter.forging.trim().length).toBeGreaterThan(0);

      // Pickpocket
      expect(typeof dict.pickpocket.levels.LOW).toBe('string');
      expect(dict.pickpocket.levels.LOW.trim().length).toBeGreaterThan(0);
      expect(typeof dict.pickpocket.levels.MEDIUM).toBe('string');
      expect(dict.pickpocket.levels.MEDIUM.trim().length).toBeGreaterThan(0);
      expect(typeof dict.pickpocket.levels.HIGH).toBe('string');
      expect(dict.pickpocket.levels.HIGH.trim().length).toBeGreaterThan(0);
      expect(typeof dict.pickpocket.levels.EXTREME).toBe('string');
      expect(dict.pickpocket.levels.EXTREME.trim().length).toBeGreaterThan(0);

      // Categories
      expect(typeof dict.categories.CULTURAL).toBe('string');
      expect(dict.categories.CULTURAL.trim().length).toBeGreaterThan(0);
      expect(typeof dict.categories.GASTRONOMIC).toBe('string');
      expect(dict.categories.GASTRONOMIC.trim().length).toBeGreaterThan(0);
      expect(typeof dict.categories.LOGISTICS).toBe('string');
      expect(dict.categories.LOGISTICS.trim().length).toBeGreaterThan(0);

      // HybridCanvas
      expect(typeof dict.hybridCanvas.modifyTime).toBe('string');
      expect(dict.hybridCanvas.modifyTime.trim().length).toBeGreaterThan(0);
      expect(typeof dict.hybridCanvas.secureEntrance).toBe('string');
      expect(dict.hybridCanvas.secureEntrance.trim().length).toBeGreaterThan(0);
      expect(typeof dict.hybridCanvas.antiTrapShieldTitle).toBe('string');
      expect(dict.hybridCanvas.antiTrapShieldTitle.trim().length).toBeGreaterThan(0);

      // Affiliates
      expect(typeof dict.affiliates.theForkDefaultCta).toBe('string');
      expect(dict.affiliates.theForkDefaultCta.trim().length).toBeGreaterThan(0);
      expect(typeof dict.affiliates.cabifyDefaultCta).toBe('string');
      expect(dict.affiliates.cabifyDefaultCta.trim().length).toBeGreaterThan(0);
    }
  });

  it('getUiDictionary debe devolver el diccionario correspondiente o fallback a castellano', () => {
    expect(getUiDictionary('fr').hybridCanvas.modifyTime).toBe('Modifier');
    expect(getUiDictionary('en').hybridCanvas.modifyTime).toBe('Edit');
    expect(getUiDictionary('de').hybridCanvas.modifyTime).toBe('Bearbeiten');
    expect(getUiDictionary(null).hybridCanvas.modifyTime).toBe('Modificar');
    expect(getUiDictionary(undefined).hybridCanvas.modifyTime).toBe('Modificar');
  });
});
