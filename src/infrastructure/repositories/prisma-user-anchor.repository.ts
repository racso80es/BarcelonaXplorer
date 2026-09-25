import { PrismaClient } from '@prisma/client';
import { UserAnchorRepositoryPort } from '@/features/auth';
import { UserAnchor } from '@/features/auth';
import { TelegramChatId } from '@/features/auth';

// Prisma singleton para reutilización en entornos serverless/Next.js
const globalForPrisma = globalThis as unknown as {
  prismaUserAnchorClient?: PrismaClient;
};

const defaultPrisma = globalForPrisma.prismaUserAnchorClient ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaUserAnchorClient = defaultPrisma;
}

export class PrismaUserAnchorRepository implements UserAnchorRepositoryPort {
  private readonly prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? defaultPrisma;
  }

  async findByTelegramChatId(chatId: TelegramChatId): Promise<UserAnchor | null> {
    const record = await this.prisma.userAnchor.findUnique({
      where: { telegramChatId: chatId.getValue() },
    });

    if (!record) {
      return null;
    }

    return new UserAnchor({
      id: record.id,
      sessionId: record.sessionId,
      telegramChatId: new TelegramChatId(record.telegramChatId),
      telegramUsername: record.telegramUsername,
      firstName: record.firstName,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      lastInteractionAt: record.lastInteractionAt,
    });
  }

  async findBySessionId(sessionId: string): Promise<UserAnchor | null> {
    const record = await this.prisma.userAnchor.findFirst({
      where: { sessionId },
    });

    if (!record) {
      return null;
    }

    return new UserAnchor({
      id: record.id,
      sessionId: record.sessionId,
      telegramChatId: new TelegramChatId(record.telegramChatId),
      telegramUsername: record.telegramUsername,
      firstName: record.firstName,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      lastInteractionAt: record.lastInteractionAt,
    });
  }

  /**
   * Operación atómica de upsert protegida contra condiciones de carrera (Race Conditions)
   * generadas por reintentos agresivos del Webhook de Telegram.
   * Utiliza el ON DUPLICATE KEY UPDATE de MySQL a través del upsert de Prisma.
   */
  async atomicUpsert(anchor: UserAnchor): Promise<void> {
    const chatId = anchor.telegramChatId.getValue();

    await this.prisma.userAnchor.upsert({
      where: { telegramChatId: chatId },
      create: {
        id: anchor.id,
        sessionId: anchor.sessionId,
        telegramChatId: chatId,
        telegramUsername: anchor.telegramUsername ?? null,
        firstName: anchor.firstName ?? null,
        createdAt: anchor.createdAt,
        updatedAt: anchor.updatedAt,
        lastInteractionAt: anchor.lastInteractionAt,
      },
      update: {
        sessionId: anchor.sessionId,
        telegramUsername: anchor.telegramUsername ?? null,
        firstName: anchor.firstName ?? null,
        updatedAt: new Date(),
        lastInteractionAt: new Date(),
      },
    });
  }

  /**
   * Amnesia Táctica: Hard-Delete físico de la fila en MySQL.
   * Garantiza la aniquilación absoluta del rastro relacional del explorador.
   */
  async hardDeleteByChatId(chatId: TelegramChatId): Promise<void> {
    await this.prisma.userAnchor.deleteMany({
      where: { telegramChatId: chatId.getValue() },
    });
  }
}
