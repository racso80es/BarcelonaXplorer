import {
  LinkTelegramSessionCommand,
  LinkTelegramSessionResult,
  LinkTelegramSessionUseCasePort,
} from '@/application/ports/in/link-telegram-session.use-case.port';
import { AnchorTokenEncryptorPort } from './anchor-token-encryptor.port';
import { UserAnchorRepositoryPort } from './user-anchor-repository.port';
import { TelegramBotGatewayPort } from '@/application/ports/out/telegram-bot-gateway.port';
import { TelegramChatId } from './telegram-chat-id.vo';
import { UserAnchor } from './user-anchor.entity';

export class LinkTelegramSessionUseCase implements LinkTelegramSessionUseCasePort {
  constructor(
    private readonly encryptor: AnchorTokenEncryptorPort,
    private readonly repository: UserAnchorRepositoryPort,
    private readonly botGateway: TelegramBotGatewayPort,
    private readonly appBaseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'https://barcelonaxplorer.com'
  ) {}

  async execute(command: LinkTelegramSessionCommand): Promise<LinkTelegramSessionResult> {
    // 1. Descifrado autenticado del token AES-256-GCM
    const sessionId = await this.encryptor.decryptAnchorToken(
      command.encryptedAnchorToken
    );

    const chatId = new TelegramChatId(command.telegramChatId);

    // 2. Comprobar si ya existe un anclaje previo
    const existing = await this.repository.findByTelegramChatId(chatId);

    const now = new Date();
    const anchor = existing
      ? new UserAnchor({
          id: existing.id,
          sessionId,
          telegramChatId: chatId,
          telegramUsername: command.telegramUsername ?? existing.telegramUsername,
          firstName: command.firstName ?? existing.firstName,
          createdAt: existing.createdAt,
          updatedAt: now,
          lastInteractionAt: now,
        })
      : new UserAnchor({
          id: `anc_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`,
          sessionId,
          telegramChatId: chatId,
          telegramUsername: command.telegramUsername ?? null,
          firstName: command.firstName ?? null,
          createdAt: now,
          updatedAt: now,
          lastInteractionAt: now,
        });

    // 3. Persistencia atómica resistente a Race Conditions
    await this.repository.atomicUpsert(anchor);

    // 4. Confirmación interactiva inmediata en Telegram
    const welcomeText =
      `🛡️ <b>¡Itinerario S+ Grade blindado con éxito!</b>\n\n` +
      `Tu sesión de <b>BarcelonaXplorer</b> ha quedado anclada de forma segura a este chat.\n` +
      `Tu ruta está a salvo ante pérdidas de cookies y lista para recibir alertas tácticas.\n\n` +
      `¿Deseas continuar en este móvil o abrir tu ruta en un ordenador de sobremesa?`;

    await this.botGateway.sendMessage(chatId.getValue(), welcomeText, [
      [
        {
          text: '💻 Abrir en mi PC / Tablet',
          callback_data: 'cross_device_login',
        },
        {
          text: '🗺️ Ver mi Ruta',
          url: `${this.appBaseUrl}/orchestrator`,
        },
      ],
      [
        {
          text: '🧹 Borrar mi rastro (Amnesia Táctica)',
          callback_data: 'purge_my_data',
        },
      ],
    ]);

    return {
      success: true,
      sessionId,
    };
  }
}
