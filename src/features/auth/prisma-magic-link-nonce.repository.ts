import { PrismaClient } from '@prisma/client';
import {
  MagicLinkNonceRecord,
  MagicLinkNonceRepositoryPort,
} from '@/features/auth';

const globalForPrisma = globalThis as unknown as {
  prismaNonceClient?: PrismaClient;
};

const defaultPrisma = globalForPrisma.prismaNonceClient ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaNonceClient = defaultPrisma;
}

export class PrismaMagicLinkNonceRepository
  implements MagicLinkNonceRepositoryPort
{
  private readonly prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? defaultPrisma;
  }

  async saveNonce(
    tokenHash: string,
    sessionId: string,
    expiresAt: Date
  ): Promise<void> {
    await this.prisma.magicLinkNonce.create({
      data: {
        tokenHash,
        sessionId,
        expiresAt,
      },
    });
  }

  async findNonce(tokenHash: string): Promise<MagicLinkNonceRecord | null> {
    const record = await this.prisma.magicLinkNonce.findUnique({
      where: { tokenHash },
    });

    if (!record) {
      return null;
    }

    return {
      tokenHash: record.tokenHash,
      sessionId: record.sessionId,
      expiresAt: record.expiresAt,
      consumedAt: record.consumedAt,
    };
  }

  /**
   * Consume atómicamente el nonce en la base de datos.
   * Retorna true si se consumió con éxito, o false si ya estaba consumido (Anti-Replay).
   */
  async consumeNonce(tokenHash: string): Promise<boolean> {
    const updated = await this.prisma.magicLinkNonce.updateMany({
      where: {
        tokenHash,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });

    return updated.count > 0;
  }
}
