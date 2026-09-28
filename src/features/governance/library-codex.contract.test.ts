import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import packageJson from '../../package.json';
import {
  extractFrontmatterYaml,
  parseLibraryCodexFrontmatter,
} from './library-codex.schema';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../../..');
const codexPath = path.join(
  repoRoot,
  '.SddIA/library/codexes/tech-master-nextjs-prisma.md',
);

const REQUIRED_TC_IDS = [
  'TC-NEXT-001',
  'TC-NEXT-002',
  'TC-NEXT-003',
  'TC-NEXT-004',
  'TC-NEXT-005',
  'TC-PRISMA-001',
  'TC-TS-001',
  'TC-ZOD-001',
  'TC-UI-001',
  'TC-AI-001',
  'TC-TEST-001',
] as const;

function majorOf(version: string): number {
  const cleaned = version.replace(/^\^/, '').trim();
  const match = /^(\d+)/.exec(cleaned);
  if (!match) {
    throw new Error(`invalid version: ${version}`);
  }
  return Number.parseInt(match[1], 10);
}

function readPackageVersion(packageName: string): string {
  const deps: Record<string, string> = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  const resolved = deps[packageName];
  if (!resolved) {
    throw new Error(`package not found in src/package.json: ${packageName}`);
  }
  return resolved;
}

describe('Library_Codex contract (tech-master-nextjs-prisma)', () => {
  const markdown = readFileSync(codexPath, 'utf8');
  const { yamlText, body } = extractFrontmatterYaml(markdown);
  const rawFrontmatter: unknown = parse(yamlText);

  it('parses frontmatter with Zod (Escenario 1)', () => {
    const frontmatter = parseLibraryCodexFrontmatter(rawFrontmatter);
    expect(frontmatter.type).toBe('Library_Codex');
    expect(frontmatter.slug).toBe('tech-master-nextjs-prisma');
  });

  it('keeps major versions aligned with src/package.json (Escenario 2)', () => {
    const frontmatter = parseLibraryCodexFrontmatter(rawFrontmatter);
    for (const tech of frontmatter.target_technologies) {
      const installed = readPackageVersion(tech.package);
      expect(majorOf(tech.version)).toBe(majorOf(installed));
    }
  });

  it('declares all TC-* fundamentals in the body', () => {
    for (const id of REQUIRED_TC_IDS) {
      expect(body).toContain(id);
    }
  });
});
