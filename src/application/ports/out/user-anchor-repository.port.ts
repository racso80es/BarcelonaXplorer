import { UserAnchor } from '@/domain/entities/user-anchor.entity';
import { TelegramChatId } from '@/domain/value-objects/telegram-chat-id.vo';

/**
 * Puerto de Salida para el almacenamiento relacional de anclajes de usuario.
 * Garantiza resiliencia transaccional contra condiciones de carrera y borrado físico (Hard-Delete).
 */
export interface UserAnchorRepositoryPort {
  findByTelegramChatId(chatId: TelegramChatId): Promise<UserAnchor | null>;
  findBySessionId(sessionId: string): Promise<UserAnchor | null>;

  /**
   * Operación transaccional atómica resistente a reintentos concurrentes de Telegram.
   * Si ya existe un anclaje para el chatId, actualiza la sesión activa.
   */
  atomicUpsert(anchor: UserAnchor): Promise<void>;

  /**
   * Amnesia Táctica: Hard-Delete físico de la fila en MySQL.
   */
  hardDeleteByChatId(chatId: TelegramChatId): Promise<void>;
}
