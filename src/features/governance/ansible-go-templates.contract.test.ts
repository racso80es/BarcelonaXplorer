import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('Ansible Go Templates Oracle Contract (PBI-OPS-027)', () => {
  const scriptPath = path.resolve(__dirname, '../../../scripts/check-ansible-go-templates.sh');
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ansible-go-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  const runOracle = (yamlContent: string): { success: boolean; output: string } => {
    const filePath = path.join(tempDir, 'test-task.yml');
    fs.writeFileSync(filePath, yamlContent, 'utf-8');

    try {
      const stdout = execFileSync('bash', [scriptPath, tempDir], {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return { success: true, output: stdout };
    } catch (err: unknown) {
      const execError = err as { stdout?: string; stderr?: string; status?: number };
      const output = (execError.stdout || '') + (execError.stderr || '');
      return { success: false, output };
    }
  };

  describe('Casos Rojos (debe rechazar plantillas Go sin escapar)', () => {
    it('debe rechazar acceso directo {{.State.Health.Status}}', () => {
      const yaml = `
- name: Probar inspeccion
  command: docker inspect --format '{{.State.Health.Status}}' mi_contenedor
`;
      const res = runOracle(yaml);
      expect(res.success).toBe(false);
      expect(res.output).toContain('[ERROR] Plantilla Go sin escapar');
    });

    it('debe rechazar acceso con espacios {{ .State.Status }}', () => {
      const yaml = `
- name: Probar inspeccion con espacios
  command: docker inspect --format '{{ .State.Status }}' mi_contenedor
`;
      const res = runOracle(yaml);
      expect(res.success).toBe(false);
      expect(res.output).toContain('[ERROR] Plantilla Go sin escapar');
    });

    it('debe rechazar funciones Go como {{json .Config}}', () => {
      const yaml = `
- name: Probar funcion json Go
  command: docker inspect --format '{{json .Config}}' mi_contenedor
`;
      const res = runOracle(yaml);
      expect(res.success).toBe(false);
      expect(res.output).toContain('[ERROR] Plantilla Go sin escapar');
    });

    it('debe rechazar plantilla Go no protegida tras un bloque raw cerrado en la misma linea {% raw %}{{.A}}{% endraw %} {{.B}}', () => {
      const yaml = `
- name: Probar raw parcial
  command: echo "{% raw %}{{.A}}{% endraw %} {{.B}}"
`;
      const res = runOracle(yaml);
      expect(res.success).toBe(false);
      expect(res.output).toContain('[ERROR] Plantilla Go sin escapar');
    });
  });

  describe('Casos Verdes (debe admitir bloques raw y sintaxis Jinja2 legítima)', () => {
    it('debe admitir plantillas Go envueltas en {% raw %}...{% endraw %} en una linea', () => {
      const yaml = `
- name: Probar raw en linea
  command: docker inspect --format '{% raw %}{{.State.Health.Status}}{% endraw %}' mi_contenedor
`;
      const res = runOracle(yaml);
      expect(res.success).toBe(true);
      expect(res.output).toContain('[OK] Ninguna plantilla Go sin escapar');
    });

    it('debe admitir plantillas Go dentro de bloque raw multilineal', () => {
      const yaml = `
- name: Probar raw multilineal
  command: |
    {% raw %}
    docker inspect --format '{{.State.Status}}'
    docker inspect --format '{{json .Config}}'
    {% endraw %}
`;
      const res = runOracle(yaml);
      expect(res.success).toBe(true);
      expect(res.output).toContain('[OK] Ninguna plantilla Go sin escapar');
    });

    it('debe admitir expresiones Jinja2 legítimas sin falsos positivos', () => {
      const yaml = `
- name: Tareas legítimas de Ansible
  debug:
    msg: >
      Desplegando en {{ ansistrano_deploy_to }}
      Procesando {{ item.name }}
      Estado probe: {{ healthcheck_probe.status }}
`;
      const res = runOracle(yaml);
      expect(res.success).toBe(true);
      expect(res.output).toContain('[OK] Ninguna plantilla Go sin escapar');
    });
  });
});
