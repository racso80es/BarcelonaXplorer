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
      expect(dict).toBeDefined();

      // ThermalMeter
      expect(dict.thermalMeter.title).toBeTruthy();
      expect(dict.thermalMeter.operational).toBeTruthy();
      expect(dict.thermalMeter.saturated).toBeTruthy();
      expect(dict.thermalMeter.forgeRoute).toBeTruthy();
      expect(dict.thermalMeter.forging).toBeTruthy();

      // Pickpocket
      expect(dict.pickpocket.levels.LOW).toBeTruthy();
      expect(dict.pickpocket.levels.MEDIUM).toBeTruthy();
      expect(dict.pickpocket.levels.HIGH).toBeTruthy();
      expect(dict.pickpocket.levels.EXTREME).toBeTruthy();

      // Categories
      expect(dict.categories.CULTURAL).toBeTruthy();
      expect(dict.categories.GASTRONOMIC).toBeTruthy();
      expect(dict.categories.LOGISTICS).toBeTruthy();

      // HybridCanvas
      expect(dict.hybridCanvas.modifyTime).toBeTruthy();
      expect(dict.hybridCanvas.secureEntrance).toBeTruthy();
      expect(dict.hybridCanvas.antiTrapShieldTitle).toBeTruthy();

      // Affiliates
      expect(dict.affiliates.theForkDefaultCta).toBeTruthy();
      expect(dict.affiliates.cabifyDefaultCta).toBeTruthy();
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
