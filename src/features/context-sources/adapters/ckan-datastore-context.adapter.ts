import { z } from 'zod';
import { createErrorEnvelope, createSuccessEnvelope, OperationEnvelope } from '@/shared/operation-envelope';
import { calculateContextContentHash, ContextEntry, ContextEntryCategory, ContextEntryCategorySchema, ContextEntrySchema } from '../context-entry.schema';
import { IContextSourceAdapter } from '../context-source-adapter.port';
import {
  CkanDatastoreExtractionConfig,
  CkanDatastoreExtractionConfigSchema,
  ContextSourceSnapshot,
  ContextSourceType,
} from '../context-source.types';

const CkanPackageShowResponseSchema = z.object({
  success: z.boolean(),
  result: z.object({
    id: z.string().optional(),
    resources: z.array(
      z.object({
        id: z.string().min(1),
        format: z.string().optional(),
        datastore_active: z.boolean().optional(),
        name: z.string().optional(),
      })
    ),
  }),
});

const CkanDatastoreSearchResponseSchema = z.object({
  success: z.boolean(),
  result: z.object({
    resource_id: z.string(),
    total: z.number().int().nonnegative().optional(),
    records: z.array(z.record(z.string(), z.unknown())),
  }),
});

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeIsoDateTime(raw: unknown): string | undefined {
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
 * Adaptador bifásico para catalogos CKAN con datastore activo (PBI-CTX-016).
 * 
 * Fases de ejecución (Filtro C - Sin LLM):
 * 1. Resolve: package_show?id={dataset} -> selección determinista del recurso único.
 * 2. Extract: datastore_search con limit y offset paginando hasta maxRecords o total.
 * 3. Map: fieldMap declarativo -> ContextEntry validado y ordenado por startsAt asc.
 */
export class CkanDatastoreContextAdapter implements IContextSourceAdapter {
  readonly type: ContextSourceType = 'CKAN_DATASTORE';

  constructor(private readonly fetchFn: typeof fetch = fetch) {}

  async fetch(source: ContextSourceSnapshot): Promise<OperationEnvelope<ContextEntry[]>> {
    try {
      // 0. Validar configuración de extracción (Filtro C / CA-2)
      const configValidation = CkanDatastoreExtractionConfigSchema.safeParse(source.extractionConfig);
      if (!configValidation.success) {
        return createErrorEnvelope(
          ['Configuración de extracción CKAN_DATASTORE inválida o ausente en la fuente'],
          422,
          'Fallo de validación de extracción declarativa'
        );
      }
      const config: CkanDatastoreExtractionConfig = configValidation.data;

      // 1. Resolver endpoint base
      let baseUrl = source.endpoint;
      if (baseUrl.includes('/action/')) {
        baseUrl = baseUrl.split('/action/')[0] + '/action';
      } else if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }

      // 2. FASE 1: RESOLVE
      const packageShowUrl = `${baseUrl}/package_show?id=${encodeURIComponent(config.dataset)}`;
      const showResponse = await this.fetchFn(packageShowUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(config.timeoutMs),
      });

      if (!showResponse.ok) {
        return createErrorEnvelope(
          [`Fallo HTTP ${showResponse.status} al consultar package_show: ${packageShowUrl}`],
          showResponse.status >= 400 && showResponse.status < 600 ? showResponse.status : 500,
          'Error en resolución de dataset CKAN'
        );
      }

      const showJson = (await showResponse.json()) as unknown;
      const parsedShow = CkanPackageShowResponseSchema.safeParse(showJson);
      if (!parsedShow.success || !parsedShow.data.success) {
        return createErrorEnvelope(
          ['Respuesta de package_show no cumple el contrato CKAN canónico'],
          422,
          'Contrato CKAN inválido'
        );
      }

      const matchingResources = parsedShow.data.result.resources.filter((r) => {
        const matchesFormat = (r.format ?? '').toUpperCase() === config.resourceSelector.format.toUpperCase();
        const matchesDatastore = Boolean(r.datastore_active) === config.resourceSelector.datastoreActive;
        return matchesFormat && matchesDatastore;
      });

      if (matchingResources.length !== 1) {
        return createErrorEnvelope(
          [`Se encontraron ${matchingResources.length} recursos compatibles (se esperaba exactamente 1)`],
          422,
          'Ambigüedad o ausencia de recurso en dataset CKAN'
        );
      }

      const resourceId = matchingResources[0].id;

      // 3. FASE 2: EXTRACT
      let offset = 0;
      const limit = config.pageSize;
      const allRecords: Record<string, unknown>[] = [];

      while (allRecords.length < config.maxRecords) {
        const fetchLimit = Math.min(limit, config.maxRecords - allRecords.length);
        const searchUrl = `${baseUrl}/datastore_search?resource_id=${encodeURIComponent(resourceId)}&limit=${fetchLimit}&offset=${offset}`;

        const searchResponse = await this.fetchFn(searchUrl, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(config.timeoutMs),
        });

        if (!searchResponse.ok) {
          return createErrorEnvelope(
            [`Fallo HTTP ${searchResponse.status} en datastore_search: ${searchUrl}`],
            searchResponse.status >= 400 && searchResponse.status < 600 ? searchResponse.status : 500,
            'Error al extraer registros de datastore'
          );
        }

        const searchJson = (await searchResponse.json()) as unknown;
        const parsedSearch = CkanDatastoreSearchResponseSchema.safeParse(searchJson);
        if (!parsedSearch.success || !parsedSearch.data.success) {
          return createErrorEnvelope(
            ['Respuesta de datastore_search no cumple el esquema canónico'],
            422,
            'Contrato datastore inválido'
          );
        }

        const currentRecords = parsedSearch.data.result.records;
        allRecords.push(...currentRecords);

        const total = parsedSearch.data.result.total ?? allRecords.length;
        if (currentRecords.length < fetchLimit || allRecords.length >= total) {
          break;
        }

        offset += currentRecords.length;
      }

      // 4. FASE 3: MAP
      const rawCategory = source.category;
      const parsedCat = ContextEntryCategorySchema.safeParse(rawCategory);
      const category: ContextEntryCategory = parsedCat.success ? parsedCat.data : 'EVENT';

      const fieldMap = config.fieldMap;
      const rawEntries: ContextEntry[] = [];

      let recordsToMap = allRecords;
      if (config.groupBy) {
        const groupField = config.groupBy;
        const groupedMap = new Map<string, Record<string, unknown>>();
        for (const r of allRecords) {
          const key = String(r[groupField] ?? '').replace(/^\ufeff/, '').trim();
          if (key && !groupedMap.has(key)) {
            groupedMap.set(key, r);
          }
        }
        recordsToMap = Array.from(groupedMap.values());
      }

      for (const record of recordsToMap) {
        const rawExternalId = record[fieldMap.externalId];
        if (!rawExternalId) continue;
        const externalId = String(rawExternalId).replace(/^\ufeff/, '').trim();
        if (externalId.length === 0) continue;

        const id = `${source.sourceTag}:${externalId}`;

        const rawTitle = record[fieldMap.title];
        const title = String(rawTitle ?? '').trim();
        if (title.length < 3) continue;

        let summaryText = '';
        if (Array.isArray(fieldMap.summary)) {
          const summaryParts: string[] = [];
          for (const field of fieldMap.summary) {
            const val = record[field];
            if (val !== undefined && val !== null && String(val).trim().length > 0) {
              let strVal = String(val).trim();
              if (strVal.includes('<') && strVal.includes('>')) {
                strVal = stripHtml(strVal);
              }
              if (strVal.length > 0) {
                summaryParts.push(strVal);
              }
            }
          }
          summaryText = summaryParts.join(' - ');
        } else {
          let strVal = String(record[fieldMap.summary] ?? '').trim();
          if (strVal.includes('<') && strVal.includes('>')) {
            strVal = stripHtml(strVal);
          }
          summaryText = strVal;
        }

        if (summaryText.length < 10) {
          summaryText = `${title} - Activitat a Barcelona.`;
        }
        const summary = summaryText.slice(0, 1200);

        const rawStart = fieldMap.startsAt ? record[fieldMap.startsAt] : undefined;
        const rawEnd = fieldMap.endsAt ? record[fieldMap.endsAt] : undefined;

        const startsAt = normalizeIsoDateTime(rawStart);
        let endsAt = normalizeIsoDateTime(rawEnd);

        if (!startsAt && !endsAt) {
          continue;
        }

        if (startsAt && !endsAt) {
          endsAt = startsAt;
        }

        const baseExpiry = endsAt ? new Date(endsAt) : startsAt ? new Date(startsAt) : new Date();
        const expiresDate = new Date(baseExpiry.getTime() + 86400000);
        const expiresAt = expiresDate.toISOString();

        let locationName = fieldMap.locationName ? String(record[fieldMap.locationName] ?? '').trim() : undefined;
        if (locationName && locationName.length === 0) locationName = undefined;

        let lat: number | undefined = undefined;
        let lng: number | undefined = undefined;

        if (fieldMap.lat && record[fieldMap.lat] !== undefined && record[fieldMap.lat] !== null) {
          const parsedLat = parseFloat(String(record[fieldMap.lat]));
          if (!isNaN(parsedLat)) lat = parsedLat;
        }
        if (fieldMap.lng && record[fieldMap.lng] !== undefined && record[fieldMap.lng] !== null) {
          const parsedLng = parseFloat(String(record[fieldMap.lng]));
          if (!isNaN(parsedLng)) lng = parsedLng;
        }

        let location: { name?: string; lat?: number; lng?: number } | undefined = undefined;
        const validCoords =
          typeof lat === 'number' &&
          typeof lng === 'number' &&
          lat >= 41.2 &&
          lat <= 41.5 &&
          lng >= 2.0 &&
          lng <= 2.3;

        if (validCoords) {
          location = {
            name: locationName ?? 'Barcelona',
            lat,
            lng,
          };
        } else if (locationName) {
          location = { name: locationName };
        }

        const tags: string[] = [];
        if (fieldMap.tags) {
          const tagFields = Array.isArray(fieldMap.tags) ? fieldMap.tags : [fieldMap.tags];
          for (const tf of tagFields) {
            const val = record[tf];
            if (typeof val === 'string' && val.trim().length > 0) {
              tags.push(val.trim());
            }
          }
        }

        const urlStr = fieldMap.url ? String(record[fieldMap.url] ?? '').trim() : undefined;
        const url = urlStr && (urlStr.startsWith('http://') || urlStr.startsWith('https://')) ? urlStr : undefined;
        const price = fieldMap.price ? String(record[fieldMap.price] ?? '').trim() : undefined;

        const contentHash = calculateContextContentHash({
          title,
          summary,
          startsAt,
          endsAt,
          location,
          url,
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
          url,
          price,
          tags: tags.slice(0, 12),
          expiresAt,
          contentHash,
        };

        const parsedEntry = ContextEntrySchema.safeParse(candidate);
        if (parsedEntry.success) {
          rawEntries.push(parsedEntry.data);
        }
      }

      rawEntries.sort((a, b) => {
        const timeA = a.startsAt ? new Date(a.startsAt).getTime() : 0;
        const timeB = b.startsAt ? new Date(b.startsAt).getTime() : 0;
        return timeA - timeB;
      });

      return createSuccessEnvelope(rawEntries);
    } catch (err) {
      return createErrorEnvelope(
        [err instanceof Error ? err.message : String(err)],
        500,
        'Error inesperado en adaptador CKAN_DATASTORE'
      );
    }
  }
}
