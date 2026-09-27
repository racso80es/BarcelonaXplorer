import { describe, it, expect } from 'vitest';
import { TemplateSlugVO } from './template-slug.vo';
import { InvalidTemplateSlugException } from '@/shared/exceptions/invalid-template-slug.exception';

describe('TemplateSlugVO (Value Object)', () => {
  it('debe instanciarse correctamente con un slug válido en minúsculas y guiones', () => {
    const slug = new TemplateSlugVO('rutas-literarias');
    expect(slug.getValue()).toBe('rutas-literarias');
    expect(slug.toString()).toBe('rutas-literarias');
  });

  it('debe normalizar espacios en los extremos y convertir mayúsculas a minúsculas', () => {
    const slug = new TemplateSlugVO('  La-Sombra-Del-Viento  ');
    expect(slug.getValue()).toBe('la-sombra-del-viento');
  });

  it('debe rechazar slugs con menos de 2 caracteres', () => {
    expect(() => new TemplateSlugVO('a')).toThrow(InvalidTemplateSlugException);
    expect(() => new TemplateSlugVO('')).toThrow(InvalidTemplateSlugException);
  });

  it('debe rechazar slugs que superen 96 caracteres', () => {
    const longSlug = 'a'.repeat(97);
    expect(() => new TemplateSlugVO(longSlug)).toThrow(InvalidTemplateSlugException);
  });

  it('debe rechazar slugs con caracteres especiales no permitidos', () => {
    expect(() => new TemplateSlugVO('ruta_literaria')).toThrow(InvalidTemplateSlugException);
    expect(() => new TemplateSlugVO('ruta@barcelona')).toThrow(InvalidTemplateSlugException);
    expect(() => new TemplateSlugVO('ruta/literaria')).toThrow(InvalidTemplateSlugException);
  });

  it('debe rechazar slugs que comiencen o terminen con guión', () => {
    expect(() => new TemplateSlugVO('-ruta-literaria')).toThrow(InvalidTemplateSlugException);
    expect(() => new TemplateSlugVO('ruta-literaria-')).toThrow(InvalidTemplateSlugException);
  });

  it('debe rechazar slugs con guiones consecutivos', () => {
    expect(() => new TemplateSlugVO('ruta--literaria')).toThrow(InvalidTemplateSlugException);
  });

  it('debe comparar igualdad correctamente con el método equals', () => {
    const slugA = new TemplateSlugVO('la-sombra-del-viento');
    const slugB = new TemplateSlugVO('LA-SOMBRA-DEL-VIENTO');
    const slugC = new TemplateSlugVO('otra-ruta');

    expect(slugA.equals(slugB)).toBe(true);
    expect(slugA.equals(slugC)).toBe(false);
  });
});
