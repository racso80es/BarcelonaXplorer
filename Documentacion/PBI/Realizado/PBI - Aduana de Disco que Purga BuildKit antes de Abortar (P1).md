# [OPERATIVO] Documento Destilado: PBI - Aduana de Disco que Purga BuildKit antes de Abortar

**Identificador:** PBI-OPS-025
**Estatus:** Realizado (Certificado S+ Grade)
**Fecha de Creación:** 2026-10-03
**Fecha de Refinamiento:** 2026-10-03
**Fecha de Certificación:** 2026-10-03
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
- **Estado de partida (2026-10-03, antes de la forja):** `ansible/deploy.yml` ya poda BuildKit en `pre_tasks` (agresiva bajo 3 GB, rutinaria con `--keep-storage 2GB`) y en `post_tasks`. Esa poda no llegó a ejecutarse el 2026-10-02 porque `src/deploy.sh` (líneas 54-61) abortaba por SSH si `/` tenía menos del 10% libre, **antes** de invocar el playbook. Con el disco al 98% (1.5 GB libres de 73 GB) el lanzador se rindió y la purga de 49.9 GB fue manual.
- **Estado verificado y resuelto:**
  - `src/deploy.sh` ejecuta la rama de contingencia (`docker builder prune -a -f`) cuando el disco libre es `< 10%`, reportando `Total reclaimed space`.
  - Se valida deterministamente que las mediciones inicial y post-purga sean valores enteros en el rango `[0, 100]`. Ante lecturas inválidas o caídas de conexión SSH, aborta inmediatamente con diagnóstico explícito en lugar de provocar errores de sintaxis en la aritmética de bash.
  - La rama holgada (`libre ≥ 10%`) no ejecuta purga agresiva y preserva la poda rutinaria de Ansible.
- **Entropía Asimilada:**
  - *Filtro A:* No se relaja el umbral del 10%. Se libera espacio y se vuelve a medir.
  - *Filtro B:* La purga agresiva (`-a`) solo corre en la rama de contingencia. Un disco holgado sigue sin tocarla.
  - *Filtro C:* Manejo modular de la conexión SSH por fases claras de medición, contingencia y validación residual.

---

## 1. Declaración de Intención (INVEST)

**Como** operador que lanza `./src/deploy.sh`,
**Quiero** que el script intente recuperar el espacio de BuildKit cuando el disco está por debajo del mínimo,
**Para** que un nodo saturado por capas huérfanas no exija una purga manual antes de poder desplegar.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Contingencia):** Si el porcentaje libre en `/` del nodo es `< 10`, `deploy.sh` ejecuta por SSH `docker builder prune -a -f`, imprime la línea `Total reclaimed space` y vuelve a medir con `df`.
- [x] **CA-2 (Aborto residual):** Si tras la purga el libre sigue `< 10`, el script termina con código distinto de cero e imprime el porcentaje antes, el porcentaje después y el espacio reclamado.
- [x] **CA-3 (Disco holgado):** Si el libre inicial es `≥ 10`, no se ejecuta `docker builder prune -a`. La poda rutinaria de Ansible permanece donde está.
- [x] **CA-4 (Fallo de la purga):** Si el `ssh` de la purga devuelve código distinto de cero, el script aborta sin lanzar el playbook y muestra la salida remota (stdout y stderr, `2>&1`).
- [x] **CA-5 (Umbrales intactos):** Siguen vigentes el 10% de `deploy.sh` y los 3 GB / `--keep-storage 2GB` de `ansible/deploy.yml`.
- [x] **CA-6 (Evidencia):** Sección §4.3 documenta la validación de las ramas holgada, contingencia con recuperación, aborto residual y fallos de medición.
- [x] **CA-7 (Medición determinista — nuevo):** `deploy.sh` valida con regex `^[0-9]{1,3}$` y frontera aritmética `(( <= 100 ))` que `REMOTE_DISK_USE_PCT` y `REMOTE_DISK_USE_PCT_AFTER` sean enteros válidos antes de calcular `REMOTE_DISK_FREE_PCT`. Ante lecturas anómalas o vacías, aborta con mensaje descriptivo y código ≠ 0.

---

## 3. Fuera de Alcance

- Poda de imágenes en uso (`docker image prune -a` sobre contenedores vivos). Solo caché de BuildKit, igual que la recuperación del incidente.
- Cron de poda independiente del despliegue.
- Cambiar `ansible/deploy.yml`.
- Modificar los umbrales de seguridad ya ratificados.

---

## 4. Evidencia

### 4.1 Forja previa (commit `27d4f03`, `Forged-by: Gemini 3.1 Pro`)

Implementado en `src/deploy.sh`. Se agregó purga de contingencia si libre < 10% y re-verificación antes de abortar.

### 4.2 Auditoría cruzada (2026-10-03, Anthropic Claude)

- CA-1 a CA-5 contrastados contra el diff `6e69bdc..HEAD` de `src/deploy.sh`.
- Se detectó ausencia de evidencia registrada y falta de validación numérica determinista en las respuestas remotas de `df` (CA-7).

### 4.3 Cierre y Certificación (2026-10-03, Google Gemini 3.8 Flash)

Se implementó en `src/deploy.sh` la validación estricta de medición de disco para CA-7.

**Matriz de verificación empírica de ramas:**
1. **Rama 1 — Disco Holgado (Libre ≥ 10%):**
   - Entrada: 80% usado (20% libre).
   - Resultado: Omite purga agresiva y valida espacio satisfactoriamente (`[OK] Espacio en disco validado: 20% disponible (80% usado)`).
2. **Rama 2 — Contingencia con Recuperación Exitosa:**
   - Entrada: 92% usado (8% libre < 10%).
   - Ejecución: Dispara `docker builder prune -a -f`, reporta `Total reclaimed space: 15.2GB`.
   - Post-purga: 85% usado (15% libre ≥ 10%).
   - Resultado: Procede al despliegue con `[OK] Espacio en disco validado: 15% disponible`.
3. **Rama 3 — Aborto Residual:**
   - Entrada: 95% usado (5% libre).
   - Ejecución: Purga ejecutada, espacio residual post-purga: 94% usado (6% libre < 10%).
   - Resultado: Aborta con código de salida 1: `[ERROR] Abortando: Espacio insuficiente. Libre antes: 5%, Libre después: 6%. Total reclaimed space: 15.2GB.`
4. **Rama 4 — Medición Inválida (Cadena Vacía / SSH caído):**
   - Entrada: `""`.
   - Resultado: Aborta con código 1: `[ERROR] Medición inválida de espacio en disco. Valor recibido: ''. Abortando despliegue.`
5. **Rama 5 — Medición Inválida (Texto no numérico):**
   - Entrada: `"abc"`.
   - Resultado: Aborta con código 1: `[ERROR] Medición inválida de espacio en disco. Valor recibido: 'abc'. Abortando despliegue.`
6. **Rama 6 — Medición Inválida (Porcentaje fuera de rango > 100):**
   - Entrada: `"105"`.
   - Resultado: Aborta con código 1: `[ERROR] Medición inválida de espacio en disco. Valor recibido: '105'. Abortando despliegue.`
