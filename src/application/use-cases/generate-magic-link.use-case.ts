import { UserAnchorRepositoryPort } from '@/features/auth';
import { MagicLinkSignerPort } from '@/features/auth';
import { MagicLinkNonceRepositoryPort } from '@/application/ports/out/magic-link-nonce-repository.port';
import { TelegramBotGatewayPort } from '@/features/telegram';
import { TelegramChatId } from '@/features/auth';
import { DomainException } from '@/domain/exceptions/domain.exception';

async function computeSha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class GenerateMagicLinkUseCase {
  constructor(
    private readonly anchorRepository: UserAnchorRepositoryPort,
    private readonly magicLinkSigner: MagicLinkSignerPort,
    private readonly nonceRepository: MagicLinkNonceRepositoryPort,
    private readonly botGateway: TelegramBotGatewayPort,
    private readonly appBaseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'https://barcelonaxplorer.com'
  ) {}

  async execute(chatIdStr: string): Promise<string> {
    const chatId = new TelegramChatId(chatIdStr);
    const anchor = await this.anchorRepository.findByTelegramChatId(chatId);

    if (!anchor) {
      await this.botGateway.sendMessage(
        chatId.getValue(),
        '⚠️ <b>No tienes ninguna sesión anclada activa.</b>\n\nGenera una ruta en BarcelonaXplorer y pulsa el botón "Asegurar Ruta" para vincular tu dispositivo.'
      );
      throw new DomainException('No existe anclaje activo para este chat de Telegram.');
    }

    // TTL de 15 minutos (900.000 ms)
    const expiresAtMs = Date.now() + 15 * 60 * 1000;
    const expiresAt = new Date(expiresAtMs);
    const nonce = crypto.randomUUID().replace(/-/g, '');
    const tokenHash = await computeSha256Hex(nonce);

    // Registro de Nonce anti-replay
    await this.nonceRepository.saveNonce(tokenHash, anchor.sessionId, expiresAt);

    // Firma HMAC-SHA256
    const signedToken = await this.magicLinkSigner.signToken({
      sessionId: anchor.sessionId,
      telegramChatId: chatId.getValue(),
      expiresAt: expiresAtMs,
      nonce,
    });

    const magicUrl = `${this.appBaseUrl}/api/auth/magic-link?token=${signedToken}`;

    const text =
      `🔗 <b>Enlace Mágico de Acceso Cross-Device</b>\n\n` +
      `Usa este enlace para abrir tu itinerario en tu ordenador o tablet sin necesidad de contraseñas:\n\n` +
      `⏱️ <i>Válido durante los próximos 15 minutos (un solo uso).</i>`;

    await this.botGateway.sendMessage(chatId.getValue(), text, [
      [
        {
          text: '🚀 Abrir mi Itinerario en el Navegador',
          url: magicUrl,
        },
      ],
    ]);

    return magicUrl;
  }
}
