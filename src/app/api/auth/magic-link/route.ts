import { NextRequest, NextResponse } from 'next/server';
import { RestoreSessionFromMagicLinkUseCase } from '@/application/use-cases/restore-session-from-magic-link.use-case';
import { HmacMagicLinkSigner } from '@/infrastructure/security/hmac-magic-link-signer';
import { PrismaMagicLinkNonceRepository } from '@/infrastructure/repositories/prisma-magic-link-nonce.repository';
import { PrismaUserAnchorRepository } from '@/infrastructure/repositories/prisma-user-anchor.repository';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(
      new URL('/orchestrator?auth_error=missing_token', request.url),
      307
    );
  }

  const magicLinkSigner = new HmacMagicLinkSigner();
  const nonceRepository = new PrismaMagicLinkNonceRepository();
  const anchorRepository = new PrismaUserAnchorRepository();

  const restoreUseCase = new RestoreSessionFromMagicLinkUseCase(
    magicLinkSigner,
    nonceRepository,
    anchorRepository
  );

  try {
    const result = await restoreUseCase.execute({ token });

    // Inyectar cookie HttpOnly bx_session_id y redirigir
    const response = NextResponse.redirect(
      new URL('/orchestrator?session_restored=true', request.url),
      307
    );

    response.cookies.set('bx_session_id', result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.warn(
      '[Magic Link Error]',
      error instanceof Error ? error.message : error
    );

    return NextResponse.redirect(
      new URL('/orchestrator?auth_error=invalid_or_expired_token', request.url),
      307
    );
  }
}
