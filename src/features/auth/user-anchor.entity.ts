import { TelegramChatId } from './telegram-chat-id.vo';
import { DomainException } from '@/shared/exceptions/domain.exception';

export interface UserAnchorProps {
  id: string;
  sessionId: string;
  telegramChatId: TelegramChatId;
  telegramUsername?: string | null;
  firstName?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastInteractionAt: Date;
}

/**
 * Entidad que modela un Anclaje Táctico Activo (Telegram Bridge).
 * Arquitectura S+ Grade:
 * - Sin estado "REVOKED": la desvinculación ejecuta un Hard-Delete físico en base de datos.
 * - Inmutabilidad de identidad física de Telegram y actualización de sesión activa.
 */
export class UserAnchor {
  constructor(private readonly props: UserAnchorProps) {
    if (!props.id || !props.sessionId) {
      throw new DomainException('UserAnchor requiere un id y un sessionId válidos.');
    }
  }

  public get id(): string {
    return this.props.id;
  }

  public get sessionId(): string {
    return this.props.sessionId;
  }

  public get telegramChatId(): TelegramChatId {
    return this.props.telegramChatId;
  }

  public get telegramUsername(): string | null | undefined {
    return this.props.telegramUsername;
  }

  public get firstName(): string | null | undefined {
    return this.props.firstName;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public get lastInteractionAt(): Date {
    return this.props.lastInteractionAt;
  }

  public updateSession(newSessionId: string): void {
    if (!newSessionId || newSessionId.trim() === '') {
      throw new DomainException('El nuevo sessionId no puede ser nulo o vacío.');
    }
    this.props.sessionId = newSessionId;
    this.props.lastInteractionAt = new Date();
    this.props.updatedAt = new Date();
  }

  public touch(): void {
    this.props.lastInteractionAt = new Date();
    this.props.updatedAt = new Date();
  }
}
