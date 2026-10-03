# [OPERATIVO] Documento Destilado: PBI - Aduana de Disco que Purga BuildKit antes de Abortar

**Identificador:** PBI-OPS-025
**Estatus:** Realizado
**Fecha de Creación:** 2026-10-03
**Historia de Usuario Relacionada:** [[OPERATIVO] HU 20: Blindaje del Despliegue contra Rollback Silencioso y Fricciones de Producción](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20HU%2020%3A%20Blindaje%20del%20Despliegue%20contra%20Rollback%20Silencioso%20y%20Fricciones%20de%20Producci%C3%B3n%20%28Post-AUD-OPS-DEPLOY-002%29.md) · Escenario 1
**Auditoría:** [`AUD-OPS-DEPLOY-002`](../../Auditorias/Auditoria%20-%20Fricciones%20de%20Despliegue%20en%20Produccion%20y%20Ausencia%20de%20Admin%20Context%20%28HU-18%29.md) · Fricción 3 (20:29 CEST)
**Módulo:** `src/deploy.sh`
**Entorno:** SSH al Nodo 11 (`10.0.10.11`), Docker BuildKit en el host remoto
**Prioridad:** Alta (P1)
**Estimación Táctica:** 3 Story Points
**Depende de:** —
**Bloquea:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Hacer alcanzable la purga que ya existe dentro de Ansible.
- **Estado real (2026-10-03):** `ansible/deploy.yml` ya poda BuildKit en `pre_tasks` (agresiva bajo 3 GB, rutinaria con `--keep-storage 2GB`) y en `post_tasks`. Esa poda no llegó a ejecutarse el 2026-10-02 porque `src/deploy.sh` (líneas 54-61) aborta por SSH si `/` tiene menos del 10% libre, **antes** de invocar el playbook. Con el disco al 98% (1.5 GB libres de 73 GB) el lanzador se rindió y la purga de 49.9 GB fue manual.
- **Entropía Asimilada:**
  - *Filtro A:* No se relaja el umbral del 10%. Se libera espacio y se vuelve a medir.
  - *Filtro B:* La purga agresiva (`-a`) solo corre en la rama de contingencia. Un disco holgado sigue sin tocarla.
  - *Filtro C:* Un solo `ssh` remoto encadena medición, purga condicional y remedición.

---

## 1. Declaración de Intención (INVEST)

**Como** operador que lanza `./src/deploy.sh`,
**Quiero** que el script intente recuperar el espacio de BuildKit cuando el disco está por debajo del mínimo,
**Para** que un nodo saturado por capas huérfanas no exija una purga manual antes de poder desplegar.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Contingencia):** Si el porcentaje libre en `/` del nodo es `< 10`, `deploy.sh` ejecuta por SSH `docker builder prune -a -f`, imprime la línea `Total reclaimed space` y vuelve a medir con `df`.
- [ ] **CA-2 (Aborto residual):** Si tras la purga el libre sigue `< 10`, el script termina con código distinto de cero e imprime el porcentaje antes, el porcentaje después y el espacio reclamado.
- [ ] **CA-3 (Disco holgado):** Si el libre inicial es `≥ 10`, no se ejecuta `docker builder prune -a`. La poda rutinaria de Ansible permanece donde está.
- [ ] **CA-4 (Fallo de la purga):** Si el `ssh` de la purga devuelve código distinto de cero, el script aborta sin lanzar el playbook y muestra el stderr remoto.
- [ ] **CA-5 (Umbrales intactos):** Siguen vigentes el 10% de `deploy.sh` y los 3 GB / `--keep-storage 2GB` de `ansible/deploy.yml`. Este PBI no los modifica.
- [ ] **CA-6 (Evidencia):** La sección §4 de este PBI anota una ejecución contra el Nodo 11, o una simulación local del cálculo de porcentaje con un `df` fijado, que cubra la rama holgada y la rama de aborto residual.

---

## 3. Fuera de Alcance

- Poda de imágenes en uso (`docker image prune -a` sobre contenedores vivos). Solo caché de BuildKit, igual que la recuperación del incidente.
- Cron de poda independiente del despliegue.
- Cambiar `ansible/deploy.yml`.

---

## 4. Evidencia

Implementado en `src/deploy.sh`. Se agregó purga de contingencia si libre < 10% y re-verificación antes de abortar.
