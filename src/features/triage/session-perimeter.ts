import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export interface ResolvedBxSession {
  sessionId: string;
  isNewSession: boolean;
}

/** Identidad de sesión solo desde cookie emitida por el servidor (PBI-STEEL-004 CA-4). */
export function resolveBxSessionFromRequest(req: NextRequest): ResolvedBxSession {
  const cookieValue = req.cookies.get('bx_session_id')?.value?.trim();
  if (cookieValue && cookieValue.length > 0) {
    return { sessionId: cookieValue, isNewSession: false };
  }
  return { sessionId: randomUUID(), isNewSession: true };
}

export function applyBxSessionCookie(
  response: NextResponse,
  sessionId: string,
): void {
  response.cookies.set('bx_session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
}
