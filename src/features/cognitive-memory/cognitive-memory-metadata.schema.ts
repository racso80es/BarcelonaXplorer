import { z } from 'zod';
import { SupportedLanguageSchema } from '@/features/i18n';
import { DefaultDensityPayload } from '@/features/planner';

/**
 * Matriz declarativa de durabilidad para variables de memoria cognitiva (PBI-MEM-002 CA-1).
 * time_window es estrictamente efímera; las preferencias de perfil son duraderas entre sesiones.
 */
export const MEMORY_VARIABLE_DURABILITY: Record<
  keyof DefaultDensityPayload,
  'durable' | 'ephemeral'
> = {
  time_window: 'ephemeral',
  group_size: 'durable',
  vibe: 'durable',
  constraints: 'durable',
  districts: 'durable',
  mood: 'durable',
  language: 'durable',
};

/**
 * Esquema Zod para la frontera determinista de metadatos de LanceDB (PBI-MEM-002 CA-4).
 * Valida y normaliza cadenas serializadas JSON u objetos planos garantizando tipado estricto.
 */
export const CognitiveMemoryMetadataSchema = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  },
  z.object({
    sessionId: z.string().min(1),
    matrixId: z.string().min(1).default('default'),
    timeWindow: z.string().nullable().optional(),
    groupSize: z.number().int().positive().nullable().optional(),
    vibe: z.string().nullable().optional(),
    mood: z.enum(['relaxed', 'adventurous', 'cultural', 'gastronomic']).nullable().optional(),
    language: SupportedLanguageSchema.nullable().optional(),
    constraints: z.array(z.string()).default([]),
    districts: z.array(z.string()).default([]),
    score: z.number().min(0).max(100).default(0),
    survivalThreshold: z.number().min(0).max(100).default(60),
    updatedAt: z.union([z.string(), z.date()]).optional(),
    denseString: z.string().optional(),
  }),
);

export type CognitiveMemoryMetadata = z.infer<typeof CognitiveMemoryMetadataSchema>;
