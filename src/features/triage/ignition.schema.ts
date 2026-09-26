import { z } from 'zod';

export const DeviceTypeEnum = z.enum(['MOBILE', 'DESKTOP', 'TABLET']);
export type DeviceType = z.infer<typeof DeviceTypeEnum>;

export const TimeWindowPeriodEnum = z.enum([
  'DAWN', // 00:00 - 05:59 (Planificación nocturna / Madrugada)
  'MORNING', // 06:00 - 12:59 (Exploración matinal)
  'AFTERNOON', // 13:00 - 19:59 (Tarde / Sobremesa)
  'NIGHT', // 20:00 - 23:59 (Ocio nocturno / Cenas)
]);
export type TimeWindowPeriod = z.infer<typeof TimeWindowPeriodEnum>;

export const IgnitionSensoryContextSchema = z.object({
  sessionId: z.string().uuid(),
  device: DeviceTypeEnum,
  language: z.string().min(2).max(10).default('es'),
  clientTimestamp: z.number().int().positive(),
  serverTimestamp: z.number().int().positive(),
  detectedHour: z.number().int().min(0).max(23),
  period: TimeWindowPeriodEnum,
  weatherSummary: z.string().optional(),
  temperatureCelsius: z.number().optional(),
  priorMemoryExcerpt: z.string().optional(),
});

export type IgnitionSensoryContextDto = z.infer<typeof IgnitionSensoryContextSchema>;

export const IgnitionSparkSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['weather', 'logistics', 'system']),
  insight: z.string().min(1),
  urgency: z.enum(['low', 'medium', 'high']).default('medium'),
});

export type IgnitionSpark = z.infer<typeof IgnitionSparkSchema>;

export const IgnitionOutcomeSchema = z.object({
  greeting: z.string().min(1),
  isFallback: z.boolean(),
  period: TimeWindowPeriodEnum,
  device: DeviceTypeEnum,
  sparks: z.array(IgnitionSparkSchema),
  contextSummary: z.string(),
});

export type IgnitionOutcome = z.infer<typeof IgnitionOutcomeSchema>;

/**
 * Clasifica la franja horaria de forma puramente declarativa según la hora detectada (0-23).
 */
export function classifyTimeWindow(hour: number): TimeWindowPeriod {
  if (hour >= 6 && hour < 13) return 'MORNING';
  if (hour >= 13 && hour < 20) return 'AFTERNOON';
  if (hour >= 20 && hour <= 23) return 'NIGHT';
  return 'DAWN';
}

/**
 * Detecta el tipo de dispositivo de forma heurística a partir del User-Agent.
 */
export function detectDeviceType(userAgent: string | null | undefined): DeviceType {
  if (!userAgent) return 'DESKTOP';
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return 'TABLET';
  if (/mobi|iphone|ipod|android/i.test(ua)) return 'MOBILE';
  return 'DESKTOP';
}
