import { describe, it, expect } from 'vitest';
import { GeographicScope } from '@/domain/value-objects/geographic-scope.vo';
import { OutOfScopeGeographicException } from '@/domain/exceptions/out-of-scope-geographic.exception';

describe('GeographicScope Value Object (HU-PERIM-GEO-001)', () => {
  describe('Fábrica Implícita (Fricción Cero)', () => {
    it('debe crear un contexto geográfico anclado a Barcelona por defecto', () => {
      const scope = GeographicScope.createImplicitBarcelona();

      expect(scope.isWithinScope).toBe(true);
      expect(scope.targetCity).toBe('Barcelona');
      expect(scope.detectedDistricts).toEqual([]);
      expect(scope.confidenceScore).toBe(1.0);
      expect(scope.rejectedEntity).toBeUndefined();
    });

    it('debe garantizar la inmutabilidad física del objeto (Object.freeze)', () => {
      const scope = GeographicScope.createImplicitBarcelona();

      expect(Object.isFrozen(scope)).toBe(true);
      expect(() => {
        // @ts-expect-error - Mutación prohibida en tiempo de compilación
        scope.targetCity = 'Madrid';
      }).toThrow();
    });
  });

  describe('Fábrica Explícita en Perímetro', () => {
    it('debe filtrar y retener distritos canónicos válidos de Barcelona', () => {
      const scope = GeographicScope.createExplicitInScope(['Gràcia', 'Eixample', 'DistritoInexistente']);

      expect(scope.isWithinScope).toBe(true);
      expect(scope.targetCity).toBe('Barcelona');
      expect(scope.detectedDistricts).toEqual(['Gràcia', 'Eixample']);
      expect(scope.confidenceScore).toBe(1.0);
    });

    it('debe admitir excepciones periurbanas de tránsito (Doctrina de Micro-Logística)', () => {
      const scope = GeographicScope.createExplicitInScope(['Aeropuerto de El Prat', 'Ciutat Vella']);

      expect(scope.isWithinScope).toBe(true);
      expect(scope.detectedDistricts).toContain('Aeropuerto de El Prat');
      expect(scope.detectedDistricts).toContain('Ciutat Vella');
    });

    it('debe congelar la lista interna de distritos detectados', () => {
      const scope = GeographicScope.createExplicitInScope(['Gràcia']);

      expect(Object.isFrozen(scope.detectedDistricts)).toBe(true);
      expect(() => {
        // @ts-expect-error - Mutación prohibida
        scope.detectedDistricts.push('Ciutat Vella');
      }).toThrow();
    });
  });

  describe('Fábrica Fuera de Perímetro (Bloqueo Out-of-Scope)', () => {
    it('debe forjar un estado de rechazo con la entidad foránea capturada', () => {
      const scope = GeographicScope.createOutOfScope('Valencia', 0.95);

      expect(scope.isWithinScope).toBe(false);
      expect(scope.targetCity).toBe('Valencia');
      expect(scope.rejectedEntity).toBe('Valencia');
      expect(scope.confidenceScore).toBe(0.95);
      expect(scope.detectedDistricts).toEqual([]);
    });

    it('debe lanzar OutOfScopeGeographicException si la entidad rechazada está vacía', () => {
      expect(() => {
        GeographicScope.createOutOfScope('   ');
      }).toThrow(OutOfScopeGeographicException);
    });
  });

  describe('Type Guards y Helpers de Clasificación', () => {
    it('isCanonicalDistrict debe identificar correctamente distritos de Barcelona', () => {
      expect(GeographicScope.isCanonicalDistrict('Ciutat Vella')).toBe(true);
      expect(GeographicScope.isCanonicalDistrict('Sants-Montjuïc')).toBe(true);
      expect(GeographicScope.isCanonicalDistrict('Sitges')).toBe(false);
      expect(GeographicScope.isCanonicalDistrict('Madrid')).toBe(false);
    });

    it('isPeriurbanTransitHub debe identificar nodos logísticos y descartar ocio foráneo', () => {
      expect(GeographicScope.isPeriurbanTransitHub('Aeropuerto de El Prat')).toBe(true);
      expect(GeographicScope.isPeriurbanTransitHub('Port de Barcelona (Terminales de Cruceros)')).toBe(true);
      expect(GeographicScope.isPeriurbanTransitHub('Sitges')).toBe(false);
      expect(GeographicScope.isPeriurbanTransitHub('Montserrat')).toBe(false);
    });
  });
});
