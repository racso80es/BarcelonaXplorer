/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TacticalSpark } from '@/components/TacticalSpark';
import { CloudRain } from 'lucide-react';

describe('TacticalSpark Component', () => {
  it('renders the insight text', () => {
    render(
      <TacticalSpark 
        id="test-1" 
        type="weather" 
        insight="Tormenta detectada" 
        icon={CloudRain} 
        urgency="medium" 
      />
    );
    expect(screen.getByText('Tormenta detectada')).toBeDefined();
  });

  it('applies the correct urgency classes', () => {
    const { container } = render(
      <TacticalSpark 
        id="test-2" 
        type="security" 
        insight="Zona de riesgo" 
        icon={CloudRain} 
        urgency="high" 
      />
    );
    // Verificamos que se renderice el color de urgencia alta claro (bg-red-50)
    expect(container.innerHTML).toContain('bg-red-50');
  });
});
