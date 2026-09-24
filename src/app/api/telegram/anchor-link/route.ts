import { NextRequest, NextResponse } from 'next/server';
import { AesGcmAnchorTokenEncryptor } from '@/infrastructure/security/aes-gcm-anchor-token.encryptor';

/**
 * Route Handler para generar el Deep Link de anclaje a Telegram de forma segura.
 * Como bx_session_id es una cookie HttpOnly (protegida contra XSS),
 * el servidor la extrae, la cifra con AES-256-GCM y forja la URL oficial de Telegram.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const sessionCookie = request.cookies.get('bx_session_id')?.value;

  if (!sessionCookie) {
    return NextResponse.json(
      { error: 'No active session found' },
      { status: 400 }
    );
  }

  const encryptor = new AesGcmAnchorTokenEncryptor();
  try {
    const token = await encryptor.encryptSessionId(sessionCookie);
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'BXplorerBot';
    const deepLink = `https://t.me/${botUsername}?start=${token}`;

    return NextResponse.json({
      deepLink,
      token,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error generating anchor link' },
      { status: 500 }
    );
  }
}
