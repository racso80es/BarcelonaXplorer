import { AnchorTokenEncryptorPort } from '@/application/ports/out/anchor-token-encryptor.port';
import { DomainException } from '@/domain/exceptions/domain.exception';

/**
 * Adaptador de infraestructura para el cifrado simétrico autenticado (AES-256-GCM)
 * de identificadores de sesión en Deep Links de Telegram.
 *
 * Utiliza estrictamente Web Crypto API (crypto.subtle) para compatibilidad con Edge Runtime y Node.js.
 * Garantiza un payload binario compacto de 44 bytes -> 59 caracteres Base64URL (<= 64 chars requeridos por Telegram).
 */
export class AesGcmAnchorTokenEncryptor implements AnchorTokenEncryptorPort {
  private readonly rawSecretKey: string;

  constructor(secretKey?: string) {
    this.rawSecretKey =
      secretKey ||
      process.env.ANCHOR_AES_KEY ||
      'bx_tactical_anchor_default_secret_key_2026';
  }

  /**
   * Deriva una CryptoKey de 256 bits para AES-GCM a partir de la clave secreta usando SHA-256.
   */
  private async getCryptoKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.rawSecretKey);
    const hash = await crypto.subtle.digest('SHA-256', keyData);

    return crypto.subtle.importKey(
      'raw',
      hash,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private uuidToBytes(uuid: string): Uint8Array {
    const hex = uuid.replace(/-/g, '').toLowerCase();
    if (hex.length !== 32 || !/^[0-9a-f]{32}$/.test(hex)) {
      throw new DomainException(`Formato de UUID inválido para cifrado: ${uuid}`);
    }
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  private bytesToUuid(bytes: Uint8Array): string {
    if (bytes.length !== 16) {
      throw new DomainException('Longitud de bytes de UUID corrupta tras descifrado.');
    }
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  private base64UrlEncode(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private base64UrlDecode(str: string): Uint8Array {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch {
      throw new DomainException('Token de Telegram con codificación Base64URL corrupta.');
    }
  }

  /**
   * Cifra el UUID de la sesión usando AES-256-GCM.
   * Empaquetado: IV (12B) + Ciphertext(16B) + AuthTag(16B) = 44B -> 59 chars Base64URL.
   */
  async encryptSessionId(sessionId: string): Promise<string> {
    const key = await this.getCryptoKey();
    const plainBytes = this.uuidToBytes(sessionId);

    // IV de 12 bytes (96 bits) recomendado por NIST para AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      plainBytes as unknown as BufferSource
    );

    const encryptedBytes = new Uint8Array(encryptedBuffer);

    // Concatenar IV (12 bytes) + Payload Cifrado con Tag (32 bytes) = 44 bytes
    const packed = new Uint8Array(iv.length + encryptedBytes.length);
    packed.set(iv, 0);
    packed.set(encryptedBytes, iv.length);

    return this.base64UrlEncode(packed);
  }

  /**
   * Descifra y autentica el token opaco de Telegram.
   */
  async decryptAnchorToken(token: string): Promise<string> {
    const packed = this.base64UrlDecode(token);

    if (packed.length !== 44) {
      throw new DomainException(
        `Token con longitud binaria anómala (${packed.length} bytes; 44 esperados).`
      );
    }

    const iv = packed.slice(0, 12);
    const encryptedData = packed.slice(12);

    const key = await this.getCryptoKey();

    try {
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        encryptedData as unknown as BufferSource
      );

      return this.bytesToUuid(new Uint8Array(decryptedBuffer));
    } catch {
      throw new DomainException(
        'Fallo de integridad o autenticidad en el token de anclaje (AES-GCM Tag mismatch).'
      );
    }
  }
}
