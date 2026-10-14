import {
  UserAnchorRepositoryPort,
  MagicLinkSignerPort,
  MagicLinkNonceRepositoryPort,
  AnchorTokenEncryptorPort,
} from '@/features/auth';
import { TelegramBotGatewayPort } from '@/features/telegram';
import { DomainException } from '@/shared/exceptions/domain.exception';

async function computeSha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export type DispatchImmediateRouteResult =
  | {
      status: 'DELIVERED';
      telegramChatId: string;
      magicUrl: string;
    }
  | {
      status: 'ANCHOR_REQUIRED';
      deepLink: string;
    };

/**
 * Caso de Uso: Despacho Inmediato de Ruta hacia Telegram (PBI-ORCH-PRO-001 / CA-4 & CA-5).
 *
 * Flujo:
 * - Si existe UserAnchor para la sessionId: envía un solo sendMessage a ese telegramChatId
 *   con el magic link seguro de reapertura de sesión.
 * - Si no existe UserAnchor: forja y retorna el deep link de Telegram (mismo contrato que anchor-link).
 */
export class DispatchImmediateRouteToTelegramUseCase {
  constructor(
    private readonly anchorRepository: UserAnchorRepositoryPort,
    private readonly botGateway: TelegramBotGatewayPort,
    private readonly magicLinkSigner: MagicLinkSignerPort,
    private readonly nonceRepository: MagicLinkNonceRepositoryPort,
    private readonly tokenEncryptor: AnchorTokenEncryptorPort,
    private readonly appBaseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'https://barcelonaxplorer.com',
    private readonly botUsername: string = process.env.TELEGRAM_BOT_USERNAME || 'BXplorerBot',
  ) {}

  async execute(sessionId: string): Promise<DispatchImmediateRouteResult> {
    if (!sessionId || sessionId.trim() === '') {
      throw new DomainException('sessionId es requerido para el despacho inmediato.');
    }

    const anchor = await this.anchorRepository.findBySessionId(sessionId);

    // CA-5: Si no existe anclaje previo, retornar el deep link oficial sin inventar chats ni onboardings
    if (!anchor) {
      const token = await this.tokenEncryptor.encryptSessionId(sessionId);
      const deepLink = `https://t.me/${this.botUsername}?start=${token}`;
      return {
        status: 'ANCHOR_REQUIRED',
        deepLink,
      };
    }

    // CA-4: Con anclaje, emitir un único sendMessage al chat anclado con enlace mágico
    const expiresAtMs = Date.now() + 15 * 60 * 1000;
    const expiresAt = new Date(expiresAtMs);
    const nonce = crypto.randomUUID().replace(/-/g, '');
    const tokenHash = await computeSha256Hex(nonce);

    await this.nonceRepository.saveNonce(tokenHash, anchor.sessionId, expiresAt);

    const signedToken = await this.magicLinkSigner.signToken({
      sessionId: anchor.sessionId,
      telegramChatId: anchor.telegramChatId.getValue(),
      expiresAt: expiresAtMs,
      nonce,
    });

    const magicUrl = `${this.appBaseUrl}/api/auth/magic-link?token=${signedToken}`;

    const text =
      `🧭 <b>Tu Ruta Táctica Inmediata</b>\n\n` +
      `Usa este enlace para reabrir y seguir tu itinerario activo en el navegador:\n\n` +
      `⏱️ <i>Válido durante los próximos 15 minutos (un solo uso).</i>`;

    await this.botGateway.sendMessage(anchor.telegramChatId.getValue(), text, [
      [
        {
          text: '🚀 Abrir mi Itinerario en el Navegador',
          url: magicUrl,
        },
      ],
    ]);

    return {
      status: 'DELIVERED',
      telegramChatId: anchor.telegramChatId.getValue(),
      magicUrl,
    };
  }
}
