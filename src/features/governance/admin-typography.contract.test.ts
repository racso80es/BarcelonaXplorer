import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

export interface TypographyViolation {
  readonly file: string;
  readonly line: number;
  readonly match: string;
  readonly content: string;
}

const FORBIDDEN_PATTERN = /text-\[\d+px\]/g;

export function findViolationsInContent(filePath: string, content: string): readonly TypographyViolation[] {
  const violations: TypographyViolation[] = [];
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const matches = line.match(FORBIDDEN_PATTERN);
    if (matches) {
      for (const match of matches) {
        violations.push({
          file: filePath,
          line: i + 1,
          match,
          content: line.trim(),
        });
      }
    }
  }

  return violations;
}

export function scanForArbitraryPixelTypography(dir: string): readonly TypographyViolation[] {
  const violations: TypographyViolation[] = [];

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === '__tests__' || entry.name === 'node_modules') {
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile()) {
        if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) {
          continue;
        }
        if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          const fileContent = fs.readFileSync(fullPath, 'utf-8');
          violations.push(...findViolationsInContent(fullPath, fileContent));
        }
      }
    }
  }

  if (fs.existsSync(dir)) {
    walk(dir);
  }

  return violations;
}

function formatViolations(violations: readonly TypographyViolation[]): string {
  if (violations.length === 0) return '';
  return violations
    .map((v) => `\n  - [${v.match}] en ${v.file}:${v.line} -> "${v.content}"`)
    .join('');
}

describe('Admin Typography Floor & Arbitrary Pixels Contract (PBI-ADMIN-UI-008)', () => {
  const adminDir = path.resolve(__dirname, '../../app/Admin');
  const dataTableDir = path.resolve(__dirname, '../../components/ui/data-table');

  it('no debe contener clases arbitrarias text-[Npx] en src/app/Admin/', () => {
    const violations = scanForArbitraryPixelTypography(adminDir);
    expect(violations, `Violaciones detectadas en Admin:${formatViolations(violations)}`).toEqual([]);
  });

  it('no debe contener clases arbitrarias text-[Npx] en src/components/ui/data-table/', () => {
    const violations = scanForArbitraryPixelTypography(dataTableDir);
    expect(violations, `Violaciones detectadas en data-table:${formatViolations(violations)}`).toEqual([]);
  });

  it('debe detectar y reportar violaciones simuladas con text-[11px] o text-[15px]', () => {
    const fixtureSnippet = `
      export function DummyComponent() {
        return (
          <div className="flex gap-2">
            <span className="text-[11px] font-mono">Micro badge</span>
            <span className="text-[15px] font-mono">Arbitrary 15px</span>
          </div>
        );
      }
    `;

    const violations = findViolationsInContent('src/app/Admin/DummyFixture.tsx', fixtureSnippet);
    expect(violations.length).toBe(2);
    expect(violations[0]?.match).toBe('text-[11px]');
    expect(violations[0]?.line).toBe(5);
    expect(violations[1]?.match).toBe('text-[15px]');
    expect(violations[1]?.line).toBe(6);
  });
});
