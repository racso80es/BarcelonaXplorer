import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('Higiene de Credenciales de Base de Datos en Scripts (PBI-DEV-001 / CA-10)', () => {
  const scriptsDir = path.resolve(__dirname, '../../../scripts');

  it('debe existir el directorio scripts/ con scripts ejecutables', () => {
    expect(fs.existsSync(scriptsDir)).toBe(true);
    const files = fs.readdirSync(scriptsDir).filter((f) => f.endsWith('.sh'));
    expect(files.length).toBeGreaterThan(0);
  });

  it('ningún script en scripts/ debe exponer contraseñas en argv mediante flag -p inline ni pasar contraseñas por parámetro', () => {
    const shFiles = fs.readdirSync(scriptsDir).filter((f) => f.endsWith('.sh'));

    const violations: { file: string; line: number; content: string }[] = [];

    for (const fileName of shFiles) {
      const fullPath = path.join(scriptsDir, fileName);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((lineText, idx) => {
        const trimmed = lineText.trim();
        // Ignorar líneas de comentarios
        if (trimmed.startsWith('#')) return;

        // Detectar mysql ... -p seguido de cualquier caracter que no sea espacio (ej: -p$VAR o -p"secret")
        const hasInlinePasswordFlag = /mysql[^\n]*\s+-p[^\s]+/i.test(trimmed);

        // Detectar MYSQL_*PASSWORD=<literal> en comandos de shell
        const hasLiteralPasswordAssignment = /MYSQL_[A-Z_]*PASSWORD=['"][^'"$]+['"]/i.test(trimmed);

        if (hasInlinePasswordFlag || hasLiteralPasswordAssignment) {
          violations.push({
            file: fileName,
            line: idx + 1,
            content: trimmed,
          });
        }
      });
    }

    expect(
      violations,
      `Se encontraron violaciones de higiene de credenciales en scripts:\n${JSON.stringify(violations, null, 2)}`
    ).toEqual([]);
  });

  it('scripts/db-dev.sh y scripts/dev-up.sh deben usar variables de entorno seguras o descriptores sin filtrar secretos en argv', () => {
    const dbDevPath = path.join(scriptsDir, 'db-dev.sh');
    const devUpPath = path.join(scriptsDir, 'dev-up.sh');

    expect(fs.existsSync(dbDevPath)).toBe(true);
    expect(fs.existsSync(devUpPath)).toBe(true);

    const dbDevContent = fs.readFileSync(dbDevPath, 'utf-8');
    expect(dbDevContent).toContain('export MYSQL_PWD=');
    expect(dbDevContent).toContain('--restart unless-stopped');

    const devUpContent = fs.readFileSync(devUpPath, 'utf-8');
    expect(devUpContent).toContain('MYSQL_HOST');
    expect(devUpContent).toContain('/dev/tcp/${MYSQL_HOST}/${MYSQL_PORT}');
  });
});
