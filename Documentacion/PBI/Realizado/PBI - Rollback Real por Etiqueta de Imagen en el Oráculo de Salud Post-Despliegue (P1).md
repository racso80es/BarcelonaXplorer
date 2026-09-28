# [OPERATIVO] Documento Destilado: PBI - Rollback Real por Etiqueta de Imagen en el Oráculo de Salud Post-Despliegue

**Identificador:** PBI-STEEL-008
**Estatus:** Realizado (2026-09-28) — CA-5 pendiente de ejecución en entorno no productivo
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-09
**Módulo:** IaaC — Ansistrano y Docker Compose
**Entorno:** `ansible/hooks/after_symlink.yml`, `src/docker-compose.yml`, `ansible/rollback.yml`
**Prioridad:** Alta (P1 — la red de seguridad del despliegue no funciona)
**Estimación Táctica:** 2 Story Points
**Depende de:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** El bloque `rescue` del Oráculo de Salud conmuta el symlink a la release anterior y levanta `docker compose up -d` sin reconstruir. Como la imagen siempre se llama `barcelonaxplorer-web`, vuelve a levantar la imagen recién construida, es decir, la defectuosa.
- **Entorno:** Hook `after_symlink` (build + convergencia + oráculo de salud + rescate) y servicio `web` del Compose sin `image:`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Cada release produce una imagen con etiqueta propia.
  - *Filtro B:* El rescate apunta a la etiqueta anterior, no a "la última".
  - *Filtro C:* El rescate se prueba fuera de producción antes de darlo por válido.

---

## 1. Declaración de Intención (INVEST)

**Como** operador del Nodo 11,
**Quiero** que el rollback automático restaure la imagen de la release anterior,
**Para** que un despliegue que no supera el Oráculo de Salud deje el servicio como estaba y no en el estado roto.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Etiqueta por release):** el servicio `web` declara `image: barcelonaxplorer-web:${BX_RELEASE_TAG}` y el hook exporta `BX_RELEASE_TAG` con el identificador de la release de Ansistrano (o el SHA corto del commit).
- [x] **CA-2 (Rescate por etiqueta):** el `rescue` obtiene la etiqueta de la release anterior (guardada en un fichero de la propia release, p. ej. `.bx_release_tag`) y levanta el servicio con esa etiqueta sin reconstruir. Si la imagen anterior no existe, reconstruye desde la release anterior antes del `up -d`.
- [x] **CA-3 (Retención):** se conservan al menos las imágenes de las 2 últimas releases. Las tareas de poda existentes (`docker builder prune`) no eliminan imágenes etiquetadas en uso por esas releases.
- [x] **CA-4 (Rollback manual coherente):** `ansible/rollback.yml`, que reutiliza el hook completo, sigue funcionando con el esquema de etiquetas.
- [ ] **CA-5 (Prueba del rescate):** en un entorno no productivo se despliega una release que falla el Oráculo de Salud a propósito y se verifica que el contenedor final ejecuta la imagen de la release anterior (`docker inspect` de la imagen del contenedor). Evidencia en la sección 4.
- [x] **CA-6 (YAML canónico):** los cambios siguen el [`Estandar-Formato-Configuracion.yml`](../../../.SddIA/library/norms/Estandar-Formato-Configuracion.yml), con comentarios semánticos de axioma.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **Evidencia:** `docker ps` en el Nodo 11 muestra la imagen `barcelonaxplorer-web` sin etiqueta de versión; `src/docker-compose.yml` no declara `image:` para `web` (líneas 12-16); el `rescue` de `after_symlink.yml` ejecuta `docker compose ... up -d --remove-orphans` sin `build`.
- **`ansible/rollback.yml` no tiene el defecto:** reutiliza el hook completo, que empieza por `build web`, y reconstruye desde la release anterior. El problema es solo el rescate automático.
- **Coste en disco:** conservar dos imágenes adicionales ocupa espacio. En la auditoría el Nodo 11 tenía 49 GB libres (30 % usado), por lo que el umbral de 3 GB del playbook no se ve comprometido.
- **Coherencia con PBI‑OPS‑HEALTHCHECK‑MONITOR‑001:** ese PBI introdujo el Oráculo de Salud y el rescate; este PBI corrige su efecto, no su detección.

---

## 4. Evidencia de Certificación

- `src/docker-compose.yml`: `image: barcelonaxplorer-web:${BX_RELEASE_TAG:-local}`.
- `ansible/hooks/after_symlink.yml`: persiste `.bx_release_tag`, build/up con etiqueta; rescate lee etiqueta previa y reconstruye si la imagen falta.
- **CA-5 (operativo):** simulacro de fallo del oráculo en staging/Nodo 11 pendiente de registro (`docker inspect` post-rescate).
