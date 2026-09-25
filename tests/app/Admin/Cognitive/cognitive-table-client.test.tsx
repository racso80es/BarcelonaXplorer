// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CognitiveTableClient } from '@/app/Admin/Cognitive/CognitiveTableClient';
import { CognitiveMemoryItem } from '@/application/ports/out/cognitive-memory.port';

describe('CognitiveTableClient (Bitácora Tabular de Memoria Cognitiva)', () => {
  const sampleSessions: CognitiveMemoryItem[] = [
    {
      id: 'session-uuid-1:default',
      sessionId: 'session-uuid-1',
      matrixId: 'default',
      denseText: '[Grupo: 4 | Vibe: cultural | Distritos: Eixample]',
      payload: {
        timeWindow: 'tarde',
        groupSize: 4,
        vibe: 'cultural',
        districts: ['Eixample', 'Gràcia'],
      },
      score: 100,
      timestamp: 1774425600000, // fecha fija
    },
    {
      id: 'session-uuid-2:default',
      sessionId: 'session-uuid-2',
      matrixId: 'default',
      denseText: '[Grupo: 2 | Vibe: gastronómico]',
      payload: {
        groupSize: 2,
        vibe: 'gastronómico',
      },
      score: 65,
      timestamp: 1774425500000,
    },
    {
      id: 'session-uuid-3:default',
      sessionId: 'session-uuid-3',
      matrixId: 'default',
      denseText: '[Incompleto]',
      payload: {},
      score: 30,
      timestamp: 1774425400000,
    },
  ];

  beforeEach(() => {
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('debe renderizar la lista de sesiones con sus badges térmicos y estados', () => {
    render(<CognitiveTableClient sessions={sampleSessions} />);

    // Verificar que se renderizan las sesiones
    expect(screen.getAllByText('session-...').length).toBe(3);

    // Badges térmicos
    expect(screen.getByText('Saturación S+')).toBeDefined();
    expect(screen.getByText('Peaje Superado')).toBeDefined();
    expect(screen.getByText('Fase Inerte')).toBeDefined();

    // Scores
    expect(screen.getByText('100%')).toBeDefined();
    expect(screen.getByText('65%')).toBeDefined();
    expect(screen.getByText('30%')).toBeDefined();
  });

  it('debe abrir el modal de inspección forense al hacer clic en "Ver"', async () => {
    render(<CognitiveTableClient sessions={sampleSessions} />);

    const inspectButtons = screen.getAllByRole('button', { name: /Inspeccionar sesión/i });
    expect(inspectButtons.length).toBe(3);

    // Abrir modal de la primera sesión
    fireEvent.click(inspectButtons[0]);

    // Verificar que el modal se despliega
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Inspección de Memoria Cognitiva (LanceDB)')).toBeDefined();
    expect(screen.getByText(/Cadena Densa Destilada/i)).toBeDefined();
    expect(screen.getByText(/Payload de Variables de la Matriz/i)).toBeDefined();

    // Cerrar modal con el botón de la X (aria-label="Cerrar modal")
    const closeButton = screen.getByRole('button', { name: 'Cerrar modal' });
    fireEvent.click(closeButton);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('debe permitir copiar el UUID al portapapeles', () => {
    render(<CognitiveTableClient sessions={sampleSessions} />);

    const copyButtons = screen.getAllByRole('button', { name: /Copiar UUID/i });
    fireEvent.click(copyButtons[0]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('session-uuid-1');
  });

  it('debe renderizar mensaje de vacío si no hay sesiones registradas', () => {
    render(<CognitiveTableClient sessions={[]} />);

    expect(
      screen.getByText('No se han registrado memorias cognitivas recientes en LanceDB.'),
    ).toBeDefined();
  });
});
