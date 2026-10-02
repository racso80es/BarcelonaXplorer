import { createErrorEnvelope, createSuccessEnvelope, OperationEnvelope } from '@/shared/operation-envelope';
import { calculateContextContentHash, ContextEntry, ContextEntrySchema } from '../context-entry.schema';
import { IContextSourceAdapter } from '../context-source-adapter.port';
import { ContextSourceSnapshot, ContextSourceType } from '../context-source.types';

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

      const rawJson = (await response.json()) as unknown;
      if (!rawJson || typeof rawJson !== 'object') {
        return createErrorEnvelope(
          ['El payload retornado por la API REST no es un objeto JSON válido'],
          422,
          'Payload estructural inválido'
        );
      }

      const root = rawJson as Record<string, unknown>;
      let items: Record<string, unknown>[] = [];

      // Detección de CKAN package_search: { success: true, result: { results: [...] } }
      if (root.success === true && root.result && typeof root.result === 'object') {
        const resultObj = root.result as Record<string, unknown>;
        if (Array.isArray(resultObj.results)) {
          items = resultObj.results as Record<string, unknown>[];
        }
      } else if (Array.isArray(root)) {
        items = root as Record<string, unknown>[];
      } else if (Array.isArray(root.data)) {
        items = root.data as Record<string, unknown>[];
      }

      const validEntries: ContextEntry[] = [];
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 86400000).toISOString(); // 30 días TTL

      for (const item of items) {
        if (!item || typeof item !== 'object') continue;

        const id = String(item.id ?? item.code ?? `item-${validEntries.length + 1}`);

        // Título traducido o directo
        let title = '';
        if (item.title_translated && typeof item.title_translated === 'object') {
          const t = item.title_translated as Record<string, string>;
          title = t.ca || t.es || t.en || '';
        }
        if (!title && typeof item.title === 'string') {
          title = item.title;
        }
        if (!title && typeof item.name === 'string') {
          title = item.name;
        }
        title = title.trim();
        if (!title || title.length < 3) continue;

        // Notas / Descripción
        let notes = '';
        if (item.notes_translated && typeof item.notes_translated === 'object') {
          const n = item.notes_translated as Record<string, string>;
          notes = n.ca || n.es || n.en || '';
        }
        if (!notes && typeof item.notes === 'string') {
          notes = item.notes;
        }
        if (!notes && typeof item.description === 'string') {
          notes = item.description;
        }
        const summary = (notes && notes.trim().length >= 10
          ? notes.trim()
          : `${title} - Conjunt de dades i agenda pública de l'Ajuntament de Barcelona.`
        ).slice(0, 1200);

        const url = typeof item.url === 'string' && item.url.startsWith('http')
          ? item.url
          : `https://opendata-ajuntament.barcelona.cat/data/dataset/${id}`;

        const tags: string[] = [];
        if (Array.isArray(item.tags)) {
          for (const t of item.tags) {
            if (t && typeof t === 'object' && 'name' in t && typeof t.name === 'string') {
              tags.push(t.name);
            }
          }
        }
        const filteredTags = tags.slice(0, 12);
        const location = { name: 'Barcelona' };

        const contentHash = calculateContextContentHash({
          title,
          summary,
          location,
          url,
        });

        const candidate = {
          id: `bcn-opendata:${id}`,
          sourceTag: source.sourceTag,
          category: 'EVENT' as const,
          title,
          summary,
          location,
          url,
          tags: filteredTags,
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
