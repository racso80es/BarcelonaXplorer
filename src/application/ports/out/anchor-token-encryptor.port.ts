/**
 * Puerto de Salida para el Cifrado Simétrico Autenticado (AES-256-GCM)
 * de los tokens inyectados en Deep Links de Telegram.
 */
export interface AnchorTokenEncryptorPort {
  /**
   * Cifra un UUID v4 mediante AES-256-GCM empaquetando IV(12B) + Ciphertext(16B) + Tag(16B).
   * Genera una cadena Base64URL opaca de 59 caracteres (<= 64 chars requeridos por Telegram).
   */
  encryptSessionId(sessionId: string): Promise<string>;

  /**
   * Descifra y autentica el token recibido de Telegram.
   * Lanza excepción si el token es inválido, manipulado o no coincide el Auth Tag.
   */
  decryptAnchorToken(token: string): Promise<string>;
}
