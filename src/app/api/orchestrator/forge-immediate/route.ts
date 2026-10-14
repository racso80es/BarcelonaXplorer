import { NextRequest, NextResponse } from 'next/server';
import {
  DispatchImmediateRouteToTelegramUseCase,
  DispatchImmediateRouteResult,
} from '@/features/telegram/dispatch-immediate-route.use-case';
import {
  PrismaUserAnchorRepository,
  HmacMagicLinkSigner,
  PrismaMagicLinkNonceRepository,
  AesGcmAnchorTokenEncryptor,
} from '@/features/auth/server';
import { TelegramBotApiGateway } from '@/features/telegram/server';
import { createSuccessEnvelope, createErrorEnvelope, OperationEnvelope } from '@/shared/operation-envelope';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
): Promise<NextResponse<OperationEnvelope<DispatchImmediateRouteResult>>> {
  const sessionId = req.cookies.get('bx_session_id')?.value;
  if (!sessionId) {
    return NextResponse.json(
      createErrorEnvelope(['No active session found in cookies'], 400, 'Sesión no encontrada'),
      { status: 400 },
    );
  }

  try {
    const anchorRepo = new PrismaUserAnchorRepository();
    const nonceRepo = new PrismaMagicLinkNonceRepository();
    const signer = new HmacMagicLinkSigner();
    const encryptor = new AesGcmAnchorTokenEncryptor();
    const botGateway = new TelegramBotApiGateway();

    const useCase = new DispatchImmediateRouteToTelegramUseCase(
      anchorRepo,
      botGateway,
      signer,
      nonceRepo,
      encryptor,
    );

    const result = await useCase.execute(sessionId);
    return NextResponse.json(createSuccessEnvelope(result), { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      createErrorEnvelope([errorMsg], 500, 'Error al forjar ruta inmediata hacia Telegram'),
      { status: 500 },
    );
  }
}
