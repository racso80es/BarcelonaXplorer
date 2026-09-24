export interface MagicLinkNonceRecord {
  tokenHash: string;
  sessionId: string;
  expiresAt: Date;
  consumedAt: Date | null;
}

export interface MagicLinkNonceRepositoryPort {
  saveNonce(tokenHash: string, sessionId: string, expiresAt: Date): Promise<void>;
  findNonce(tokenHash: string): Promise<MagicLinkNonceRecord | null>;
  consumeNonce(tokenHash: string): Promise<boolean>;
}
