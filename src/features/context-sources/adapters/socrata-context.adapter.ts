import { createErrorEnvelope, createSuccessEnvelope, OperationEnvelope } from '@/shared/operation-envelope';
import { calculateContextContentHash, ContextEntry, ContextEntrySchema } from '../context-entry.schema';
import { IContextSourceAdapter } from '../context-source-adapter.port';
import { ContextSourceSnapshot, ContextSourceType } from '../context-source.types';

export class SocrataContextAdapter implements IContextSourceAdapter {
  readonly type: ContextSourceType = 'SOCRATA';

  constructor(private readonly fetchFn: typeof fetch = fetch) {}

  async fetch(source: ContextSourceSnapshot): Promise<OperationEnvelope<ContextEntry[]>> {
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };

      if (process.env.SOCRATA_APP_TOKEN) {
        headers['X-App-Token'] = process.env.SOCRATA_APP_TOKEN;
      }

      const response = await this.fetchFn(source.endpoint, {
        headers,
      });

      if (!response.ok) {
        return createErrorEnvelope(
          [`Error HTTP ${response.status} al consultar endpoint Socrata: ${source.endpoint}`],
          response.status >= 400 && response.status < 600 ? response.status : 500,
          'Fallo en la llamada HTTP al origen Socrata'
        );
      }

      const rawJson = (await response.json()) as unknown;
      if (!Array.isArray(rawJson)) {
        return createErrorEnvelope(
          ['El payload retornado por Socrata no es un array'],
          422,
          'Payload estructural inválido'
        );
      }

      const validEntries: ContextEntry[] = [];
      const now = new Date();

      for (const item of rawJson) {
        if (!item || typeof item !== 'object') continue;
        const row = item as Record<string, unknown>;

        // Discriminación entre dataset Agenda Cultural y Equipaments Culturals
        if ('codi' in row && ('denominaci' in row || 'denominacio' in row)) {
          // Dataset: Agenda Cultural
          const codi = String(row.codi ?? '');
          const title = String(row.denominaci ?? row.denominacio ?? '').trim();
          const desc = String(row.descripcio ?? row.subt_tol ?? title).trim();
          const summary = (desc.length < 10 ? `${title} - Activitat cultural a Barcelona.` : desc).slice(0, 1200);

          const startsAt = typeof row.data_inici === 'string' && row.data_inici.trim().length > 0
            ? new Date(row.data_inici).toISOString()
            : undefined;
          const endsAt = typeof row.data_fi === 'string' && row.data_fi.trim().length > 0
            ? new Date(row.data_fi).toISOString()
            : startsAt;

          const lat = typeof row.latitud === 'string' ? parseFloat(row.latitud) : typeof row.latitud === 'number' ? row.latitud : undefined;
          const lng = typeof row.longitud === 'string' ? parseFloat(row.longitud) : typeof row.longitud === 'number' ? row.longitud : undefined;

          let location: { name?: string; lat?: number; lng?: number } | undefined = undefined;
          if (typeof lat === 'number' && typeof lng === 'number' && lat >= 41.2 && lat <= 41.5 && lng >= 2.0 && lng <= 2.3) {
            location = {
              name: typeof row.espai === 'string' ? row.espai.trim() : 'Barcelona',
              lat,
              lng,
            };
          } else if (typeof row.espai === 'string') {
            location = { name: row.espai.trim() };
          }

          const rawTags = typeof row.tags_categor_es === 'string' ? row.tags_categor_es.split(',') : [];
          const tags = rawTags.map((t) => t.replace(/^agenda:categories\//, '').trim()).filter(Boolean).slice(0, 12);

          const priceStr = row.gratuita === 'Sí' || row.gratuita === 'Si'
            ? 'Gratis'
            : typeof row.entrades === 'string' ? row.entrades.trim().slice(0, 64) : undefined;

          const url = typeof row.url === 'string' && row.url.startsWith('http')
            ? row.url
            : typeof row.linkbotoentrades === 'string' && row.linkbotoentrades.startsWith('http')
              ? row.linkbotoentrades
              : undefined;

          const expiresDate = endsAt ? new Date(endsAt) : new Date(now.getTime() + 7 * 86400000);
          expiresDate.setDate(expiresDate.getDate() + 1);
          const expiresAt = expiresDate.toISOString();

          const contentHash = calculateContextContentHash({
            title,
            summary,
            startsAt,
            endsAt,
            location,
            url,
            price: priceStr,
          });

          const candidate = {
            id: `gencat-agenda:${codi}`,
            sourceTag: source.sourceTag,
            category: 'EVENT' as const,
            title,
            summary,
            startsAt,
            endsAt,
            location,
            url,
            price: priceStr,
            tags,
            expiresAt,
            contentHash,
          };

          const parse = ContextEntrySchema.safeParse(candidate);
          if (parse.success) {
            validEntries.push(parse.data);
          }
        } else if ('id_gt' in row && 'nom' in row) {
          // Dataset: Equipaments Culturals
          const idGt = String(row.id_gt ?? '');
          const title = String(row.nom ?? '').trim();
          const tipus = String(row.tipus ?? 'Equipament');
          const subtipus = String(row.subtipus ?? '');
          const adreca = typeof row.adre_a === 'string' ? row.adre_a.trim() : '';
          const summary = `${tipus}${subtipus ? ` - ${subtipus}` : ''}${adreca ? `. ${adreca}` : ''}`.slice(0, 1200);

          const lat = typeof row.latitud === 'string' ? parseFloat(row.latitud) : typeof row.latitud === 'number' ? row.latitud : undefined;
          const lng = typeof row.longitud === 'string' ? parseFloat(row.longitud) : typeof row.longitud === 'number' ? row.longitud : undefined;

          let location: { name?: string; lat?: number; lng?: number } | undefined = undefined;
          if (typeof lat === 'number' && typeof lng === 'number' && lat >= 41.2 && lat <= 41.5 && lng >= 2.0 && lng <= 2.3) {
            location = {
              name: title,
              lat,
              lng,
            };
          } else {
            location = { name: title };
          }

          const tags = [tipus, subtipus].map((t) => t.trim()).filter(Boolean).slice(0, 12);
          const expiresDate = new Date(now.getTime() + 90 * 86400000); // TTL VENUE: 90 días
          const expiresAt = expiresDate.toISOString();

          const url = typeof row.adre_a_web === 'string' && row.adre_a_web.startsWith('http')
            ? row.adre_a_web
            : undefined;

          const contentHash = calculateContextContentHash({
            title,
            summary,
            location,
            url,
          });

          const candidate = {
            id: `gencat-equip:${idGt}`,
            sourceTag: source.sourceTag,
            category: 'VENUE' as const,
            title,
            summary,
            location,
            url,
            tags,
            expiresAt,
            contentHash,
          };

          const parse = ContextEntrySchema.safeParse(candidate);
          if (parse.success) {
            validEntries.push(parse.data);
          }
        }
      }

      return createSuccessEnvelope(validEntries);
    } catch (err) {
      return createErrorEnvelope(
        [err instanceof Error ? err.message : String(err)],
        500,
        'Error inesperado en adaptador Socrata'
      );
    }
  }
}
