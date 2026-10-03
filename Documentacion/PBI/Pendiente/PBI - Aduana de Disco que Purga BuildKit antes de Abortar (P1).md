# [OPERATIVO] Documento Destilado: PBI - Aduana de Disco que Purga BuildKit antes de Abortar

**Identificador:** PBI-OPS-025
**Estatus:** Reabierto / Refinado — Listo para Implementación (auditoría cruzada 2026-10-03)
**Fecha de Creación:** 2026-10-03
**Fecha de Refinamiento:** 2026-10-03
**Historia de Usuario Relacionada:** [[OPERATIVO] HU 20: Blindaje del Despliegue contra Rollback Silencioso y Fricciones de Producción](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20HU%2020%3A%20Blindaje%20del%20Despliegue%20contra%20Rollback%20Silencioso%20y%20Fricciones%20de%20Producci%C3%B3n%20%28Post-AUD-OPS-DEPLOY-002%29.md) · Escenario 1
**Auditoría:** [`AUD-OPS-DEPLOY-002`](../../Auditorias/Auditoria%20-%20Fricciones%20de%20Despliegue%20en%20Produccion%20y%20Ausencia%20de%20Admin%20Context%20%28HU-18%29.md) · Fricción 3 (20:29 CEST)
**Módulo:** `src/deploy.sh`
**Entorno:** SSH al Nodo 11 (`10.0.10.11`), Docker BuildKit en el host remoto
**Prioridad:** Alta (P1)
**Estimación Táctica:** 3 Story Points (forjados: 2 · restantes: 1)
**Depende de:** —
**Bloquea:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Hacer alcanzable la purga que ya existe dentro de Ansible.
- **Estado de partida (2026-10-03, antes de la forja):** `ansible/deploy.yml` ya poda BuildKit en `pre_tasks` (agresiva bajo 3 GB, rutinaria con `--keep-storage 2GB`) y en `post_tasks`. Esa poda no llegó a ejecutarse el 2026-10-02 porque `src/deploy.sh` (líneas 54-61) abortaba por SSH si `/` tenía menos del 10% libre, **antes** de invocar el playbook. Con el disco al 98% (1.5 GB libres de 73 GB) el lanzador se rindió y la purga de 49.9 GB fue manual.
- **Estado verificado (auditoría cruzada 2026-10-03, commit `27d4f03`):** La rama de contingencia existe en `src/deploy.sh` (líneas 55-82): purga con `docker builder prune -a -f`, imprime `Total reclaimed space`, vuelve a medir y aborta con antes/después/reclamado. Falta la evidencia de CA-6 y la medición remota no se valida antes de la aritmética (CA-7).
- **Entropía Asimilada:**
  - *Filtro A:* No se relaja el umbral del 10%. Se libera espacio y se vuelve a medir.
  - *Filtro B:* La purga agresiva (`-a`) solo corre en la rama de contingencia. Un disco holgado sigue sin tocarla.
  - *Filtro C (aclarado):* La forja usa tres `ssh` separados (medición, purga, remedición) en lugar de uno encadenado. Se acepta: el comportamiento observable es el mismo y cada paso da su propio mensaje de error.

---

## 1. Declaración de Intención (INVEST)

**Como** operador que lanza `./src/deploy.sh`,
**Quiero** que el script intente recuperar el espacio de BuildKit cuando el disco está por debajo del mínimo,
**Para** que un nodo saturado por capas huérfanas no exija una purga manual antes de poder desplegar.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Contingencia):** Si el porcentaje libre en `/` del nodo es `< 10`, `deploy.sh` ejecuta por SSH `docker builder prune -a -f`, imprime la línea `Total reclaimed space` y vuelve a medir con `df`. *(Verificado en código, `27d4f03`.)*
- [x] **CA-2 (Aborto residual):** Si tras la purga el libre sigue `< 10`, el script termina con código distinto de cero e imprime el porcentaje antes, el porcentaje después y el espacio reclamado. *(Verificado en código.)*
- [x] **CA-3 (Disco holgado):** Si el libre inicial es `≥ 10`, no se ejecuta `docker builder prune -a`. La poda rutinaria de Ansible permanece donde está. *(Verificado en código.)*
- [x] **CA-4 (Fallo de la purga):** Si el `ssh` de la purga devuelve código distinto de cero, el script aborta sin lanzar el playbook y muestra la salida remota (stdout y stderr, `2>&1`). *(Verificado en código.)*
- [x] **CA-5 (Umbrales intactos):** Siguen vigentes el 10% de `deploy.sh` y los 3 GB / `--keep-storage 2GB` de `ansible/deploy.yml`. *(`git diff 6e69bdc..HEAD -- ansible/deploy.yml` vacío.)*
- [ ] **CA-6 (Evidencia):** La sección §4 anota una ejecución contra el Nodo 11, o una simulación local con un `ssh` sustituido (función o binario en `PATH` que devuelve un `df` fijado), que cubra tres ramas: holgada (sin purga), contingencia recuperada (purga y continúa) y aborto residual (purga y sale ≠ 0).
- [ ] **CA-7 (Medición determinista — nuevo):** Antes de restar, `deploy.sh` comprueba que cada medición remota (`REMOTE_DISK_USE_PCT` y `REMOTE_DISK_USE_PCT_AFTER`) es un entero entre 0 y 100 (`[[ "$v" =~ ^[0-9]{1,3}$ ]]` y `≤ 100`). Si no lo es, aborta con un mensaje que nombra el host y el valor recibido. Hoy un `ssh` caído o una salida vacía de `df` hace fallar `$((100 - ))` con un error de sintaxis de bash que no explica nada.

---

## 3. Fuera de Alcance

- Poda de imágenes en uso (`docker image prune -a` sobre contenedores vivos). Solo caché de BuildKit, igual que la recuperación del incidente.
- Cron de poda independiente del despliegue.
- Cambiar `ansible/deploy.yml`.
- Reunir las tres llamadas `ssh` en una (ver Filtro C).

---

## 4. Evidencia

### 4.1 Forja previa (commit `27d4f03`, `Forged-by: Gemini 3.1 Pro`)

Implementado en `src/deploy.sh`. Se agregó purga de contingencia si libre < 10% y re-verificación antes de abortar.

### 4.2 Auditoría cruzada (2026-10-03, Anthropic Claude)

- CA-1 a CA-5 contrastados contra el diff `6e69bdc..HEAD` de `src/deploy.sh`.
- No consta ejecución ni simulación de las ramas (CA-6). La sesión previa no ejecutó `deploy.sh`.
- Defecto nuevo registrado como CA-7.

### 4.3 Cierre

*(Pendiente: salida de la simulación de CA-6 y del caso de medición inválida de CA-7.)*
