export interface MagicLinkPayload {
  sessionId: string;
  telegramChatId: string;
  expiresAt: number;
  nonce: string;
}

/**
 * Puerto de Salida para la firma y verificación criptográfica de enlaces mágicos temporales (HMAC-SHA256).
 */
export interface MagicLinkSignerPort {
  signToken(payload: MagicLinkPayload): Promise<string>;
  verifyToken(token: string): Promise<MagicLinkPayload>;
}
