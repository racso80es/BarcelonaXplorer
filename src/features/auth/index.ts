// ═══════════════════════════════════════════════════════════════
// Vertical Slice: Auth & User-Anchor (Anclaje e Identidad)
// Marco Constitucional: Protocolo de Acero — Grado S+
// ═══════════════════════════════════════════════════════════════

export * from './user-anchor.entity';
export * from './telegram-chat-id.vo';
export * from './user-anchor-repository.port';
export * from './anchor-token-encryptor.port';
export * from './magic-link-signer.port';
export * from './hmac-magic-link-signer';
export * from './aes-gcm-anchor-token.encryptor';
export * from './crypto.utils';
export * from './restore-session-from-magic-link.use-case';
export * from './link-telegram-session.use-case';
export * from './revoke-telegram-anchor.use-case';
