import { describe, it, expect } from 'vitest';
import { HmacMagicLinkSigner } from './hmac-magic-link-signer';
import { DomainException } from '@/shared/exceptions/domain.exception';

describe('HmacMagicLinkSigner', () => {
  const signer = new HmacMagicLinkSigner('secret_test_key_for_hmac_2026');

  it('firma y verifica un payload válido con firma HMAC-SHA256', async () => {
    const payload = {
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      telegramChatId: '123456789',
      expiresAt: Date.now() + 60000,
      nonce: 'nonce123456',
    };

    const token = await signer.signToken(payload);
    expect(typeof token).toBe('string');
    expect(token.includes('.')).toBe(true);

    const verified = await signer.verifyToken(token);
    expect(verified.sessionId).toBe(payload.sessionId);
    expect(verified.telegramChatId).toBe(payload.telegramChatId);
    expect(verified.nonce).toBe(payload.nonce);
  });

  it('lanza DomainException si el token ha expirado (TTL superado)', async () => {
    const expiredPayload = {
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      telegramChatId: '123456789',
      expiresAt: Date.now() - 1000, // En el pasado
      nonce: 'nonce_expired',
    };

    const token = await signer.signToken(expiredPayload);
    await expect(signer.verifyToken(token)).rejects.toThrow(
      'El enlace mágico ha expirado'
    );
  });

  it('lanza DomainException si la firma HMAC es alterada', async () => {
    const payload = {
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      telegramChatId: '123456789',
      expiresAt: Date.now() + 60000,
      nonce: 'nonce123',
    };

    const token = await signer.signToken(payload);
    const [payloadPart, sigPart] = token.split('.');
    const tamperedToken = `${payloadPart}.${sigPart.slice(0, -2)}AA`;

    await expect(signer.verifyToken(tamperedToken)).rejects.toThrow(
      'Firma HMAC inválida'
    );
  });

  it('lanza DomainException ante tokens sin estructura esperada', async () => {
    await expect(signer.verifyToken('malformed_token_no_dots')).rejects.toThrow(
      'Estructura de token de enlace mágico malformada'
    );
  });
});
