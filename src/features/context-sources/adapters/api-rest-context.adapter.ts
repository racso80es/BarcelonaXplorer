import { z } from 'zod';
import { createErrorEnvelope, createSuccessEnvelope, OperationEnvelope } from '@/shared/operation-envelope';
import {
  calculateContextContentHash,
  ContextEntry,
  ContextEntryCategory,
  ContextEntryCategorySchema,
  ContextEntrySchema,
} from '../context-entry.schema';
import { IContextSourceAdapter } from '../context-source-adapter.port';
import { ContextSourceSnapshot, ContextSourceType } from '../context-source.types';

const RestItemSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    title: z.string().optional(),
    name: z.string().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    expiresAt: z.string().optional(),
    url: z.string().optional(),
    locationName: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    tags: z.array(z.string()).optional(),
    price: z.string().optional(),
  })
  .passthrough();

const RestPayloadSchema = z.union([
  z.array(RestItemSchema),
  z.object({
    data: z.array(RestItemSchema),
  }),
  z.object({
    items: z.array(RestItemSchema),
  }),
]);

function normalizeIsoDateTime(raw?: string): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00.000Z`;
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(trimmed)) {
    return `${trimmed}Z`;
  }
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

/**
 * Adaptador genérico para fuentes API REST (PBI-CTX-018).
 * Desacoplado de CKAN y validado estrictamente mediante esquemas Zod (Filtro C - Sin LLM).
 */
export class ApiRestContextAdapter implements IContextSourceAdapter {
  readonly type: ContextSourceType = 'API_REST';

  constructor(private readonly fetchFn: typeof fetch = fetch) {}

  async fetch(source: ContextSourceSnapshot): Promise<OperationEnvelope<ContextEntry[]>> {
    try {
      const response = await this.fetchFn(source.endpoint, {
        headers: {
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return createErrorEnvelope(
          [`Error HTTP ${response.status} al consultar API REST: ${source.endpoint}`],
          response.status >= 400 && response.status < 600 ? response.status : 500,
          'Fallo en la llamada HTTP al origen API REST'
        );
      }

      const rawJson = await response.json();
      const parsedPayload = RestPayloadSchema.safeParse(rawJson);

      if (!parsedPayload.success) {
        return createErrorEnvelope(
          ['El payload retornado por la API REST no cumple el esquema estructural esperado'],
          422,
          'Payload estructural inválido'
        );
      }

      let rawItems: z.infer<typeof RestItemSchema>[] = [];
      if (Array.isArray(parsedPayload.data)) {
        rawItems = parsedPayload.data;
      } else if ('data' in parsedPayload.data) {
        rawItems = parsedPayload.data.data;
      } else if ('items' in parsedPayload.data) {
        rawItems = parsedPayload.data.items;
      }

      const parsedCategory = ContextEntryCategorySchema.safeParse(source.category);
      const category: ContextEntryCategory = parsedCategory.success ? parsedCategory.data : 'EVENT';

      const validEntries: ContextEntry[] = [];

      for (let i = 0; i < rawItems.length; i++) {
        const item = rawItems[i];
        const rawId = item.id !== undefined && item.id !== null ? String(item.id).trim() : `item-${i + 1}`;
        const id = `${source.sourceTag}:${rawId}`;

        const rawTitle = (item.title ?? item.name ?? '').trim();
        if (rawTitle.length < 3) continue;
        const title = rawTitle;

        const rawSummary = (item.summary ?? item.description ?? '').trim();
        const summary = (
          rawSummary.length >= 10
            ? rawSummary
            : `${title} - Información de ${source.displayName}.`
        ).slice(0, 1200);

        const startsAt = normalizeIsoDateTime(item.startsAt);
        const endsAt = normalizeIsoDateTime(item.endsAt);

        let expiresAt = normalizeIsoDateTime(item.expiresAt);
        if (!expiresAt) {
          const baseDate = endsAt
            ? new Date(endsAt)
            : startsAt
              ? new Date(startsAt)
              : new Date(Date.now() + 7 * 86400000);
          expiresAt = new Date(baseDate.getTime() + 86400000).toISOString();
        }

        let location: { name?: string; lat?: number; lng?: number } | undefined = undefined;
        if (typeof item.lat === 'number' && typeof item.lng === 'number') {
          location = {
            name: item.locationName ?? 'Barcelona',
            lat: item.lat,
            lng: item.lng,
          };
        } else if (item.locationName) {
          location = { name: item.locationName };
        }

        const validUrl =
          item.url && (item.url.startsWith('http://') || item.url.startsWith('https://'))
            ? item.url
            : undefined;

        const tags = (item.tags ?? []).map((t) => String(t).trim()).filter((t) => t.length > 0).slice(0, 12);
        const price = item.price ? String(item.price).trim() : undefined;

        const contentHash = calculateContextContentHash({
          title,
          summary,
          startsAt,
          endsAt,
          location,
          url: validUrl,
          price,
        });

        const candidate: ContextEntry = {
          id,
          sourceTag: source.sourceTag,
          category,
          title,
          summary,
          startsAt,
          endsAt,
          location,
          url: validUrl,
          price,
          tags,
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
        'Error inesperado en adaptador API REST'
      );
    }
  }
}
