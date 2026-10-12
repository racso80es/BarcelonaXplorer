import { describe, expect, it, vi } from 'vitest';
import { ApiRestContextAdapter } from './api-rest-context.adapter';
import { ContextSourceSnapshot } from '../context-source.types';

describe('ApiRestContextAdapter (PBI-CTX-018)', () => {
  const plainSource: ContextSourceSnapshot = {
    id: 'src-rest-1',
    sourceTag: 'bcn-cultural-agenda-rest',
    displayName: 'API REST Genérica de Actividades',
    endpoint: 'https://api.example.com/v1/activities',
    type: 'API_REST',
    category: 'EVENT',
    status: 'ACTIVE',
    failedAttempts: 0,
    lastSuccessAt: null,
    proposedBy: 'HUMAN',
    supersedesSourceTag: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const plainRestPayload = [
    {
      id: 'act-101',
      title: 'Festival de Jazz en Gràcia',
      description: 'Concierto al aire libre en la plaza del Sol con entrada gratuita.',
      startsAt: '2026-10-18T19:00:00Z',
      endsAt: '2026-10-18T22:00:00Z',
      locationName: 'Plaça del Sol, Gràcia',
      lat: 41.4019,
      lng: 2.1565,
      url: 'https://api.example.com/events/act-101',
      price: 'Gratis',
      tags: ['jazz', 'musica', 'gracia'],
    },
    {
      id: 'act-102',
      name: 'Ruta Modernista por el Eixample',
      summary: 'Visita guiada por fachadas arquitectónicas modernistas de Barcelona.',
      startsAt: '2026-10-19T10:00:00Z',
      locationName: 'Passeig de Gràcia',
      lat: 41.3917,
      lng: 2.1649,
      tags: ['arquitectura', 'modernismo'],
    },
  ];

  it('CA-1 & CA-2: debe procesar exitosamente un JSON plano sin heurísticas CKAN ni literales forzados', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => plainRestPayload,
    });

    const adapter = new ApiRestContextAdapter(mockFetch as unknown as typeof fetch);
    const result = await adapter.fetch(plainSource);

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.result!.length).toBe(2);

    const first = result.result![0];
    // Identidad de la fuente respetada: empieza por sourceTag y preserva category
    expect(first.id).toBe('bcn-cultural-agenda-rest:act-101');
    expect(first.id).not.toContain('bcn-opendata');
    expect(first.sourceTag).toBe('bcn-cultural-agenda-rest');
    expect(first.category).toBe('EVENT');
    expect(first.title).toBe('Festival de Jazz en Gràcia');
    expect(first.summary).toContain('Concierto al aire libre');
    expect(first.location?.name).toBe('Plaça del Sol, Gràcia');
    expect(first.location?.lat).toBe(41.4019);
    expect(first.location?.lng).toBe(2.1565);
    expect(first.price).toBe('Gratis');
    expect(first.contentHash).toBeDefined();

    const second = result.result![1];
    expect(second.id).toBe('bcn-cultural-agenda-rest:act-102');
    expect(second.title).toBe('Ruta Modernista por el Eixample');
  });

  it('CA-2: debe procesar payload envuelto en propiedad data respetando categoría de la fuente', async () => {
    const poiSource: ContextSourceSnapshot = {
      ...plainSource,
      sourceTag: 'bcn-monuments-rest',
      category: 'POI',
    };

    const dataWrappedPayload = {
      data: [
        {
          id: 'poi-201',
          title: 'Castell de Montjuïc',
          description: 'Fortaleza militar histórica con vistas panorámicas sobre el puerto.',
          lat: 41.3633,
          lng: 2.1661,
        },
      ],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => dataWrappedPayload,
    });

    const adapter = new ApiRestContextAdapter(mockFetch as unknown as typeof fetch);
    const result = await adapter.fetch(poiSource);

    expect(result.success).toBe(true);
    expect(result.result!.length).toBe(1);

    const entry = result.result![0];
    expect(entry.id).toBe('bcn-monuments-rest:poi-201');
    expect(entry.category).toBe('POI');
    expect(entry.sourceTag).toBe('bcn-monuments-rest');
  });

  it('CA-2: debe retornar sobre de error 422 si el payload no es una estructura JSON compatible', async () => {
    const invalidPayload = {
      unexpectedKey: 'valor no compatible',
      numberField: 12345,
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => invalidPayload,
    });

    const adapter = new ApiRestContextAdapter(mockFetch as unknown as typeof fetch);
    const result = await adapter.fetch(plainSource);

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(422);
    expect(result.feedback).toContain('Payload estructural inválido');
  });

  it('debe retornar sobre con error HTTP si el servidor responde con error 404', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const adapter = new ApiRestContextAdapter(mockFetch as unknown as typeof fetch);
    const result = await adapter.fetch(plainSource);

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(404);
  });
});
