import { PrismaClient } from '@prisma/client';
import { prisma } from '@/shared/persistence/prisma';
import {
  MagicLinkNonceRecord,
  MagicLinkNonceRepositoryPort,
} from '@/features/auth';

export class PrismaMagicLinkNonceRepository
  implements MagicLinkNonceRepositoryPort
{
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
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
