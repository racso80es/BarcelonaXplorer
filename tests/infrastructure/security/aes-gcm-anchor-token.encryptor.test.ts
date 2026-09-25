import { describe, it, expect } from 'vitest';
import { AesGcmAnchorTokenEncryptor } from '@/features/auth';
import { DomainException } from '@/shared/exceptions/domain.exception';

describe('AesGcmAnchorTokenEncryptor', () => {
  const encryptor = new AesGcmAnchorTokenEncryptor(
    'test_secret_aes_key_32_bytes_long_1234'
  );
  const sampleUuid = 'c8b67f33-1498-4c22-b5f7-66a9089e13d5';

  it('cifra un UUID v4 produciendo un token Base64URL de exactamente 59 caracteres (<= 64)', async () => {
    const token = await encryptor.encryptSessionId(sampleUuid);

    expect(typeof token).toBe('string');
    expect(token.length).toBe(59);
    // Debe contener únicamente caracteres permitidos por Telegram (Base64URL)
    expect(/^[a-zA-Z0-9_-]{59}$/.test(token)).toBe(true);
  });

  it('descifra el token recuperando el UUID exacto original', async () => {
    const token = await encryptor.encryptSessionId(sampleUuid);
    const decrypted = await encryptor.decryptAnchorToken(token);

    expect(decrypted).toBe(sampleUuid);
  });

  it('produce tokens diferentes (IV aleatorio) para el mismo UUID, ambos descifrables', async () => {
    const token1 = await encryptor.encryptSessionId(sampleUuid);
    const token2 = await encryptor.encryptSessionId(sampleUuid);

    expect(token1).not.toBe(token2);
    expect(await encryptor.decryptAnchorToken(token1)).toBe(sampleUuid);
    expect(await encryptor.decryptAnchorToken(token2)).toBe(sampleUuid);
  });

  it('lanza DomainException si el token ha sido alterado o manipulado (Auth Tag mismatch)', async () => {
    const token = await encryptor.encryptSessionId(sampleUuid);

    // Alterar un carácter del token
    const tampered =
      token.slice(0, 20) +
      (token[20] === 'a' ? 'b' : 'a') +
      token.slice(21);

    await expect(encryptor.decryptAnchorToken(tampered)).rejects.toThrow(
      DomainException
    );
  });

  it('lanza DomainException ante longitud de token anómala', async () => {
    await expect(encryptor.decryptAnchorToken('short_token')).rejects.toThrow(
      DomainException
    );
  });
});
