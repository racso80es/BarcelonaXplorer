import { z } from 'zod';
import { createErrorEnvelope, createSuccessEnvelope, OperationEnvelope } from '@/shared/operation-envelope';
import { calculateContextContentHash, ContextEntry, ContextEntrySchema } from '../context-entry.schema';
import { IContextSourceAdapter } from '../context-source-adapter.port';
import { ContextSourceSnapshot, ContextSourceType } from '../context-source.types';

const SparqlBindingSchema = z.object({
  item: z.object({ value: z.string().url() }),
  itemLabel: z.object({ value: z.string().min(1) }),
  coord: z.object({ value: z.string() }).optional(),
  description: z.object({ value: z.string() }).optional(),
});

const SparqlResponseSchema = z.object({
  results: z.object({
    bindings: z.array(SparqlBindingSchema),
  }),
});

export class SparqlContextAdapter implements IContextSourceAdapter {
  readonly type: ContextSourceType = 'SPARQL';

  constructor(private readonly fetchFn: typeof fetch = fetch) {}

  async fetch(source: ContextSourceSnapshot): Promise<OperationEnvelope<ContextEntry[]>> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/sparql-results+json',
        'User-Agent': 'BarcelonaXplorer/1.0 (https://barcelonaxplorer.cat; context-engine)',
      };

      const response = await this.fetchFn(source.endpoint, {
        headers,
      });

      if (!response.ok) {
        return createErrorEnvelope(
          [`Error HTTP ${response.status} al consultar endpoint SPARQL: ${source.endpoint}`],
          response.status >= 400 && response.status < 600 ? response.status : 500,
          'Fallo en la llamada HTTP al origen SPARQL'
        );
      }

      const rawJson = (await response.json()) as unknown;
      const parsedRoot = SparqlResponseSchema.safeParse(rawJson);

      if (!parsedRoot.success) {
        return createErrorEnvelope(
          ['El payload SPARQL no cumple la estructura estándar W3C sparql-results+json'],
          422,
          'Payload estructural SPARQL inválido'
        );
      }

      const validEntries: ContextEntry[] = [];
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 90 * 86400000).toISOString(); // TTL POI: 90 días

      for (const binding of parsedRoot.data.results.bindings) {
        const itemUri = binding.item.value;
        const qid = itemUri.split('/').pop() || itemUri;
        const title = binding.itemLabel.value.trim();
        const rawDesc = binding.description?.value?.trim();
        const summary = (rawDesc && rawDesc.length >= 10
          ? rawDesc
          : `${title} - Lloc d'interès i monument a Barcelona.`
        ).slice(0, 1200);

        let location: { name?: string; lat?: number; lng?: number } | undefined = undefined;

        if (binding.coord?.value) {
          // Formato WKT: Point(lng lat)
          const match = binding.coord.value.match(/Point\(\s*([0-9.-]+)\s+([0-9.-]+)\s*\)/i);
          if (match) {
            const lng = parseFloat(match[1]);
            const lat = parseFloat(match[2]);

            if (lat >= 41.2 && lat <= 41.5 && lng >= 2.0 && lng <= 2.3) {
              location = {
                name: title,
                lat,
                lng,
              };
            }
          }
        }

        if (!location) {
          location = { name: title };
        }

        const tags = ['monument', 'patrimoni', 'poi'];

        const contentHash = calculateContextContentHash({
          title,
          summary,
          location,
          url: itemUri,
        });

        const candidate = {
          id: `wikidata:${qid}`,
          sourceTag: source.sourceTag,
          category: 'POI' as const,
          title,
          summary,
          location,
          url: itemUri,
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
        'Error inesperado en adaptador SPARQL'
      );
    }
  }
}
