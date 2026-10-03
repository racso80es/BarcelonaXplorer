# [OPERATIVO] Documento Destilado: PBI - Oráculo de Plantillas Go Escapadas en Ansible

**Identificador:** PBI-OPS-027
**Estatus:** Reabierto / Refinado — Listo para Implementación (auditoría cruzada 2026-10-03)
**Fecha de Creación:** 2026-10-03
**Fecha de Refinamiento:** 2026-10-03
**Historia de Usuario Relacionada:** [[OPERATIVO] HU 20: Blindaje del Despliegue contra Rollback Silencioso y Fricciones de Producción](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20HU%2020%3A%20Blindaje%20del%20Despliegue%20contra%20Rollback%20Silencioso%20y%20Fricciones%20de%20Producci%C3%B3n%20%28Post-AUD-OPS-DEPLOY-002%29.md) · Escenarios 3 y 5
**Auditoría:** [`AUD-OPS-DEPLOY-002`](../../Auditorias/Auditoria%20-%20Fricciones%20de%20Despliegue%20en%20Produccion%20y%20Ausencia%20de%20Admin%20Context%20%28HU-18%29.md) · Fricción 2 y lecciones 1 y 2
**Módulo:** `scripts/check-ansible-go-templates.sh`, `src/features/governance/ansible-go-templates.contract.test.ts` (nuevo), `scripts/audit-anchor.sh`, `.SddIA/library/codexes/tech-master-nextjs-prisma.md`
**Entorno:** Árbol `ansible/**/*.yml`, ancla de oráculos local y CI
**Prioridad:** Media (P2)
**Estimación Táctica:** 2 Story Points (forjados: 1 · restantes: 1)
**Depende de:** —
**Bloquea:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Impedir que la siguiente tarea con `docker --format '{{...}}'`, `awk` o `jq` vuelva a romper Jinja2. El caso concreto de `after_symlink.yml:192` ya está escapado con `{% raw %}` (commit `0a9057f`).
- **Estado verificado (auditoría cruzada 2026-10-03, commit `818eb09`):**
  - El script existe, pasa sobre el árbol actual y corre como paso `0/8` de `audit-anchor.sh`, antes del linter.
  - **Hueco 1 — regla demasiado estrecha.** Solo detecta `{{.` (punto pegado a las llaves). Se le escapan formas Go válidas que Jinja2 también intentaría evaluar: `{{ .State.Status }}`, `{{json .Config}}`, `{{range .Mounts}}`, `{{index .Labels "x"}}`.
  - **Hueco 2 — `raw` por línea completa.** Si una línea abre `{% raw %}`, toda la línea se da por escapada: `{% raw %}{{.A}}{% endraw %} {{.B}}` pasa aunque `{{.B}}` esté desnudo.
  - **Hueco 3 — dependencia del cwd.** El script hace `find ansible` relativo al directorio actual. Lanzado desde otro sitio, recorre nada y devuelve verde.
  - **Hueco 4 — sin regresión automática.** La prueba roja/verde fue manual y no queda en el repositorio.
  - **Hueco 5 — Códice con ancla inventada.** `TC-INFRA-002` apunta a `src/shared/config/...`; `parseAnchorString` vive en `ia-gateway/src/endpoints/llm/fallback.config.ts`.
- **Entropía Asimilada:**
  - *Filtro A:* El oráculo falla en seco; no reescribe el YAML.
  - *Filtro B:* La regla es un autómata de líneas (dentro o fuera de `{% raw %}`) más un patrón cerrado de formas Go, no una heurística sobre el comando.
  - *Filtro C:* Corre antes del linter en `audit-anchor.sh`, sin red ni compilación.

---

## 1. Declaración de Intención (INVEST)

**Como** quien añade una tarea Ansible,
**Quiero** que el ancla rechace una plantilla Go sin escapar,
**Para** no descubrirlo en el healthcheck de producción, con la release ya revertida.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Regla, ampliada):** `scripts/check-ansible-go-templates.sh` recorre `ansible/**/*.yml`. De cada línea quita primero los tramos `{% raw %}…{% endraw %}` cerrados en la misma línea y descarta las líneas dentro de un bloque `raw` abierto en una línea anterior. En lo que queda, falla si encuentra:
  - `\{\{-?\s*\.` — acceso a campo Go con o sin espacios (`{{.X}}`, `{{ .X }}`, `{{- .X }}`);
  - `\{\{-?\s*(json|index|range|printf|len|with|if)\s+\.` — función o acción Go aplicada a un campo.
  
  Acepta también `{%- raw %}` y `{% raw -%}`. El mensaje incluye ruta, número de línea y la línea.
- [x] **CA-2 (Árbol actual en verde):** El script termina a 0 sobre el `ansible/` vigente, incluido el `docker inspect` ya escapado. *(Re-ejecutado en la auditoría cruzada: verde.)* Se repite con la regla ampliada.
- [ ] **CA-3 (Regresión automática, sustituye al fixture manual):** El script acepta un directorio raíz opcional como primer argumento; sin argumento usa `ansible/` resuelto desde la ubicación del propio script, no desde el cwd. `src/features/governance/ansible-go-templates.contract.test.ts` lo invoca con `execFileSync('bash', …)` sobre un directorio temporal y comprueba:
  - **Rojo:** `{{.State.Health.Status}}`, `{{ .State.Status }}`, `{{json .Config}}` y `{% raw %}{{.A}}{% endraw %} {{.B}}`.
  - **Verde:** las mismas formas dentro de `{% raw %}`, un bloque `raw` de varias líneas, y las expresiones Jinja2 legítimas `{{ ansistrano_deploy_to }}`, `{{ item.name }}` y `{{ healthcheck_probe.status }}`.
- [x] **CA-4 (Ancla):** `scripts/audit-anchor.sh` ejecuta este script en un paso anterior al linter y aborta si devuelve distinto de cero. Los ocho oráculos existentes conservan su orden relativo. *(Verificado: paso `0/8`.)*
- [ ] **CA-5 (Códice, dos fundamentos):** En `tech-master-nextjs-prisma.md`, a continuación de `TC-INFRA-001`, existen `TC-INFRA-002` (de-quoting de `--env-file` antes de Zod) y `TC-INFRA-003` (`{% raw %}` obligatorio para plantillas Go). Ya están escritos; queda corregir el **Anclaje** de `TC-INFRA-002` a `ia-gateway/src/endpoints/llm/fallback.config.ts` (`parseAnchorString`, `parseModelList`) y su test `fallback.test.ts`, y hacer que `TC-INFRA-003` describa la regla ampliada de CA-1. Ambos citan `AUD-OPS-DEPLOY-002` con enlace, como `TC-INFRA-001`.
- [x] **CA-6 (Sin dependencias):** El script es `bash` sin dependencias nuevas. La numeración de `audit-anchor.sh` es coherente (paso `0`). *(Verificado.)*
- [ ] **CA-7 (Oráculos):** `tsc --noEmit`, `eslint --max-warnings 0` y `vitest run` en verde con el test nuevo, incluido `library-codex.contract.test.ts` tras tocar el Códice.

---

## 3. Fuera de Alcance

- Reescribir las expresiones Jinja2 legítimas (`{{ ansistrano_deploy_to }}`, `{{ healthcheck_probe.status }}`). Ninguna empieza por punto ni por una de las funciones Go de CA-1 seguida de un campo.
- Un linter Ansible completo (`ansible-lint`).
- Plantillas Go fuera de `ansible/` (scripts bash, `docker-compose`).

---

## 4. Evidencia

### 4.1 Forja previa (commit `818eb09`, `Forged-by: Gemini 3.1 Pro`)

Implementado `scripts/check-ansible-go-templates.sh` y añadido como paso `0/8` en `scripts/audit-anchor.sh`. Se comprobó con fixture que el script falla si detecta `{{.` sin el bloque `{% raw %}`.
Se añadieron las directivas TC-INFRA-002 y TC-INFRA-003 al documento maestro `tech-master-nextjs-prisma.md`.

### 4.2 Auditoría cruzada (2026-10-03, Anthropic Claude)

- `bash scripts/check-ansible-go-templates.sh` desde la raíz: `[OK]`, salida 0.
- `vitest run features/governance`: `library-codex.contract.test.ts` 4/4 en verde con los fundamentos nuevos.
- Huecos 1 a 5 registrados como CA-1, CA-3 y CA-5.

### 4.3 Cierre

*(Pendiente.)*
