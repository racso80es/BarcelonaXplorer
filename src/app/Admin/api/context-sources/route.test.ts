import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET, setAdminServiceForTesting } from './route';
import { ContextAdminService } from '@/features/context-sources/context-admin.service';
import { createErrorEnvelope, createSuccessEnvelope } from '@/shared/operation-envelope';
import { ContextSourceSnapshot } from '@/features/context-sources/context-source.types';

describe('Route Handler: /Admin/api/context-sources', () => {
  let mockService: ContextAdminService;

  const dummySource: ContextSourceSnapshot = {
    id: 'src-123',
    sourceTag: 'test-tag',
    displayName: 'Test Source',
    endpoint: 'https://test.bcn',
    type: 'RSS',
    category: 'NEWS',
    status: 'PENDING_APPROVAL',
    failedAttempts: 0,
    proposedBy: 'ARGOS',
  };

  beforeEach(() => {
    mockService = {
      listSources: vi.fn().mockResolvedValue([dummySource]),
      listMemoryEntries: vi.fn().mockResolvedValue({ entries: [], isAvailable: true }),
      transitionSource: vi.fn().mockResolvedValue(
        createSuccessEnvelope({ ...dummySource, status: 'ACTIVE' })
      ),
    } as unknown as ContextAdminService;

    setAdminServiceForTesting(mockService);
  });

  afterEach(() => {
    setAdminServiceForTesting(null);
  });

  it('GET: retorna la lista de fuentes registradas', async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.result).toHaveLength(1);
  });

  it('POST: ejecuta transición legal y responde 200 OK con el sobre de éxito', async () => {
    const req = new NextRequest('http://localhost:3000/Admin/api/context-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceId: 'src-123',
        event: 'APPROVE',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.result.status).toBe('ACTIVE');
    expect(mockService.transitionSource).toHaveBeenCalledWith(
      'src-123',
      'APPROVE',
      'HUMAN',
      { endpoint: undefined }
    );
  });

  it('POST: responde 422 cuando la transición es ilegal según la máquina de estados', async () => {
    vi.mocked(mockService.transitionSource).mockResolvedValue(
      createErrorEnvelope(['Transición ilegal'], 422, 'Violación de estado')
    );

    const req = new NextRequest('http://localhost:3000/Admin/api/context-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceId: 'src-123',
        event: 'INGEST_OK',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(422);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.errors[0]).toBe('Transición ilegal');
  });

  it('POST: responde 400 cuando el payload es inválido', async () => {
    const req = new NextRequest('http://localhost:3000/Admin/api/context-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourceId: '',
        event: 'EVENTO_INEXISTENTE',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
