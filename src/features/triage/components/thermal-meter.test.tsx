/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  ThermalMeter,
  deriveThermalState,
} from './thermal-meter';

describe('ThermalMeter Component (HU-8 S+ Grade)', () => {
  describe('deriveThermalState (Función declarativa pura)', () => {
    it('retorna "saturated" si score >= 100 independientemente del umbral', () => {
      expect(deriveThermalState(100, 60, true)).toBe('saturated');
      expect(deriveThermalState(100, 80, true)).toBe('saturated');
    });

    it('retorna "operational" si score >= survivalThreshold o isThresholdSatisfied es true', () => {
      expect(deriveThermalState(60, 60, true)).toBe('operational');
      expect(deriveThermalState(75, 70, true)).toBe('operational');
      expect(deriveThermalState(65, 70, true)).toBe('operational');
    });

    it('retorna "inert" si score < survivalThreshold y isThresholdSatisfied es false', () => {
      expect(deriveThermalState(0, 60, false)).toBe('inert');
      expect(deriveThermalState(40, 70, false)).toBe('inert');
      expect(deriveThermalState(59, 60, false)).toBe('inert');
    });
  });

  describe('Renderizado de Estados Termodinámicos y Accesibilidad ARIA', () => {
    it('Escenario 1: Fase Inerte con botón deshabilitado y chip de variable faltante', () => {
      const mockDispatch = vi.fn();

      render(
        <ThermalMeter
          score={40}
          survivalThreshold={70}
          isThresholdSatisfied={false}
          missingVariable="group_size"
          matrixId="gastronomy"
          onForceDispatch={mockDispatch}
        />
      );

      const container = screen.getByTestId('thermal-meter');
      expect(container.getAttribute('data-thermal-state')).toBe('inert');
      expect(container.className).toContain('border-layout-divider-strong');

      // Verifica progreso ARIA
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar.getAttribute('aria-valuenow')).toBe('40');
      expect(progressbar.getAttribute('aria-valuemin')).toBe('0');
      expect(progressbar.getAttribute('aria-valuemax')).toBe('100');

      // Texto de meta y variable faltante (diccionario es)
      expect(screen.getByText(/Se requiere umbral 70%/i)).toBeDefined();
      expect(screen.getByText(/Falta definir: group_size/i)).toBeDefined();

      // Botón de despacho deshabilitado
      const dispatchBtn = screen.getByRole('button', { name: /Forjar Ruta Inmediata/i }) as HTMLButtonElement;
      expect(dispatchBtn.disabled).toBe(true);

      fireEvent.click(dispatchBtn);
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('Escenario 2: Fase Operacional con umbral alcanzado y despacho desbloqueado', () => {
      const mockDispatch = vi.fn();

      render(
        <ThermalMeter
          score={75}
          survivalThreshold={70}
          isThresholdSatisfied={true}
          matrixId="gastronomy"
          onForceDispatch={mockDispatch}
        />
      );

      const container = screen.getByTestId('thermal-meter');
      expect(container.getAttribute('data-thermal-state')).toBe('operational');
      expect(container.className).toContain('border-emerald-300');

      expect(screen.getByText(/Operativo · Itinerario Listo \(70%\)/i)).toBeDefined();

      // Botón de despacho habilitado
      const dispatchBtn = screen.getByRole('button', { name: /Forjar Ruta Inmediata/i }) as HTMLButtonElement;
      expect(dispatchBtn.disabled).toBe(false);

      fireEvent.click(dispatchBtn);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('Escenario 3: Fase Saturada (100%) con distintivo Modo Explorador S+ Grade', () => {
      render(
        <ThermalMeter
          score={100}
          survivalThreshold={60}
          isThresholdSatisfied={true}
          matrixId="default"
        />
      );

      const container = screen.getByTestId('thermal-meter');
      expect(container.getAttribute('data-thermal-state')).toBe('saturated');
      expect(container.className).toContain('border-emerald-400');

      expect(screen.getByText(/Saturado/i)).toBeDefined();
    });

    it('muta las leyendas al francés sin recargar al recibir lang="fr"', () => {
      const { rerender } = render(
        <ThermalMeter
          score={75}
          survivalThreshold={70}
          isThresholdSatisfied={true}
          lang="es"
          onForceDispatch={vi.fn()}
        />
      );

      expect(screen.getByText(/Operativo/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Forjar Ruta Inmediata/i })).toBeDefined();

      rerender(
        <ThermalMeter
          score={75}
          survivalThreshold={70}
          isThresholdSatisfied={true}
          lang="fr"
          onForceDispatch={vi.fn()}
        />
      );

      const meter = screen.getByTestId('thermal-meter');
      expect(meter.getAttribute('data-lang')).toBe('fr');
      expect(screen.getByText(/Opérationnel/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Forger l'itinéraire/i })).toBeDefined();
    });

    it('Muestra estado de carga durante isDispatching', () => {
      render(
        <ThermalMeter
          score={80}
          survivalThreshold={60}
          isThresholdSatisfied={true}
          isDispatching={true}
          onForceDispatch={vi.fn()}
        />
      );

      expect(screen.getByText(/Forjando.../i)).toBeDefined();
      const dispatchBtn = screen.getByRole('button') as HTMLButtonElement;
      expect(dispatchBtn.disabled).toBe(true);
    });
  });
});

