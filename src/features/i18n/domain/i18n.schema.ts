import { z } from 'zod';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './supported-language.vo';

/**
 * Esquema Zod canónico para el enum de idiomas soportados.
 */
export const SupportedLanguageSchema = z.enum(SUPPORTED_LANGUAGES).default(DEFAULT_LANGUAGE);

/**
 * Esquema de respuesta estructurada para traducción de templates por LLM.
 */
export const LocalizedItemTranslationSchema = z.object({
  itemId: z.string(),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
});

export type LocalizedItemTranslation = z.infer<typeof LocalizedItemTranslationSchema>;

export const LocalizedTemplateTranslationSchema = z.object({
  templateId: z.string(),
  language: SupportedLanguageSchema,
  title: z.string().min(1).max(255),
  abstract: z.string().min(1),
  items: z.array(LocalizedItemTranslationSchema),
});

export type LocalizedTemplateTranslation = z.infer<typeof LocalizedTemplateTranslationSchema>;
