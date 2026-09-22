/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrchestratorBlock } from '@/components/OrchestratorBlock';

describe('OrchestratorBlock Component', () => {
  it('renders user message correctly with tactical light background', () => {
    const { container } = render(
      <OrchestratorBlock 
        role="user" 
        content="Mensaje de usuario" 
        timestamp={new Date()} 
      />
    );
    expect(screen.getByText('Mensaje de usuario')).toBeDefined();
    // Verifica que tiene tokens semánticos tácticos claros
    expect(container.innerHTML).toContain('bg-surface-container border-layout-divider');
    // Verifica que no tenga el ring luminoso de la IA
    expect(container.innerHTML).not.toContain('animate-pulse');
  });

  it('renders AI message with tactical AI background and animations while processing', () => {
    const { container } = render(
      <OrchestratorBlock 
        role="ai" 
        content="Calculando ruta..." 
        timestamp={new Date()} 
        status="orchestrating"
      />
    );
    expect(screen.getByText('Calculando ruta...')).toBeDefined();
    expect(screen.getByText(/ORQUESTANDO RUTA/i)).toBeDefined();
    
    // Tokens semánticos tácticos para IA
    expect(container.innerHTML).toContain('bg-surface-ai');
    
    // Anillo animado de carga (Fase 2)
    expect(container.innerHTML).toContain('animate-pulse');
  });

  it('removes loading state when completed', () => {
    const { container } = render(
      <OrchestratorBlock 
        role="ai" 
        content="Ruta final" 
        timestamp={new Date()} 
        status="completed"
      />
    );
    expect(screen.getByText(/COMPLETADO/i)).toBeDefined();
    // Ya no debe estar pulsando si ha completado
    expect(container.innerHTML).not.toContain('animate-pulse pointer-events-none');
  });
});
