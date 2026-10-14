import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

/**
 * Oráculo de Gobernanza Kaizen — PBI-GW-019 (CA-7 / Sección 3)
 *
 * Impide que el código bajo `src/app` vuelva a leer `GROQ_API_KEY`
 * o a construir los adaptadores Groq directos (GroqFastAiAdapter o
 * GroqConversationalSlmAdapter).
 */
describe('No Groq in src/app Contract (PBI-GW-019 CA-7)', () => {
  const appDir = path.resolve(__dirname, '../../app');
  const forbiddenPatterns = [
    'GROQ_API_KEY',
    'GroqFastAiAdapter',
    'GroqConversationalSlmAdapter',
  ];

  function collectFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...collectFiles(fullPath));
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  it('ningún archivo bajo src/app debe contener GROQ_API_KEY, GroqFastAiAdapter o GroqConversationalSlmAdapter', () => {
    const files = collectFiles(appDir);
    expect(files.length).toBeGreaterThan(0);

    const violations: Array<{ file: string; pattern: string; line: number }> = [];

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((lineText, idx) => {
        // GroqTelemetryCard.test.tsx prueba explícitamente los contratos de ausencia de clave
        if (filePath.endsWith('GroqTelemetryCard.test.tsx')) {
          return;
        }

        // CA-3: Se permite el mensaje canónico que notifica la ausencia de clave en el gateway
        if (lineText.includes('GROQ_API_KEY no configurada en el gateway')) {
          return;
        }

        for (const pattern of forbiddenPatterns) {
          if (lineText.includes(pattern)) {
            violations.push({
              file: path.relative(appDir, filePath),
              pattern,
              line: idx + 1,
            });
          }
        }
      });
    }

    expect(
      violations,
      `Se detectaron ${violations.length} violaciones de confinamiento en src/app:\n` +
        violations.map((v) => ` - ${v.file}:${v.line} contiene "${v.pattern}"`).join('\n')
    ).toEqual([]);
  });
});
