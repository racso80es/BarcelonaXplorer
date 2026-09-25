/**
 * Módulo Criptográfico de Utilidades Defensivas (Nodo 11).
 * Implementa comparaciones en tiempo constante para mitigar ataques de canal lateral (timing attacks / CWE-208 / CWE-385).
 * Compatible con Node.js y Edge Runtime (Next.js App Router).
 */

/**
 * Comparación en tiempo constante de dos cadenas secretas.
 * Emplea pre-hashing SHA-256 mediante Web Crypto API (crypto.subtle)
 * para normalizar la longitud de ambos operandos a 32 bytes fijos,
 * eliminando fugas de canal lateral tanto por contenido como por longitud.
 *
 * @param a Primera cadena secreta (ej. token provisto en cabecera)
 * @param b Segunda cadena secreta (ej. secreto esperado en entorno)
 * @returns Promesa booleana que resuelve a true si ambas cadenas son idénticas
 */
export async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);

  const bytesA = new Uint8Array(hashA);
  const bytesB = new Uint8Array(hashB);

  let mismatch = 0;
  for (let i = 0; i < bytesA.length; i++) {
    mismatch |= bytesA[i] ^ bytesB[i];
  }

  return mismatch === 0;
}

/**
 * Versión síncrona de comparación en tiempo constante mediante XOR acumulativo.
 * Útil en contextos donde la interfaz de llamada exige evaluación puramente síncrona.
 *
 * @param a Primera cadena
 * @param b Segunda cadena
 * @returns true si ambas cadenas son idénticas en longitud y contenido
 */
export function constantTimeEqualSync(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
