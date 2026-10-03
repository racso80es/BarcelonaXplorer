# [OPERATIVO] Documento Destilado: PBI - Oráculo de Plantillas Go Escapadas en Ansible

**Identificador:** PBI-OPS-027
**Estatus:** Realizado (Certificado S+ Grade)
**Fecha de Creación:** 2026-10-03
**Fecha de Refinamiento:** 2026-10-03
**Fecha de Certificación:** 2026-10-03
**Historia de Usuario Relacionada:** [[OPERATIVO] HU 20: Blindaje del Despliegue contra Rollback Silencioso y Fricciones de Producción](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20HU%2020%3A%20Blindaje%20del%20Despliegue%20contra%20Rollback%20Silencioso%20y%20Fricciones%20de%20Producci%C3%B3n%20%28Post-AUD-OPS-DEPLOY-002%29.md) · Escenarios 3 y 5
**Auditoría:** [`AUD-OPS-DEPLOY-002`](../../Auditorias/Auditoria%20-%20Fricciones%20de%20Despliegue%20en%20Produccion%20y%20Ausencia%20de%20Admin%20Context%20%28HU-18%29.md) · Fricción 2 y lecciones 1 y 2
**Módulo:** `scripts/check-ansible-go-templates.sh`, `src/features/governance/ansible-go-templates.contract.test.ts`, `scripts/audit-anchor.sh`, `.SddIA/library/codexes/tech-master-nextjs-prisma.md`
**Entorno:** Árbol `ansible/**/*.yml`, ancla de oráculos local y CI
**Prioridad:** Media (P2)
**Estimación Táctica:** 2 Story Points
**Depende de:** —
**Bloquea:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Impedir que la siguiente tarea con `docker --format '{{...}}'`, `awk` o `jq` vuelva a romper Jinja2. El caso concreto de `after_symlink.yml:192` ya está escapado con `{% raw %}` (commit `0a9057f`).
- **Estado verificado y resuelto:**
  - El oráculo detecta plantillas Go con sintaxis amplia: accesos directos o espaciados `{{.X}}`, `{{ .X }}`, `{{- .X}}`, y funciones/acciones Go `{{json .X}}`, `{{range .X}}`, `{{index .X}}`, etc.
  - Elimina tramos `{% raw %}...{% endraw %}` dentro de la misma línea antes de evaluar y gestiona bloques multilínea de forma determinista, evitando falsos negativos en líneas con escapes parciales.
  - No depende del cwd: resuelve `ansible/` a partir de su ubicación y acepta un directorio destino opcional `$1`.
  - Cuenta con suite de regresión automatizada colocalizada en `src/features/governance/ansible-go-templates.contract.test.ts` con 7 casos (4 rojos y 3 verdes).
  - El Códice Maestro Tecnológico incluye `TC-INFRA-002` y `TC-INFRA-003` con anclajes fieles y enlaces directos a `AUD-OPS-DEPLOY-002`.
- **Entropía Asimilada:**
  - *Filtro A:* El oráculo falla en seco; no reescribe el YAML.
  - *Filtro B:* La regla es un autómata de líneas (dentro o fuera de `{% raw %}`) más un patrón cerrado de formas Go, no una heurística sobre el comando.
  - *Filtro C:* Corre antes del linter en `audit-anchor.sh`, sin red ni compilación pesada.

---

## 1. Declaración de Intención (INVEST)

**Como** quien añade una tarea Ansible,
**Quiero** que el ancla rechace una plantilla Go sin escapar,
**Para** no descubrirlo en el healthcheck de producción, con la release ya revertida.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Regla, ampliada):** `scripts/check-ansible-go-templates.sh` recorre `ansible/**/*.yml`. De cada línea quita primero los tramos `{% raw %}…{% endraw %}` cerrados en la misma línea y descarta las líneas dentro de un bloque `raw` abierto en una línea anterior. En lo que queda, falla si encuentra:
  - `\{\{-?\s*\.` — acceso a campo Go con o sin espacios (`{{.X}}`, `{{ .X }}`, `{{- .X }}`);
  - `\{\{-?\s*(json|index|range|printf|len|with|if)\s+\.` — función o acción Go aplicada a un campo.
  Acepta también `{%- raw %}` y `{% raw -%}`. El mensaje incluye ruta, número de línea y la línea.
- [x] **CA-2 (Árbol actual en verde):** El script termina a 0 sobre el `ansible/` vigente, incluido el `docker inspect` ya escapado.
- [x] **CA-3 (Regresión automática, sustituye al fixture manual):** El script acepta un directorio raíz opcional como primer argumento; sin argumento usa `ansible/` resuelto desde la ubicación del propio script, no desde el cwd. `src/features/governance/ansible-go-templates.contract.test.ts` lo invoca con `execFileSync('bash', …)` sobre un directorio temporal y comprueba:
  - **Rojo:** `{{.State.Health.Status}}`, `{{ .State.Status }}`, `{{json .Config}}` y `{% raw %}{{.A}}{% endraw %} {{.B}}`.
  - **Verde:** las mismas formas dentro de `{% raw %}`, un bloque `raw` de varias líneas, y las expresiones Jinja2 legítimas `{{ ansistrano_deploy_to }}`, `{{ item.name }}` y `{{ healthcheck_probe.status }}`.
- [x] **CA-4 (Ancla):** `scripts/audit-anchor.sh` ejecuta este script en un paso anterior al linter (paso `0/8`) y aborta si devuelve distinto de cero.
- [x] **CA-5 (Códice, dos fundamentos):** En `tech-master-nextjs-prisma.md`, a continuación de `TC-INFRA-001`, se actualizaron `TC-INFRA-002` (de-quoting de `--env-file` con anclaje a `ia-gateway/src/endpoints/llm/fallback.config.ts` y test `fallback.test.ts`) y `TC-INFRA-003` (regla Go ampliada y oráculo de contrato), ambos citando `AUD-OPS-DEPLOY-002` con enlaces markdown válidos.
- [x] **CA-6 (Sin dependencias):** El script es `bash` sin dependencias externas nuevas.
- [x] **CA-7 (Oráculos):** `tsc --noEmit`, `eslint --max-warnings 0` y `vitest run` en verde, incluyendo `library-codex.contract.test.ts` (4/4) y `ansible-go-templates.contract.test.ts` (7/7).

---

## 3. Fuera de Alcance

- Reescribir las expresiones Jinja2 legítimas (`{{ ansistrano_deploy_to }}`, `{{ healthcheck_probe.status }}`). Ninguna empieza por punto ni por una de las funciones Go de CA-1 seguida de un campo.
- Un linter Ansible completo (`ansible-lint`).
- Plantillas Go fuera de `ansible/` (scripts bash, `docker-compose`).

---

## 4. Evidencia

### 4.1 Forja previa (commit `818eb09`, `Forged-by: Gemini 3.1 Pro`)

Implementado `scripts/check-ansible-go-templates.sh` y añadido como paso `0/8` en `scripts/audit-anchor.sh`.

### 4.2 Auditoría cruzada (2026-10-03, Anthropic Claude)

- `bash scripts/check-ansible-go-templates.sh` desde la raíz: `[OK]`, salida 0.
- Huecos identificados: patrón Go restringido, falso escape en líneas con raw parcial, dependencia de cwd y falta de test automatizado.

### 4.3 Cierre y Certificación (2026-10-03, Google Gemini 3.8 Flash)

1. **Regla Go Ampliada e Independiente de CWD ([`scripts/check-ansible-go-templates.sh`](file:///home/racso/Proyectos/BarcelonaXplorer/scripts/check-ansible-go-templates.sh)):**
   - Resuelve el directorio de playbooks automáticamente a partir de la ubicación del propio script (`TARGET_DIR="${1:-${SCRIPT_DIR}/../ansible}"`).
   - Remueve fragmentos `{% raw %}...{% endraw %}` en bucle sobre cada línea antes de evaluar y maneja aperturas multilínea.
   - Evalúa `\{\{-?[[:space:]]*\.` y `\{\{-?[[:space:]]*(json|index|range|printf|len|with|if)[[:space:]]+\.`.
   - Ejecución contra árbol real:
     ```bash
     ./scripts/check-ansible-go-templates.sh
     # [OK] Ninguna plantilla Go sin escapar encontrada en /home/racso/Proyectos/BarcelonaXplorer/scripts/../ansible.
     ```

2. **Suite de Regresión Automatizada ([`src/features/governance/ansible-go-templates.contract.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/governance/ansible-go-templates.contract.test.ts)):**
   - 7 pruebas unitarias ejecutadas con Vitest en directorios temporales aislados:
     - 4 casos rojos: `{{.State.Health.Status}}`, `{{ .State.Status }}`, `{{json .Config}}`, `{% raw %}{{.A}}{% endraw %} {{.B}}` -> Todos fallan y reportan `[ERROR] Plantilla Go sin escapar`.
     - 3 casos verdes: bloque raw en una línea, bloque raw multilínea, expresiones Jinja2 legítimas (`ansistrano_deploy_to`, `item.name`, `healthcheck_probe.status`) -> Todos pasan limpiamente con código 0.

3. **Códice Maestro Tecnológico ([`.SddIA/library/codexes/tech-master-nextjs-prisma.md`](file:///home/racso/Proyectos/BarcelonaXplorer/.SddIA/library/codexes/tech-master-nextjs-prisma.md)):**
   - `TC-INFRA-002` anclado a `ia-gateway/src/endpoints/llm/fallback.config.ts` y `fallback.test.ts`.
   - `TC-INFRA-003` anclado a `scripts/check-ansible-go-templates.sh` y `src/features/governance/ansible-go-templates.contract.test.ts`.
   - `library-codex.contract.test.ts` pasando 4 de 4 tests en verde.
