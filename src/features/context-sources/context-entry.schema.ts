import { createHash } from 'node:crypto';
import { z } from 'zod';

export const ContextEntryCategorySchema = z.enum(['EVENT', 'VENUE', 'POI', 'NEWS']);
export type ContextEntryCategory = z.infer<typeof ContextEntryCategorySchema>;

export const ContextEntryLocationSchema = z.object({
  name: z.string().optional(),
  lat: z.number().min(41.2).max(41.5).optional(), // Caja geográfica Barcelona (HU-1, HU-18 §4.1)
  lng: z.number().min(2.0).max(2.3).optional(),
});
export type ContextEntryLocation = z.infer<typeof ContextEntryLocationSchema>;

export const ContextEntrySchema = z.object({
  id: z.string().min(1), // `${sourceTag}:${externalId | hash}`
  sourceTag: z.string().min(1),
  category: ContextEntryCategorySchema,
  title: z.string().min(3).max(200),
  summary: z.string().min(10).max(1200), // Texto que se vectoriza
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  location: ContextEntryLocationSchema.optional(),
  url: z.string().url().optional(),
  price: z.string().max(64).optional(),
  tags: z.array(z.string()).max(12).default([]),
  expiresAt: z.string().datetime(), // endsAt + 1 día, o TTL por categoría (VENUE/POI: 90 días)
  contentHash: z.string().length(64), // SHA-256 del payload normalizado (deduplicación)
});

export type ContextEntry = z.infer<typeof ContextEntrySchema>;

/**
 * Calcula el hash determinista SHA-256 de una entrada para deduplicación térmica.
 */
export function calculateContextContentHash(payload: {
  title: string;
  summary: string;
  startsAt?: string;
  endsAt?: string;
  location?: { name?: string; lat?: number; lng?: number };
  url?: string;
  price?: string;
}): string {
  const normalized = JSON.stringify({
    title: payload.title.trim(),
    summary: payload.summary.trim(),
    startsAt: payload.startsAt ?? null,
    endsAt: payload.endsAt ?? null,
    location: payload.location
      ? {
          name: payload.location.name ?? null,
          lat: payload.location.lat ?? null,
          lng: payload.location.lng ?? null,
        }
      : null,
    url: payload.url ?? null,
    price: payload.price ?? null,
  });

  return createHash('sha256').update(normalized).digest('hex');
}
