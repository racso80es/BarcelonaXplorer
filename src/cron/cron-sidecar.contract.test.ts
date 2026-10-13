import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import YAML from 'yaml';

describe('cron-sidecar.contract.test (PBI-CTX-030)', () => {
  const repoRoot = path.resolve(__dirname, '../..');
  const composePath = path.join(repoRoot, 'src/docker-compose.yml');
  const hookPath = path.join(repoRoot, 'ansible/hooks/after_symlink.yml');
  const crontabPath = path.join(repoRoot, 'src/cron/crontab');

  it('CA-1: docker-compose.yml monta crontab en staging y lo instala como UID 0 en comando de arranque', () => {
    const rawCompose = fs.readFileSync(composePath, 'utf8');
    const compose = YAML.parse(rawCompose);

    const cronService = compose.services?.cron;
    expect(cronService).toBeDefined();
    expect(cronService.image).toBe('alpine:3.20');

    // No debe haber montaje directo hacia /etc/crontabs/root
    const volumes: string[] = cronService.volumes ?? [];
    const directRootVolume = volumes.some((v: string) => v.includes(':/etc/crontabs/root'));
    expect(directRootVolume).toBe(false);

    // Debe montar en staging /etc/crontabs.src/root:ro
    const stagingVolume = volumes.some((v: string) => v.includes('/etc/crontabs.src/root:ro'));
    expect(stagingVolume).toBe(true);

    // Command debe contener sh -c con install a UID 0 y exec crond con -L /dev/stdout
    const command = cronService.command;
    const cmdStr = Array.isArray(command) ? command.join(' ') : String(command);
    expect(cmdStr).toContain('install -o root -g root -m 0600 /etc/crontabs.src/root /etc/crontabs/root');
    expect(cmdStr).toContain('exec crond -f -l 2 -L /dev/stdout');

    // El comando no debe invocar directamente wget ni endpoints de la API
    expect(cmdStr).not.toContain('wget');
    expect(cmdStr).not.toContain('/api/context/ingest');
  });

  it('CA-2: after_symlink.yml ejecuta stat sobre /etc/crontabs/root verificando UID 0', () => {
    const rawHook = fs.readFileSync(hookPath, 'utf8');
    const hookTasks = YAML.parse(rawHook);

    expect(Array.isArray(hookTasks)).toBe(true);
    const oracleBlockTask = hookTasks.find(
      (t: { name?: string; block?: unknown[] }) =>
        t.name?.includes('Oráculo de Salud Sintético') && Array.isArray(t.block),
    );
    expect(oracleBlockTask).toBeDefined();

    const subTasks = oracleBlockTask.block as Array<Record<string, unknown>>;
    const cronCheckTask = subTasks.find((t) =>
      String(t.name ?? '').includes('barcelonaxplorer_cron'),
    );
    expect(cronCheckTask).toBeDefined();

    const shellScript =
      (cronCheckTask?.['ansible.builtin.shell'] as string) ??
      (cronCheckTask?.shell as string) ??
      '';
    expect(shellScript).toContain('docker exec barcelonaxplorer_cron stat -c %u /etc/crontabs/root');
    expect(shellScript).toContain('test "$uid" = "0"');
    expect(cronCheckTask?.changed_when).toBe(false);
  });

  it('CA-3: src/cron/crontab preserva las 3 tareas programadas, expresiones temporales y redirecciones a /proc/1/fd/1', () => {
    const rawCrontab = fs.readFileSync(crontabPath, 'utf8');

    // Poda
    expect(rawCrontab).toContain('30 3 * * *');
    expect(rawCrontab).toContain('/api/telemetry/prune');

    // Ingesta
    expect(rawCrontab).toContain('0 4 * * *');
    expect(rawCrontab).toContain('/api/context/ingest');

    // Argos
    expect(rawCrontab).toContain('0 5 * * 0');
    expect(rawCrontab).toContain('/api/context/maintain');

    // Redirección de salida a la consola
    const procMatches = rawCrontab.match(/> \/proc\/1\/fd\/1 2>&1/g);
    expect(procMatches).toHaveLength(3);
  });
});
