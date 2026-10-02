import { parse } from 'node-html-parser';
import { createErrorEnvelope, createSuccessEnvelope, OperationEnvelope } from '@/shared/operation-envelope';
import { calculateContextContentHash, ContextEntry, ContextEntrySchema } from '../context-entry.schema';
import { IContextSourceAdapter } from '../context-source-adapter.port';
import { ContextSourceSnapshot, ContextSourceType } from '../context-source.types';

/**
 * Aplana recursivamente estructuras JSON-LD extrayendo colecciones y @graph.
 */
function flattenJsonLd(item: unknown, out: unknown[]): void {
  if (!item || typeof item !== 'object') return;
  if (Array.isArray(item)) {
    for (const sub of item) {
      flattenJsonLd(sub, out);
    }
    return;
  }
  const obj = item as Record<string, unknown>;
  if (Array.isArray(obj['@graph'])) {
    for (const sub of obj['@graph']) {
      flattenJsonLd(sub, out);
    }
    return;
  }
  out.push(obj);
}

/**
 * Extrae todos los objetos JSON-LD de un documento HTML utilizando el parser de producción.
 * Tolera bloques corruptos de forma aislada sin abortar la extracción global.
 */
export function extractJsonLdBlocks(html: string): unknown[] {
  const root = parse(html);
  const scriptNodes = root.querySelectorAll('script');
  const results: unknown[] = [];

  for (const script of scriptNodes) {
    const typeAttr = script.getAttribute('type')?.toLowerCase().trim();
    if (typeAttr !== 'application/ld+json') {
      continue;
    }

    const text = script.text?.trim() || '';
    if (!text) continue;

    try {
      const parsed = JSON.parse(text);
      flattenJsonLd(parsed, results);
    } catch {
      // JSON inválido en un bloque específico no invalida los demás (CA-2)
    }
  }

  return results;
}

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDate(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || !raw.trim()) return undefined;
  const parsed = new Date(raw);
  return !isNaN(parsed.getTime()) ? parsed.toISOString() : undefined;
}

export class JsonLdContextAdapter implements IContextSourceAdapter {
  readonly type: ContextSourceType = 'JSON_LD';

  constructor(private readonly fetchFn: typeof fetch = fetch) {}

  async fetch(source: ContextSourceSnapshot): Promise<OperationEnvelope<ContextEntry[]>> {
    try {
      const response = await this.fetchFn(source.endpoint, {
        headers: {
          'User-Agent': 'BarcelonaXplorer-Bot/1.0 (+https://barcelonaxplorer.cat)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return createErrorEnvelope(
          [`Error HTTP ${response.status} al consultar HTML JSON-LD: ${source.endpoint}`],
          response.status >= 400 && response.status < 600 ? response.status : 500,
          'Fallo en la llamada HTTP al origen HTML JSON-LD'
        );
      }

      const html = await response.text();
      const rawBlocks = extractJsonLdBlocks(html);
      const validEntries: ContextEntry[] = [];

      for (const raw of rawBlocks) {
        if (!raw || typeof raw !== 'object') continue;
        const item = raw as Record<string, unknown>;
        const rawType = item['@type'];
        const types: string[] = Array.isArray(rawType)
          ? rawType.map((t) => String(t))
          : typeof rawType === 'string'
            ? [rawType]
            : [];

        const isEvent = types.some((t) => t.toLowerCase().includes('event'));
        const isVenue = types.some(
          (t) =>
            t.toLowerCase().includes('business') ||
            t.toLowerCase().includes('place') ||
            t.toLowerCase().includes('restaurant') ||
            t.toLowerCase().includes('attraction') ||
            t.toLowerCase().includes('museum')
        );

        if (!isEvent && !isVenue) {
          continue;
        }

        const rawName = typeof item.name === 'string' ? item.name : '';
        const title = stripHtml(rawName).slice(0, 200);
        if (title.length < 3) continue;

        const rawDesc =
          typeof item.description === 'string'
            ? item.description
            : typeof item.disambiguatingDescription === 'string'
              ? item.disambiguatingDescription
              : '';
        const strippedDesc = stripHtml(rawDesc);
        const summary = (
          strippedDesc.length >= 10
            ? strippedDesc
            : `${title} - Informació i context de l'activitat a Barcelona.`
        ).slice(0, 1200);

        const startsAt = normalizeDate(item.startDate);
        const endsAt = normalizeDate(item.endDate);

        // Ubicación
        let locationName = 'Barcelona';
        let lat: number | undefined;
        let lng: number | undefined;

        const loc = item.location ?? item.address;
        if (typeof loc === 'string') {
          locationName = stripHtml(loc).slice(0, 100);
        } else if (loc && typeof loc === 'object') {
          const locObj = loc as Record<string, unknown>;
          if (typeof locObj.name === 'string') {
            locationName = stripHtml(locObj.name).slice(0, 100);
          } else if (typeof locObj.streetAddress === 'string') {
            locationName = stripHtml(locObj.streetAddress).slice(0, 100);
          }

          const geo = (item.geo ?? locObj.geo) as Record<string, unknown> | undefined;
          if (geo && typeof geo === 'object') {
            const rawLat = Number(geo.latitude);
            const rawLng = Number(geo.longitude);
            if (!isNaN(rawLat) && rawLat >= 41.2 && rawLat <= 41.5) {
              lat = rawLat;
            }
            if (!isNaN(rawLng) && rawLng >= 2.0 && rawLng <= 2.3) {
              lng = rawLng;
            }
          }
        }

        const location = {
          name: locationName,
          ...(lat !== undefined ? { lat } : {}),
          ...(lng !== undefined ? { lng } : {}),
        };

        // Precio / Offers
        let priceStr: string | undefined;
        if (item.offers && typeof item.offers === 'object') {
          const offers = item.offers as Record<string, unknown>;
          if (offers.price !== undefined) {
            const cur = typeof offers.priceCurrency === 'string' ? offers.priceCurrency : 'EUR';
            priceStr = `${offers.price} ${cur}`.trim().slice(0, 64);
          }
        }

        // URL
        let itemUrl: string | undefined;
        if (typeof item.url === 'string' && item.url.startsWith('http')) {
          itemUrl = item.url;
        }

        // Expiración
        let expiresAt: string;
        if (isEvent) {
          const baseDate = endsAt ? new Date(endsAt) : startsAt ? new Date(startsAt) : new Date();
          expiresAt = new Date(baseDate.getTime() + 86400000).toISOString(); // +1 día
        } else {
          expiresAt = new Date(Date.now() + 90 * 86400000).toISOString(); // +90 días VENUE/POI
        }

        const category = isEvent ? ('EVENT' as const) : ('VENUE' as const);
        const externalId = typeof item['@id'] === 'string' ? item['@id'] : itemUrl || title;
        const idSuffix = Buffer.from(externalId).toString('base64url').slice(0, 48);

        const contentHash = calculateContextContentHash({
          title,
          summary,
          startsAt,
          endsAt,
          location,
          url: itemUrl,
          price: priceStr,
        });

        const candidate = {
          id: `${source.sourceTag}:${idSuffix}`,
          sourceTag: source.sourceTag,
          category,
          title,
          summary,
          startsAt,
          endsAt,
          location,
          url: itemUrl,
          price: priceStr,
          tags: types.map((t) => t.slice(0, 32)).slice(0, 12),
          expiresAt,
          contentHash,
        };

        const validated = ContextEntrySchema.safeParse(candidate);
        if (validated.success) {
          validEntries.push(validated.data);
        }
      }

      return createSuccessEnvelope(validEntries);
    } catch (err) {
      return createErrorEnvelope(
        [err instanceof Error ? err.message : String(err)],
        500,
        'Error inesperado en adaptador JSON-LD Schema.org'
      );
    }
  }
}
