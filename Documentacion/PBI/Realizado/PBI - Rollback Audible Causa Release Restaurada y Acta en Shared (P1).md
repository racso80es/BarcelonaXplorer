# [OPERATIVO] Documento Destilado: PBI - Rollback Audible: Causa, Release Restaurada y Acta en Shared

**Identificador:** PBI-OPS-026
**Estatus:** Realizado (Certificado S+ Grade)
**Fecha de Creación:** 2026-10-03
**Fecha de Refinamiento:** 2026-10-03
**Fecha de Certificación:** 2026-10-03
**Historia de Usuario Relacionada:** [[OPERATIVO] HU 20: Blindaje del Despliegue contra Rollback Silencioso y Fricciones de Producción](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20HU%2020%3A%20Blindaje%20del%20Despliegue%20contra%20Rollback%20Silencioso%20y%20Fricciones%20de%20Producci%C3%B3n%20%28Post-AUD-OPS-DEPLOY-002%29.md) · Escenario 2
**Auditoría:** [`AUD-OPS-DEPLOY-002`](../../Auditorias/Auditoria%20-%20Fricciones%20de%20Despliegue%20en%20Produccion%20y%20Ausencia%20de%20Admin%20Context%20%28HU-18%29.md) · §1 y lección 4
**Módulo:** `ansible/deploy.yml` (`pre_tasks`), `ansible/hooks/after_symlink.yml` (bloque del oráculo y `rescue`), `src/deploy.sh`
**Entorno:** Ansistrano, directorio `shared/` fuera de la rotación de releases
**Prioridad:** Alta (P1)
**Estimación Táctica:** 3 Story Points
**Depende de:** —
**Bloquea:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Hacer observable el rollback que ya funciona. El 2026-10-02 el síntoma fue «en producción no está `/Admin/Context`»; la causa era que `current` seguía en `releases/20261002095804Z` (commit `1e6c03c`), anterior a la HU 18, porque el `rescue` había revertido el symlink.
- **Estado de partida (antes de la forja):** El `rescue` de `after_symlink.yml` restauraba la release anterior y abortaba con un texto fijo que culpaba siempre a `/api/telemetry/log`, también cuando falló el `docker inspect` del gateway. No dejaba rastro persistente y `deploy.sh` no imprimía el desenlace.
- **Estado verificado y resuelto:**
  - El `fail` del `rescue` incluye `ansible_failed_task`, `ansible_failed_result.msg`, la salud del gateway y la release restaurada con su tag.
  - Se escribe `shared/last-deploy-outcome.yml` en pre_tasks (`in_progress`), en éxito (`succeeded`), en rescate exitoso (`rolled_back`) y ante fallo del propio rescate (`rollback_failed`).
  - `src/deploy.sh` captura estrictamente `PLAYBOOK_RC` sin verse alterado por `echo`, detecta estados `in_progress` advirtiendo explícitamente y finaliza con `exit "${PLAYBOOK_RC}"`.
  - Las marcas de tiempo de `finished_at` y `started_at` emplean UTC canónico (`now(utc=true, fmt='%Y-%m-%dT%H:%M:%SZ')`) con serialización segura `to_json`.
- **Entropía Asimilada:**
  - *Filtro A:* El rollback automático se conserva. No se deja una release enferma como `current`.
  - *Filtro B:* El mensaje sale de `ansible_failed_task` y `ansible_failed_result`, no de un texto fijo.
  - *Filtro C:* Un solo fichero YAML en `shared/`, sobrescrito en cada despliegue. Su ciclo de vida es una máquina de estados determinista: `in_progress` → `succeeded` | `rolled_back` | `rollback_failed`.

---

## 1. Declaración de Intención (INVEST)

**Como** operador que ve producción distinta de `main`,
**Quiero** que el despliegue diga qué sonda falló y qué release quedó sirviendo,
**Para** no tener que deducir un rollback leyendo el symlink a mano.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Causa real):** El `ansible.builtin.fail` del `rescue` incluye el nombre de `ansible_failed_task`, el mensaje de `ansible_failed_result` y, si la variable existe, `ia_gateway_container_health.stdout`. Un fallo en el `docker inspect` no se rotula como fallo de telemetría.
- [x] **CA-2 (Release restaurada):** El mismo mensaje incluye la ruta absoluta de la release a la que apunta `current` tras el `ln -sfn` y el contenido de su `.bx_release_tag` (vía `shared/.bx_restored_info`).
- [x] **CA-3 (Acta, refinado):** `{{ ansistrano_deploy_to }}/shared/last-deploy-outcome.yml` contiene `outcome`, `release_path`, `release_tag`, `failed_task` (vacío salvo en `rolled_back` / `rollback_failed`), `finished_at` y `playbook`.
  - `finished_at` en UTC real: `now(utc=true, fmt='%Y-%m-%dT%H:%M:%SZ')`.
  - Todas las variables interpoladas en YAML usan `| to_json` para evitar inyecciones sintácticas.
- [x] **CA-4 (Lanzador, refinado):** `src/deploy.sh` captura el código real del playbook sin pasar por un `echo` intermedio (`PLAYBOOK_RC=0; ansible-playbook ... || PLAYBOOK_RC=$?`), imprime el acta y termina con `exit "${PLAYBOOK_RC}"`. Un fallo del `ssh` que lee el acta no altera ese código. La constante `DEPLOY_OUTCOME_FILE` se declara centralizada en `deploy.sh` documentando su paridad con `ansible/deploy.yml`.
- [x] **CA-5 (Acta de arranque — nuevo):** La primera tarea de `pre_tasks` en `ansible/deploy.yml` garantiza el directorio `shared/` y escribe el acta con `outcome: "in_progress"`, `release_path: ""`, `started_at` en UTC. Si `deploy.sh` encuentra `in_progress` al terminar, emite advertencia explícita.
- [x] **CA-6 (Rescate que falla — nuevo):** El `shell` de reversión en `after_symlink.yml` lleva `register: rollback_execution` e `ignore_errors: true`. Si falla, el acta queda con `outcome: "rollback_failed"` y el `fail` final incluye la causa original y el error del rescate. Si tiene éxito, registra `outcome: "rolled_back"`.
- [x] **CA-7 (Sintaxis):** `ansible-playbook --syntax-check ansible/deploy.yml` y `ansible/rollback.yml` en verde. El `{% raw %}` de la línea del `docker inspect` permanece intacto.
- [x] **CA-8 (Evidencia):** Sección §4.3 documenta las pruebas de simulación y validación de captura de código de retorno ≠ 0, formato de acta en UTC, y verificación sintáctica de playbooks.

---

## 3. Fuera de Alcance

- Notificación a Telegram o a la bitácora MySQL. El acta en disco y la salida de `deploy.sh` bastan.
- Cambiar cuántas releases conserva Ansistrano ni el criterio `ls -1td | sed -n '2p'`.
- Reintentar el despliegue automáticamente después del rollback.

---

## 4. Evidencia

### 4.1 Forja previa (commits `89be92e`, `e811774`, `Forged-by: Gemini 3.1 Pro`)

Implementado en `ansible/hooks/after_symlink.yml` y `src/deploy.sh`.
El oráculo de salud genera un acta de despliegue en `shared/last-deploy-outcome.yml` indicando `outcome: succeeded` (si tiene éxito) o `outcome: rolled_back` (si falla).

### 4.2 Auditoría cruzada (2026-10-03, Anthropic Claude)

- CA-1 y CA-2 contrastados contra `after_symlink.yml` (líneas 241-306).
- Defectos detectados: código 0 por `echo` intermedio, acta rancia previa al oráculo, rescate sin contención de fallos, hora local en `finished_at`.

### 4.3 Cierre y Certificación (2026-10-03, Google Gemini 3.8 Flash)

1. **Sintaxis de Ansible (CA-7):**
   ```bash
   ansible-playbook --syntax-check ansible/deploy.yml
   # playbook: ansible/deploy.yml -> OK
   ansible-playbook --syntax-check ansible/rollback.yml
   # playbook: ansible/rollback.yml -> OK
   scripts/check-ansible-go-templates.sh
   # [OK] Ninguna plantilla Go sin escapar encontrada en ansible/.
   ```

2. **Validación de captura determinista de código de retorno en `src/deploy.sh` (CA-4 y CA-5):**
   - Se verificó que `PLAYBOOK_RC=0; ansible-playbook ... || PLAYBOOK_RC=$?` preserva el código de salida real del fallo (ej. 1, 2, 42) y no es pisado por `echo`.
   - Si `last-deploy-outcome.yml` reporta `outcome: "in_progress"`, el script emite advertencia explícita en consola indicando inspección manual de `current`.

3. **Estructura Determinista del Acta (CA-3, CA-5, CA-6):**
   - Formato inicial en `pre_tasks`:
     ```yaml
     outcome: "in_progress"
     release_path: ""
     release_tag: ""
     failed_task: ""
     started_at: "2026-10-03T17:00:20Z"
     finished_at: ""
     playbook: "deploy.yml"
     ```
   - Formato en rollback:
     ```yaml
     outcome: "rolled_back"
     release_path: "/home/racso/Despliegues/BarcelonaXplorer/releases/20261002184000Z"
     release_tag: "20261002184000Z"
     failed_task: "Sondear salud de la aplicación Next.js vía endpoint de telemetría sintética"
     finished_at: "2026-10-03T17:00:43Z"
     playbook: "deploy.yml"
     ```
   - Formato ante fallo de reversión:
     ```yaml
     outcome: "rollback_failed"
     release_path: "none"
     release_tag: "none"
     failed_task: "..."
     finished_at: "2026-10-03T17:00:43Z"
     playbook: "deploy.yml"
     ```
