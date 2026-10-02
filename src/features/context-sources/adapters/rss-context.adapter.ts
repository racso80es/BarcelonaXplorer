import { createErrorEnvelope, createSuccessEnvelope, OperationEnvelope } from '@/shared/operation-envelope';
import { calculateContextContentHash, ContextEntry, ContextEntrySchema } from '../context-entry.schema';
import { IContextSourceAdapter } from '../context-source-adapter.port';
import { ContextSourceSnapshot, ContextSourceType } from '../context-source.types';

export class RssContextAdapter implements IContextSourceAdapter {
  readonly type: ContextSourceType = 'RSS';

  constructor(private readonly fetchFn: typeof fetch = fetch) {}

  async fetch(source: ContextSourceSnapshot): Promise<OperationEnvelope<ContextEntry[]>> {
    try {
      const response = await this.fetchFn(source.endpoint, {
        headers: {
          Accept: 'application/rss+xml, application/xml, text/xml',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return createErrorEnvelope(
          [`Error HTTP ${response.status} al consultar feed RSS: ${source.endpoint}`],
          response.status >= 400 && response.status < 600 ? response.status : 500,
          'Fallo en la llamada HTTP al origen RSS'
        );
      }

      const rawXml = await response.text();
      if (!rawXml.includes('<rss') && !rawXml.includes('<channel')) {
        return createErrorEnvelope(
          ['El contenido retornado no es un feed RSS válido'],
          422,
          'Formato XML RSS inválido'
        );
      }

      const validEntries: ContextEntry[] = [];
      const itemBlocks = rawXml.split(/<item[\s>]/i).slice(1);

      const extractTag = (xml: string, tag: string): string => {
        const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
        const cdataMatch = xml.match(cdataRegex);
        if (cdataMatch) return cdataMatch[1].trim();

        const normalRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
        const normalMatch = xml.match(normalRegex);
        return normalMatch ? normalMatch[1].trim() : '';
      };

      const extractAllCategories = (xml: string): string[] => {
        const catRegex = /<category[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/gi;
        const categories: string[] = [];
        let catMatch: RegExpExecArray | null;
        while ((catMatch = catRegex.exec(xml)) !== null) {
          const cat = catMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
          if (cat) categories.push(cat);
        }
        return categories;
      };

      const stripHtml = (html: string): string => {
        return html
          .replace(/<[^>]*>/g, ' ')
          .replace(/&[a-z0-9#]+;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      for (const block of itemBlocks) {
        const itemXml = block.split(/<\/item>/i)[0];
        const title = stripHtml(extractTag(itemXml, 'title'));
        const link = extractTag(itemXml, 'link');
        const guid = extractTag(itemXml, 'guid') || link;
        const rawDesc = extractTag(itemXml, 'description');
        const strippedDesc = stripHtml(rawDesc);
        const pubDateStr = extractTag(itemXml, 'pubDate');

        const summary = (strippedDesc.length >= 10
          ? strippedDesc
          : `${title} - Actualitat i notícies de Barcelona.`
        ).slice(0, 1200);

        const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();
        const startsAt = !isNaN(pubDate.getTime()) ? pubDate.toISOString() : new Date().toISOString();

        const expiresDate = new Date(pubDate.getTime() + 7 * 86400000); // 7 días TTL noticias
        const expiresAt = expiresDate.toISOString();

        const tags = extractAllCategories(itemXml).slice(0, 12);
        const location = { name: 'Barcelona' };

        const idSuffix = guid || link || title;
        const contentHash = calculateContextContentHash({
          title,
          summary,
          startsAt,
          location,
          url: link || undefined,
        });

        const candidate = {
          id: `beteve:${Buffer.from(idSuffix).toString('base64url').slice(0, 48)}`,
          sourceTag: source.sourceTag,
          category: 'NEWS' as const,
          title,
          summary,
          startsAt,
          location,
          url: link.startsWith('http') ? link : undefined,
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
        'Error inesperado en adaptador RSS'
      );
    }
  }
}
