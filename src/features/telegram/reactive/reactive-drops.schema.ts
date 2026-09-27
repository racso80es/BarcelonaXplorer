// ═══════════════════════════════════════════════════════════════
// Vertical Slice: Telegram / Reactive
// Esquemas Zod Deterministas para Drops de Alivio Táctico (EDA)
// Marco Constitucional: Protocolo de Acero — Grado S+
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';

export const GeoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type GeoPoint = z.infer<typeof GeoPointSchema>;

export const MobilityProviderEnum = z.enum(['CABIFY', 'FREENOW', 'UBER']);
export type MobilityProvider = z.infer<typeof MobilityProviderEnum>;

export const FatigueReliefDropPayloadSchema = z.object({
  accumulatedKm: z.number().nonnegative(),
  targetWaypointTitle: z.string().min(1),
  mobilityProvider: MobilityProviderEnum,
  cpaUrl: z.string().url(),
  discountText: z.string(),
  messageText: z.string().min(1),
});
export type FatigueReliefDropPayload = z.infer<typeof FatigueReliefDropPayloadSchema>;

export const WeatherShelterDropPayloadSchema = z.object({
  currentWeatherSummary: z.string().min(1),
  estimatedRainMinutes: z.number().int().positive().default(15),
  shelterName: z.string().min(1),
  shelterDescription: z.string().min(1),
  shelterCoordinates: GeoPointSchema,
  cpaUrl: z.string().url(),
  messageText: z.string().min(1),
});
export type WeatherShelterDropPayload = z.infer<typeof WeatherShelterDropPayloadSchema>;

export const ReactiveDropTypeEnum = z.enum(['FATIGUE_RELIEF', 'WEATHER_SHELTER']);
export type ReactiveDropType = z.infer<typeof ReactiveDropTypeEnum>;

export const ReactiveDropEventSchema = z.object({
  type: ReactiveDropTypeEnum,
  sessionId: z.string().min(1),
  telegramChatId: z.string().min(1),
  timestamp: z.number().int().positive(),
  fatiguePayload: FatigueReliefDropPayloadSchema.optional(),
  weatherPayload: WeatherShelterDropPayloadSchema.optional(),
});
export type ReactiveDropEvent = z.infer<typeof ReactiveDropEventSchema>;

export interface ReactiveDropResult {
  dispatched: boolean;
  dropType: ReactiveDropType | 'NONE';
  reason?: string;
  telegramChatId?: string;
  messagePreview?: string;
}
