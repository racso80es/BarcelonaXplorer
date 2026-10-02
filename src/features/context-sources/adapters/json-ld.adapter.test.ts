import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { extractJsonLdBlocks, JsonLdContextAdapter } from './json-ld.adapter';
import { ContextSourceSnapshot } from '../context-source.types';

describe('extractJsonLdBlocks', () => {
  it('extrae bloques simples, arrays y @graph tolerantemente ante bloques corruptos', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script type="application/ld+json">
            {"@context": "https://schema.org", "@type": "Event", "name": "Concert 1"}
          </script>
          <script type="application/ld+json">
            INVALID JSON CONTENT HERE {{{
          </script>
          <script type="text/javascript">
            const js = 123;
          </script>
          <script type="application/ld+json">
            [
              {"@type": "Event", "name": "Concert 2"},
              {"@type": "Event", "name": "Concert 3"}
            ]
          </script>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@graph": [
                {"@type": "Restaurant", "name": "Bar Canigó"},
                {"@type": "Place", "name": "Parc Güell"}
              ]
            }
          </script>
        </head>
        <body>Contenido</body>
      </html>
    `;

    const blocks = extractJsonLdBlocks(html) as Array<{ name?: string }>;
    expect(blocks).toHaveLength(5);
    expect(blocks.map((b) => b.name)).toEqual([
      'Concert 1',
      'Concert 2',
      'Concert 3',
      'Bar Canigó',
      'Parc Güell',
    ]);
  });
});

describe('JsonLdContextAdapter', () => {
  const dummySource: ContextSourceSnapshot = {
    id: 'source-jsonld-1',
    sourceTag: 'timeout-bcn',
    displayName: 'Time Out Barcelona',
    endpoint: 'https://www.timeout.es/barcelona/es/que-hacer',
    type: 'JSON_LD',
    category: 'EVENT',
    status: 'ACTIVE',
    failedAttempts: 0,
    proposedBy: 'SEED',
  };

  it('procesa fixture real timeout-jsonld.html retornando lista vacía limpia (CA-4)', async () => {
    const fixturePath = path.resolve(
      __dirname,
      '../../../../Documentacion/Fuentes/muestras-contexto/timeout-jsonld.html'
    );
    const htmlFixture = readFileSync(fixturePath, 'utf-8');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => htmlFixture,
    });

    const adapter = new JsonLdContextAdapter(mockFetch as unknown as typeof fetch);
    const envelope = await adapter.fetch(dummySource);

    expect(envelope.success).toBe(true);
    // En timeout-jsonld.html el único script ld+json es de tipo WebPage, por lo que no genera entradas de evento
    expect(envelope.result).toEqual([]);
    expect(mockFetch).toHaveBeenCalledWith(
      dummySource.endpoint,
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': 'BarcelonaXplorer-Bot/1.0 (+https://barcelonaxplorer.cat)',
        }),
      })
    );
  });

  it('mapea correctamente eventos y locales schema.org a ContextEntry', async () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "MusicEvent",
            "name": "Festival de Jazz de Barcelona",
            "description": "Concert magistral a la Sala Apolo amb músics internacionals.",
            "startDate": "2026-10-15T20:00:00+02:00",
            "endDate": "2026-10-15T23:00:00+02:00",
            "location": {
              "@type": "Place",
              "name": "Sala Apolo",
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 41.3745,
                "longitude": 2.1695
              }
            },
            "offers": {
              "@type": "Offer",
              "price": "25.00",
              "priceCurrency": "EUR"
            },
            "url": "https://sala-apolo.com/jazz"
          }
          </script>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Restaurant",
            "name": "Bodega Gràcia",
            "description": "Tapes tradicionals i vermut casolà al barri de Gràcia.",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Carrer de Verdi 25"
            },
            "geo": {
              "latitude": 41.4035,
              "longitude": 2.1565
            },
            "url": "https://bodegagracia.cat"
          }
          </script>
        </head>
      </html>
    `;

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => html,
    });

    const adapter = new JsonLdContextAdapter(mockFetch as unknown as typeof fetch);
    const envelope = await adapter.fetch(dummySource);

    expect(envelope.success).toBe(true);
    expect(envelope.result).toHaveLength(2);
    const results = envelope.result ?? [];

    const eventEntry = results.find((e) => e.category === 'EVENT')!;
    expect(eventEntry).toBeDefined();
    expect(eventEntry.title).toBe('Festival de Jazz de Barcelona');
    expect(eventEntry.summary).toContain('Concert magistral');
    expect(eventEntry.startsAt).toBe('2026-10-15T18:00:00.000Z');
    expect(eventEntry.location?.name).toBe('Sala Apolo');
    expect(eventEntry.location?.lat).toBeCloseTo(41.3745);
    expect(eventEntry.location?.lng).toBeCloseTo(2.1695);
    expect(eventEntry.price).toBe('25.00 EUR');

    const venueEntry = results.find((e) => e.category === 'VENUE')!;
    expect(venueEntry).toBeDefined();
    expect(venueEntry.title).toBe('Bodega Gràcia');
    expect(venueEntry.location?.name).toBe('Carrer de Verdi 25');
  });

  it('gestiona páginas sin bloques JSON-LD retornando array vacío y success: true', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '<html><body>Página sin ld+json</body></html>',
    });

    const adapter = new JsonLdContextAdapter(mockFetch as unknown as typeof fetch);
    const envelope = await adapter.fetch(dummySource);

    expect(envelope.success).toBe(true);
    expect(envelope.result).toEqual([]);
  });

  it('gestiona errores HTTP retornando sobre de error determinista', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    });

    const adapter = new JsonLdContextAdapter(mockFetch as unknown as typeof fetch);
    const envelope = await adapter.fetch(dummySource);

    expect(envelope.success).toBe(false);
    expect(envelope.exitCode).toBe(404);
  });
});
