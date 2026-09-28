import { z } from 'zod';

const KEBAB_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TECH_VERSION = /^\d+(?:\.\d+(?:\.\d+)?)?$/;

const libraryCodexUuidSchema = z
  .uuid()
  .refine((value) => value.charAt(14) === '4', {
    message: 'uuid must be version 4 (nibble at index 14)',
  });

const targetTechnologySchema = z.object({
  name: z.string().min(1),
  version: z.string().regex(TECH_VERSION, 'technology version must be numeric SemVer fragment'),
  package: z.string().min(1),
});

export const libraryCodexFrontmatterSchema = z.object({
  uuid: libraryCodexUuidSchema,
  slug: z.string().regex(KEBAB_SLUG, 'slug must be kebab-case'),
  version: z.string().regex(SEMVER, 'version must be SemVer X.Y.Z'),
  type: z.literal('Library_Codex'),
  status: z.enum(['draft', 'active', 'deprecated']),
  updated_at: z.string().regex(ISO_DATE, 'updated_at must be YYYY-MM-DD'),
  source_of_truth: z.literal('src/package.json'),
  target_technologies: z.array(targetTechnologySchema).min(1),
});

export type LibraryCodexFrontmatter = z.infer<typeof libraryCodexFrontmatterSchema>;

export function parseLibraryCodexFrontmatter(input: unknown): LibraryCodexFrontmatter {
  return libraryCodexFrontmatterSchema.parse(input);
}

export function extractFrontmatterYaml(markdown: string): { yamlText: string; body: string } {
  const normalized = markdown.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    throw new Error('codex must start with frontmatter delimiter ---');
  }
  const closingIndex = normalized.indexOf('\n---\n', 4);
  if (closingIndex === -1) {
    throw new Error('codex frontmatter must close with ---');
  }
  const yamlText = normalized.slice(4, closingIndex);
  const body = normalized.slice(closingIndex + 5);
  return { yamlText, body };
}
