/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrchestratorBlock } from '@/components/OrchestratorBlock';

describe('OrchestratorBlock Component', () => {
  it('renders user message correctly with solid background', () => {
    const { container } = render(
      <OrchestratorBlock 
        role="user" 
        content="Mensaje de usuario" 
        timestamp={new Date()} 
      />
    );
    expect(screen.getByText('Mensaje de usuario')).toBeDefined();
    // Verifica que tiene fondo sólido y opaco
    expect(container.innerHTML).toContain('bg-zinc-900 border border-zinc-800');
    // Verifica que no tenga el ring luminoso de la IA
    expect(container.innerHTML).not.toContain('animate-pulse');
  });

  it('renders AI message with glassmorphism and animations while processing', () => {
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
    
    // Glassmorphism para IA
    expect(container.innerHTML).toContain('bg-zinc-900/40');
    expect(container.innerHTML).toContain('backdrop-blur-md');
    
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
