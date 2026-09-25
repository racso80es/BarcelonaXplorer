import { NextRequest, NextResponse } from 'next/server';
import { TelegramUpdateSchema } from '@/features/telegram';
import { TelegramBotApiGateway } from '@/features/telegram';
import { AesGcmAnchorTokenEncryptor } from '@/features/auth';
import { PrismaUserAnchorRepository } from '@/infrastructure/repositories/prisma-user-anchor.repository';
import { PrismaMagicLinkNonceRepository } from '@/infrastructure/repositories/prisma-magic-link-nonce.repository';
import { HmacMagicLinkSigner } from '@/features/auth';
import { LinkTelegramSessionUseCase } from '@/features/auth';
import { GenerateMagicLinkUseCase } from '@/application/use-cases/generate-magic-link.use-case';
import { RevokeTelegramAnchorUseCase } from '@/features/auth';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const botGateway = new TelegramBotApiGateway();

  // 1. Verificación Perimetral Fail-Closed de la Cabecera Secreta
  const secretHeader = request.headers.get('x-telegram-bot-api-secret-token');
  if (!botGateway.verifySecretHeader(secretHeader)) {
    return new NextResponse('Unauthorized: Invalid secret token', {
      status: 401,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // 2. Parseo y Triaje Entrópico con Zod
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const parseResult = TelegramUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    // Retornamos 200 a Telegram para evitar bucles de reintento ante updates no soportados
    return NextResponse.json({ ok: true, ignored: true });
  }

  const update = parseResult.data;

  // Instanciación de adaptadores y casos de uso
  const anchorRepository = new PrismaUserAnchorRepository();
  const encryptor = new AesGcmAnchorTokenEncryptor();
  const nonceRepository = new PrismaMagicLinkNonceRepository();
  const magicLinkSigner = new HmacMagicLinkSigner();

  const linkSessionUseCase = new LinkTelegramSessionUseCase(
    encryptor,
    anchorRepository,
    botGateway
  );
  const generateMagicLinkUseCase = new GenerateMagicLinkUseCase(
    anchorRepository,
    magicLinkSigner,
    nonceRepository,
    botGateway
  );
  const revokeAnchorUseCase = new RevokeTelegramAnchorUseCase(
    anchorRepository,
    botGateway
  );

  try {
    // 3. Manejo de Mensajes de Texto
    if (update.message?.text) {
      const text = update.message.text.trim();
      const chatId = String(update.message.chat.id);

      if (text.startsWith('/start')) {
        const parts = text.split(/\s+/);
        if (parts.length > 1 && parts[1]) {
          const anchorToken = parts[1].trim();
          await linkSessionUseCase.execute({
            encryptedAnchorToken: anchorToken,
            telegramChatId: chatId,
            telegramUsername: update.message.from?.username,
            firstName: update.message.from?.first_name,
          });
        } else {
          await botGateway.sendMessage(
            chatId,
            `👋 <b>¡Hola! Soy el Conserje Táctico de BarcelonaXplorer.</b>\n\n` +
            `Para blindar tu itinerario, genera tu ruta en nuestra PWA y pulsa el botón táctico <b>"Asegurar Ruta y Recibir Alertas"</b>.\n` +
            `¡Te esperamos en Barcelona!`
          );
        }
      } else if (text === '/recuperar' || text === '/pc') {
        await generateMagicLinkUseCase.execute(chatId);
      } else if (text === '/desanclar' || text === '/olvidarme') {
        await revokeAnchorUseCase.execute({ telegramChatId: chatId });
      }
    }

    // 4. Manejo de Callback Queries (Botones Inline)
    if (update.callback_query?.data) {
      const data = update.callback_query.data;
      const chatId = String(update.callback_query.from.id);

      if (data === 'cross_device_login') {
        await generateMagicLinkUseCase.execute(chatId);
      } else if (data === 'purge_my_data') {
        await revokeAnchorUseCase.execute({ telegramChatId: chatId });
      }
    }
  } catch (error) {
    console.error(
      '[Telegram Webhook Error]',
      error instanceof Error ? error.message : error
    );
  }

  // Siempre responder 200 OK a Telegram para acusar recibo
  return NextResponse.json({ ok: true });
}
