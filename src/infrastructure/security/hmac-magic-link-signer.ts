import {
  MagicLinkPayload,
  MagicLinkSignerPort,
} from '@/application/ports/out/magic-link-signer.port';
import { DomainException } from '@/domain/exceptions/domain.exception';

/**
 * Adaptador de infraestructura para firmar y verificar tokens de Enlace Mágico Cross-Device
 * mediante HMAC-SHA256 con Web Crypto API.
 */
export class HmacMagicLinkSigner implements MagicLinkSignerPort {
  private readonly secretKey: string;

  constructor(secretKey?: string) {
    this.secretKey =
      secretKey ||
      process.env.MAGIC_LINK_SECRET ||
      'bx_magic_link_fallback_secret_key_2026';
  }

  private async getHmacKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    return crypto.subtle.importKey(
      'raw',
      encoder.encode(this.secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
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
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  async signToken(payload: MagicLinkPayload): Promise<string> {
    const key = await this.getHmacKey();
    const encoder = new TextEncoder();

    const payloadJson = JSON.stringify(payload);
    const payloadBase64 = this.base64UrlEncode(encoder.encode(payloadJson));

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payloadBase64)
    );

    const signatureBase64 = this.base64UrlEncode(new Uint8Array(signatureBuffer));

    return `${payloadBase64}.${signatureBase64}`;
  }

  async verifyToken(token: string): Promise<MagicLinkPayload> {
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new DomainException('Estructura de token de enlace mágico malformada.');
    }

    const [payloadBase64, signatureBase64] = parts;
    const key = await this.getHmacKey();
    const encoder = new TextEncoder();

    const signatureBytes = this.base64UrlDecode(signatureBase64);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      encoder.encode(payloadBase64)
    );

    if (!isValid) {
      throw new DomainException('Firma HMAC inválida en token de enlace mágico.');
    }

    const payloadBytes = this.base64UrlDecode(payloadBase64);
    const decoder = new TextDecoder();
    const payloadJson = decoder.decode(payloadBytes);

    let parsed: MagicLinkPayload;
    try {
      parsed = JSON.parse(payloadJson) as MagicLinkPayload;
    } catch {
      throw new DomainException('Payload JSON corrupto en token de enlace mágico.');
    }

    if (!parsed.sessionId || !parsed.telegramChatId || !parsed.expiresAt || !parsed.nonce) {
      throw new DomainException('Campos requeridos ausentes en el payload del enlace mágico.');
    }

    if (Date.now() > parsed.expiresAt) {
      throw new DomainException('El enlace mágico ha expirado (TTL de 15 minutos superado).');
    }

    return parsed;
  }
}
