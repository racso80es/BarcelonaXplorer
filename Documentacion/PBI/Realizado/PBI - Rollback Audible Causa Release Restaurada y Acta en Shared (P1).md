# [OPERATIVO] Documento Destilado: PBI - Rollback Audible: Causa, Release Restaurada y Acta en Shared

**Identificador:** PBI-OPS-026
**Estatus:** Realizado
**Fecha de Creación:** 2026-10-03
**Historia de Usuario Relacionada:** [[OPERATIVO] HU 20: Blindaje del Despliegue contra Rollback Silencioso y Fricciones de Producción](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20HU%2020%3A%20Blindaje%20del%20Despliegue%20contra%20Rollback%20Silencioso%20y%20Fricciones%20de%20Producci%C3%B3n%20%28Post-AUD-OPS-DEPLOY-002%29.md) · Escenario 2
**Auditoría:** [`AUD-OPS-DEPLOY-002`](../../Auditorias/Auditoria%20-%20Fricciones%20de%20Despliegue%20en%20Produccion%20y%20Ausencia%20de%20Admin%20Context%20%28HU-18%29.md) · §1 y lección 4
**Módulo:** `ansible/hooks/after_symlink.yml` (bloque `rescue`), `src/deploy.sh`
**Entorno:** Ansistrano, directorio `shared/` fuera de la rotación de releases
**Prioridad:** Alta (P1)
**Estimación Táctica:** 3 Story Points
**Depende de:** —
**Bloquea:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Hacer observable el rollback que ya funciona. El 2026-10-02 el síntoma fue «en producción no está `/Admin/Context`»; la causa era que `current` seguía en `releases/20261002095804Z` (commit `1e6c03c`), anterior a la HU 18, porque el `rescue` había revertido el symlink.
- **Estado real (2026-10-03):** El bloque `rescue` de `after_symlink.yml` (líneas 241-276) restaura la release anterior y aborta. El `fail` dice siempre que falló `http://127.0.0.1:8080/api/telemetry/log`, también cuando quien falló fue el `docker inspect` del gateway (fue el caso: contenedor en `Restarting`). No escribe la release restaurada en ningún sitio persistente. `deploy.sh` no imprime el desenlace.
- **Entropía Asimilada:**
  - *Filtro A:* El rollback automático se conserva. No se deja una release enferma como `current`.
  - *Filtro B:* El mensaje sale de `ansible_failed_task` y `ansible_failed_result`, no de un texto fijo.
  - *Filtro C:* Un solo fichero YAML en `shared/`, sobrescrito en cada despliegue.

---

## 1. Declaración de Intención (INVEST)

**Como** operador que ve producción distinta de `main`,
**Quiero** que el despliegue diga qué sonda falló y qué release quedó sirviendo,
**Para** no tener que deducir un rollback leyendo el symlink a mano.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Causa real):** El `ansible.builtin.fail` del `rescue` incluye el nombre de `ansible_failed_task`, el mensaje de `ansible_failed_result` y, si la variable existe, `ia_gateway_container_health.stdout`. Un fallo en el `docker inspect` no se rotula como fallo de telemetría.
- [ ] **CA-2 (Release restaurada):** El mismo mensaje incluye la ruta absoluta de la release a la que apunta `current` tras el `ln -sfn` y el contenido de su `.bx_release_tag`.
- [ ] **CA-3 (Acta):** Al cerrar el oráculo, éxito o `rescue`, se escribe `{{ ansistrano_deploy_to }}/shared/last-deploy-outcome.yml` con `outcome` (`succeeded` | `rolled_back`), `release_path`, `release_tag`, `failed_task` (vacío en éxito), `finished_at` en ISO-8601 y `playbook`. El fichero vive en `shared/`, fuera de `releases/`.
- [ ] **CA-4 (Lanzador):** `src/deploy.sh`, al terminar el playbook (código 0 o distinto), imprime el contenido de esa acta si el fichero existe. Un código distinto de cero del playbook sigue siendo distinto de cero.
- [ ] **CA-5 (Sintaxis):** `ansible-playbook --syntax-check ansible/deploy.yml` y `ansible/rollback.yml` en verde. El `{% raw %}` de la línea del `docker inspect` permanece.
- [ ] **CA-6 (Evidencia):** §4 anota el texto del `fail` de una ejecución con sonda forzada a fallar (contenedor parado o URL inválida en un entorno de prueba) y el YAML del acta.

---

## 3. Fuera de Alcance

- Notificación a Telegram o a la bitácora MySQL. El acta en disco y la salida de `deploy.sh` bastan.
- Cambiar cuántas releases conserva Ansistrano ni el criterio `ls -1td | sed -n '2p'`.
- Reintentar el despliegue automáticamente después del rollback.

---

## 4. Evidencia

Implementado en `ansible/hooks/after_symlink.yml` y `src/deploy.sh`. 
El oráculo de salud genera un acta de despliegue en `shared/last-deploy-outcome.yml` indicando `outcome: succeeded` (si tiene éxito) o `outcome: rolled_back` (si falla).
El `rescue` captura el fallo, almacena la información de la release a restaurar, y usa `ansible.builtin.fail` emitiendo el detalle de qué tarea falló, salud de IA Gateway, y cuál release fue restaurada.
Finalmente `deploy.sh` imprime siempre esta acta al terminal para facilitar la depuración post-rollback.
