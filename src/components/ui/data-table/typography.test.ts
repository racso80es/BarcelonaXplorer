import { describe, it, expect } from 'vitest';
import { dataTableTypography, dataTableLayout } from './typography';

describe('DataTable Typography & Layout Matrix (PBI-ADMIN-UI-001)', () => {
  it('debe contener las clases de escala responsiva en cellText y badgeText', () => {
    expect(dataTableTypography.cellText).toContain('text-sm');
    expect(dataTableTypography.cellText).toContain('lg:text-data');
    expect(dataTableTypography.badgeText).toContain('text-xs');
    expect(dataTableTypography.badgeText).toContain('md:text-sm');
  });

  it('no debe contener ninguna clase arbitraria text-[ en la matriz de tipografía', () => {
    const typographyValues = Object.values(dataTableTypography);
    for (const val of typographyValues) {
      expect(val).not.toContain('text-[');
    }
  });

  it('no debe contener ninguna clase arbitraria text-[ en la matriz de layout', () => {
    const layoutValues = Object.values(dataTableLayout);
    for (const val of layoutValues) {
      expect(val).not.toContain('text-[');
    }
  });

  it('debe definir controles táctiles ergonómicos de 44px (min-h-11) para móvil', () => {
    expect(dataTableLayout.touchControl).toContain('min-h-11');
    expect(dataTableLayout.touchIconButton).toContain('min-h-11');
    expect(dataTableLayout.touchIconButton).toContain('min-w-11');
  });
});
