import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { RssContextAdapter } from './rss-context.adapter';
import { ContextSourceSnapshot } from '../context-source.types';

describe('RssContextAdapter', () => {
  const fixturePath = path.resolve(
    __dirname,
    '../../../../Documentacion/Fuentes/muestras-contexto/beteve-agenda.rss'
  );
  const rawRss = fs.readFileSync(fixturePath, 'utf8');

  const baseSource: ContextSourceSnapshot = {
    id: 'src-rss-1',
    sourceTag: 'beteve-agenda-cultural',
    displayName: 'Betevé RSS',
    endpoint: 'https://beteve.cat/feed/',
    type: 'RSS',
    category: 'NEWS',
    status: 'ACTIVE',
    failedAttempts: 0,
    lastSuccessAt: null,
    proposedBy: 'SEED',
    supersedesSourceTag: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('debe procesar exitosamente la muestra real de Betevé RSS purgando HTML de las descripciones', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => rawRss,
    });

    const adapter = new RssContextAdapter(mockFetch as unknown as typeof fetch);
    const result = await adapter.fetch(baseSource);

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.result!.length).toBeGreaterThanOrEqual(1);

    const first = result.result![0];
    expect(first.category).toBe('NEWS');
    expect(first.id).toMatch(/^beteve:/);
    expect(first.summary).not.toContain('<p>');
    expect(first.summary).not.toContain('<div>');
    expect(first.tags.length).toBeGreaterThan(0);
  });

  it('debe rechazar con error 422 si el contenido recibido no es un feed RSS', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '<html><body>Not a feed</body></html>',
    });

    const adapter = new RssContextAdapter(mockFetch as unknown as typeof fetch);
    const result = await adapter.fetch(baseSource);

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(422);
  });
});
