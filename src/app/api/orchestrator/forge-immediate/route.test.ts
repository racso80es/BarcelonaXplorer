import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

const mockExecute = vi.fn();

vi.mock('@/features/telegram/dispatch-immediate-route.use-case', () => {
  return {
    DispatchImmediateRouteToTelegramUseCase: class {
      execute = mockExecute;
    },
  };
});

vi.mock('@/features/auth/server', () => ({
  PrismaUserAnchorRepository: vi.fn(),
  HmacMagicLinkSigner: vi.fn(),
  PrismaMagicLinkNonceRepository: vi.fn(),
  AesGcmAnchorTokenEncryptor: vi.fn(),
}));

vi.mock('@/features/telegram/server', () => ({
  TelegramBotApiGateway: vi.fn(),
}));

describe('POST /api/orchestrator/forge-immediate (PBI-ORCH-PRO-001 / CA-4 & CA-5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 400 si no existe cookie bx_session_id', async () => {
    const req = new NextRequest('http://localhost:3000/api/orchestrator/forge-immediate', {
      method: 'POST',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.exitCode).toBe(400);
    expect(body.errors).toContain('No active session found in cookies');
  });

  it('retorna 200 con OperationEnvelope cuando el caso de uso entrega a Telegram (CA-4)', async () => {
    mockExecute.mockResolvedValueOnce({
      status: 'DELIVERED',
      telegramChatId: '123456',
      magicUrl: 'https://barcelonaxplorer.com/api/auth/magic-link?token=abc',
    });

    const req = new NextRequest('http://localhost:3000/api/orchestrator/forge-immediate', {
      method: 'POST',
      headers: {
        cookie: 'bx_session_id=sess-route-1',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.exitCode).toBe(0);
    expect(body.result.status).toBe('DELIVERED');
    expect(body.result.telegramChatId).toBe('123456');
    expect(mockExecute).toHaveBeenCalledWith('sess-route-1');
  });

  it('retorna 200 con OperationEnvelope cuando se requiere anclaje previo (CA-5)', async () => {
    mockExecute.mockResolvedValueOnce({
      status: 'ANCHOR_REQUIRED',
      deepLink: 'https://t.me/BXplorerBot?start=token-xyz',
    });

    const req = new NextRequest('http://localhost:3000/api/orchestrator/forge-immediate', {
      method: 'POST',
      headers: {
        cookie: 'bx_session_id=sess-route-2',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.exitCode).toBe(0);
    expect(body.result.status).toBe('ANCHOR_REQUIRED');
    expect(body.result.deepLink).toBe('https://t.me/BXplorerBot?start=token-xyz');
  });

  it('retorna 500 si el caso de uso arroja error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('Fallo de infraestructura'));

    const req = new NextRequest('http://localhost:3000/api/orchestrator/forge-immediate', {
      method: 'POST',
      headers: {
        cookie: 'bx_session_id=sess-route-3',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.exitCode).toBe(500);
    expect(body.errors).toContain('Fallo de infraestructura');
  });
});
