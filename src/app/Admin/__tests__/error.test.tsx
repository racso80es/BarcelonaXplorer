/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminErrorBoundary from '../error';

describe('AdminErrorBoundary - Frontera de Resiliencia', () => {
  it('debe renderizar el mensaje táctico de error y permitir ejecutar reset()', () => {
    const mockReset = vi.fn();
    const testError = Object.assign(new Error('Conexión con MySQL abortada'), {
      digest: 'NODO11-ERR-001',
    });

    render(<AdminErrorBoundary error={testError} reset={mockReset} />);

    expect(screen.getByText('Fricción Térmica en la Sala de Control')).toBeDefined();
    expect(screen.getByText('Firma: NODO11-ERR-001')).toBeDefined();

    const retryButton = screen.getByRole('button', { name: /Reintentar Sonda Táctica/i });
    expect(retryButton).toBeDefined();

    fireEvent.click(retryButton);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
