import { describe, it, expect } from 'vitest';
import { UserAnchor } from './user-anchor.entity';
import { TelegramChatId } from './telegram-chat-id.vo';
import { DomainException } from '@/shared/exceptions/domain.exception';

describe('UserAnchor Domain Entity', () => {
  const defaultProps = {
    id: 'anc_123',
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    telegramChatId: new TelegramChatId('987654321'),
    telegramUsername: 'test_explorer',
    firstName: 'Alex',
    createdAt: new Date('2026-09-01T10:00:00Z'),
    updatedAt: new Date('2026-09-01T10:00:00Z'),
    lastInteractionAt: new Date('2026-09-01T10:00:00Z'),
  };

  it('instancia correctamente con propiedades válidas', () => {
    const anchor = new UserAnchor(defaultProps);

    expect(anchor.id).toBe('anc_123');
    expect(anchor.sessionId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(anchor.telegramChatId.getValue()).toBe('987654321');
    expect(anchor.telegramUsername).toBe('test_explorer');
    expect(anchor.firstName).toBe('Alex');
  });

  it('lanza DomainException si falta id o sessionId', () => {
    expect(() => new UserAnchor({ ...defaultProps, id: '' })).toThrow(DomainException);
    expect(() => new UserAnchor({ ...defaultProps, sessionId: '' })).toThrow(DomainException);
  });

  it('permite actualizar la sesión activa y actualiza timestamps', () => {
    const anchor = new UserAnchor(defaultProps);
    const newSession = '661f9511-f30c-42e5-b827-557766551111';

    anchor.updateSession(newSession);

    expect(anchor.sessionId).toBe(newSession);
    expect(anchor.updatedAt.getTime()).toBeGreaterThanOrEqual(defaultProps.updatedAt.getTime());
    expect(anchor.lastInteractionAt.getTime()).toBeGreaterThanOrEqual(defaultProps.lastInteractionAt.getTime());
  });

  it('lanza DomainException si se intenta actualizar a un sessionId inválido', () => {
    const anchor = new UserAnchor(defaultProps);
    expect(() => anchor.updateSession('')).toThrow(DomainException);
  });

  it('permite tocar la última interacción (touch)', () => {
    const anchor = new UserAnchor(defaultProps);
    anchor.touch();
    expect(anchor.lastInteractionAt.getTime()).toBeGreaterThanOrEqual(defaultProps.lastInteractionAt.getTime());
  });
});
