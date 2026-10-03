# [OPERATIVO] Documento Destilado: PBI - Oráculo de Plantillas Go Escapadas en Ansible

**Identificador:** PBI-OPS-027
**Estatus:** Realizado
**Fecha de Creación:** 2026-10-03
**Historia de Usuario Relacionada:** [[OPERATIVO] HU 20: Blindaje del Despliegue contra Rollback Silencioso y Fricciones de Producción](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20HU%2020%3A%20Blindaje%20del%20Despliegue%20contra%20Rollback%20Silencioso%20y%20Fricciones%20de%20Producci%C3%B3n%20%28Post-AUD-OPS-DEPLOY-002%29.md) · Escenarios 3 y 5
**Auditoría:** [`AUD-OPS-DEPLOY-002`](../../Auditorias/Auditoria%20-%20Fricciones%20de%20Despliegue%20en%20Produccion%20y%20Ausencia%20de%20Admin%20Context%20%28HU-18%29.md) · Fricción 2 y lecciones 1 y 2
**Módulo:** `scripts/check-ansible-go-templates.sh` (nuevo), `scripts/audit-anchor.sh`, `.SddIA/library/codexes/tech-master-nextjs-prisma.md`
**Entorno:** Árbol `ansible/**/*.yml`, ancla de oráculos local y CI
**Prioridad:** Media (P2)
**Estimación Táctica:** 2 Story Points
**Depende de:** —
**Bloquea:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Impedir que la siguiente tarea con `docker --format '{{...}}'`, `awk` o `jq` vuelva a romper Jinja2. El caso concreto de `after_symlink.yml:192` ya está escapado con `{% raw %}` (commit `0a9057f`).
- **Estado real (2026-10-03):** No hay comprobación automática. Una línea nueva con `{{.State...}}` solo se descubre cuando el playbook corre contra el Nodo 11 y el `rescue` revierte la release.
- **Entropía Asimilada:**
  - *Filtro A:* El oráculo falla en seco; no reescribe el YAML.
  - *Filtro B:* La regla es un autómata de líneas (dentro o fuera de `{% raw %}`), no una heurística sobre el comando.
  - *Filtro C:* Corre antes del linter en `audit-anchor.sh`, sin red ni compilación.

---

## 1. Declaración de Intención (INVEST)

**Como** quien añade una tarea Ansible,
**Quiero** que el ancla rechace una plantilla Go sin escapar,
**Para** no descubrirlo en el healthcheck de producción, con la release ya revertida.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Regla):** `scripts/check-ansible-go-templates.sh` recorre `ansible/**/*.yml`. Falla si una línea contiene `{{.` y no está cubierta por un bloque `{% raw %}...{% endraw %}` abierto en esa línea o en una anterior del mismo fichero. El mensaje incluye ruta y número de línea.
- [ ] **CA-2 (Árbol actual en verde):** El script termina a 0 sobre el `ansible/` vigente, incluido el `docker inspect` ya escapado.
- [ ] **CA-3 (Fixture rojo):** Un fichero temporal con `{{.State.Health.Status}}` desnudo hace fallar el script; el mismo texto dentro de `{% raw %}` lo hace pasar. El fixture no se commitea.
- [ ] **CA-4 (Ancla):** `scripts/audit-anchor.sh` ejecuta este script en un paso nuevo, anterior al linter (`1/8`), y aborta si devuelve distinto de cero. Los ocho oráculos existentes conservan su orden relativo.
- [ ] **CA-5 (Códice, dos fundamentos):** En `tech-master-nextjs-prisma.md`, a continuación de `TC-INFRA-001`:
  - `TC-INFRA-002` — Docker `--env-file` no quita comillas. Todo parser de entorno las recorta antes del `regex` de Zod. Cita `parseAnchorString` y `AUD-OPS-DEPLOY-002` Fricción 1.
  - `TC-INFRA-003` — Toda plantilla Go (`{{. ... }}`) dentro de un YAML de Ansible va dentro de `{% raw %}`. Cita el oráculo de este PBI y la Fricción 2.
- [ ] **CA-6 (Oráculos):** El script es POSIX `sh` o `bash` sin dependencias nuevas. `audit-anchor.sh` no se numera mal: el paso nuevo es `0` o se renumeran los ocho de forma coherente en los `echo`.

---

## 3. Fuera de Alcance

- Reescribir las expresiones Jinja2 legítimas (`{{ ansistrano_deploy_to }}`, `{{ healthcheck_probe.status }}`). La regla solo dispara ante `{{.` (punto inmediatamente después de las llaves), que es la forma de las plantillas Go y no la de las variables Ansible de este repositorio.
- Un linter Ansible completo (`ansible-lint`).

---

## 4. Evidencia

Implementado `scripts/check-ansible-go-templates.sh` y añadido como paso `0/8` en `scripts/audit-anchor.sh`. Se comprobó con fixture que el script falla si detecta `{{.` sin el bloque `{% raw %}`.
Se añadieron las directivas TC-INFRA-002 y TC-INFRA-003 al documento maestro `tech-master-nextjs-prisma.md`.
