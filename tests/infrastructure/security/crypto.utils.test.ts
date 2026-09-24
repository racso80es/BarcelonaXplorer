import { describe, it, expect } from 'vitest';
import {
  constantTimeEqual,
  constantTimeEqualSync,
} from '@/infrastructure/security/crypto.utils';

describe('crypto.utils', () => {
  describe('constantTimeEqual (asíncrono con pre-hashing SHA-256)', () => {
    it('debe retornar true si ambas cadenas son idénticas', async () => {
      expect(await constantTimeEqual('secreto123', 'secreto123')).toBe(true);
      expect(await constantTimeEqual('', '')).toBe(true);
      expect(await constantTimeEqual('Bearer abc-xyz-789', 'Bearer abc-xyz-789')).toBe(true);
    });

    it('debe retornar false si las cadenas difieren en contenido con la misma longitud', async () => {
      expect(await constantTimeEqual('secreto123', 'secreto124')).toBe(false);
      expect(await constantTimeEqual('aaaa', 'bbbb')).toBe(false);
    });

    it('debe retornar false si las cadenas tienen longitudes distintas (mitigación de longitud por hash)', async () => {
      expect(await constantTimeEqual('secreto', 'secreto_mas_largo')).toBe(false);
      expect(await constantTimeEqual('', 'no-vacio')).toBe(false);
      expect(await constantTimeEqual('no-vacio', '')).toBe(false);
    });

    it('debe soportar caracteres especiales y codificación UTF-8', async () => {
      expect(await constantTimeEqual('🔑-segura-ñandú', '🔑-segura-ñandú')).toBe(true);
      expect(await constantTimeEqual('🔑-segura-ñandú', '🔑-segura-nandu')).toBe(false);
    });
  });

  describe('constantTimeEqualSync (síncrono)', () => {
    it('debe retornar true si ambas cadenas son idénticas', () => {
      expect(constantTimeEqualSync('token123', 'token123')).toBe(true);
      expect(constantTimeEqualSync('', '')).toBe(true);
    });

    it('debe retornar false si difieren en longitud o contenido', () => {
      expect(constantTimeEqualSync('token123', 'token124')).toBe(false);
      expect(constantTimeEqualSync('token', 'token_extra')).toBe(false);
    });
  });
});
