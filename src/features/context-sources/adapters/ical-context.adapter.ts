import { createErrorEnvelope, createSuccessEnvelope, OperationEnvelope } from '@/shared/operation-envelope';
import { calculateContextContentHash, ContextEntry, ContextEntrySchema } from '../context-entry.schema';
import { IContextSourceAdapter } from '../context-source-adapter.port';
import { ContextSourceSnapshot, ContextSourceType } from '../context-source.types';

function parseIcalDate(raw: string): string | undefined {
  const cleaned = raw.replace(/^VALUE=DATE:/, '').trim();
  // Formato YYYYMMDD
  if (/^\d{8}$/.test(cleaned)) {
    const y = cleaned.slice(0, 4);
    const m = cleaned.slice(4, 6);
    const d = cleaned.slice(6, 8);
    return new Date(`${y}-${m}-${d}T00:00:00.000Z`).toISOString();
  }
  // Formato YYYYMMDDTHHMMSSZ
  if (/^\d{8}T\d{6}Z?$/.test(cleaned)) {
    const y = cleaned.slice(0, 4);
    const m = cleaned.slice(4, 6);
    const d = cleaned.slice(6, 8);
    const hh = cleaned.slice(9, 11);
    const mm = cleaned.slice(11, 13);
    const ss = cleaned.slice(13, 15);
    return new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}.000Z`).toISOString();
  }
  return undefined;
}

export class IcalContextAdapter implements IContextSourceAdapter {
  readonly type: ContextSourceType = 'ICAL';

  constructor(private readonly fetchFn: typeof fetch = fetch) {}

  async fetch(source: ContextSourceSnapshot): Promise<OperationEnvelope<ContextEntry[]>> {
    try {
      const response = await this.fetchFn(source.endpoint, {
        headers: {
          Accept: 'text/calendar, application/ics',
        },
      });

      if (!response.ok) {
        return createErrorEnvelope(
          [`Error HTTP ${response.status} al consultar calendario iCal: ${source.endpoint}`],
          response.status >= 400 && response.status < 600 ? response.status : 500,
          'Fallo en la llamada HTTP al origen iCal'
        );
      }

      const rawIcs = await response.text();
      if (!rawIcs.includes('BEGIN:VCALENDAR')) {
        return createErrorEnvelope(
          ['El contenido retornado no es un fichero iCalendar (RFC 5545) válido'],
          422,
          'Formato iCal inválido'
        );
      }

      // Desplegar líneas dobladas (line unfolding RFC 5545)
      const unfolded = rawIcs.replace(/\r?\n[ \t]/g, '');
      const eventBlocks = unfolded.split('BEGIN:VEVENT').slice(1);

      const validEntries: ContextEntry[] = [];

      for (const block of eventBlocks) {
        const cleanBlock = block.split('END:VEVENT')[0];
        const lines = cleanBlock.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

        const getProp = (propName: string): string => {
          for (const line of lines) {
            if (line.startsWith(`${propName}:`)) {
              return line.slice(propName.length + 1).trim();
            }
            if (line.startsWith(`${propName};`)) {
              const colonIdx = line.indexOf(':');
              if (colonIdx !== -1) {
                return line.slice(colonIdx + 1).trim();
              }
            }
          }
          return '';
        };

        const uid = getProp('UID') || `event-${validEntries.length + 1}`;
        const summary = getProp('SUMMARY');
        const description = getProp('DESCRIPTION');
        const dtstartRaw = getProp('DTSTART');
        const dtendRaw = getProp('DTEND');

        if (!summary) continue;

        const title = summary.trim();
        const descText = description ? `${title}. ${description}` : `${title} - Festiu oficial i esdeveniment a Barcelona.`;
        const summaryText = descText.slice(0, 1200);

        const startsAt = parseIcalDate(dtstartRaw);
        const endsAt = parseIcalDate(dtendRaw) ?? startsAt;

        const location = { name: 'Barcelona' };
        const price = 'Gratis';
        const tags = ['festiu', 'oficial', 'barcelona'];

        const expiresDate = endsAt ? new Date(endsAt) : new Date();
        expiresDate.setDate(expiresDate.getDate() + 1);
        const expiresAt = expiresDate.toISOString();

        const contentHash = calculateContextContentHash({
          title,
          summary: summaryText,
          startsAt,
          endsAt,
          location,
          price,
        });

        const candidate = {
          id: `bcn-festes:${uid.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60)}`,
          sourceTag: source.sourceTag,
          category: 'EVENT' as const,
          title,
          summary: summaryText,
          startsAt,
          endsAt,
          location,
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
        'Error inesperado en adaptador iCal'
      );
    }
  }
}
