---
document_id: PBI-BX-LINEAR-003
uuid: "b759adac-67eb-4252-871c-00acdcddedec"
title: "[OPERATIVO] Manifiesto tracker 1.3.0 y alineación de docs_layout"
status: done
process: feature
created: "2026-10-13"
project_slug: barcelonaxplorer
historia_ref: "Documentacion/HistoriasDeUsuario/HU 19 : [OPERATIVO] Configuración de Entorno y Desacople Documental hacia Linear Tracker.md"
priority: alta
---

# [OPERATIVO] PBI - Manifiesto Tracker 1.3.0 y Alineación de docs_layout

**Identificador:** PBI-BX-LINEAR-003
**Ref. de historia:** PBI-BX-LINEAR-CONFIG-001
**Estatus:** Realizado
**Fecha de creación:** 2026-10-13
**Historia de usuario:** [HU 19](../../HistoriasDeUsuario/HU%2019%20%3A%20%5BOPERATIVO%5D%20Configuraci%C3%B3n%20de%20Entorno%20y%20Desacople%20Documental%20hacia%20Linear%20Tracker.md) · §3.3, §3.4 y criterios 2 a 4
**Prioridad:** Alta (P1)
**Estimación táctica:** 3 story points
**Depende de:** ninguno para el diff. Los nombres de estado los consume [PBI-BX-LINEAR-001](./PBI%20-%20Equipo%20Linear%20BX%20con%20Estados%20y%20Labels%20Can%C3%B3nicos%20%28P1%29.md).
**Bloquea:** [PBI-BX-LINEAR-004](./PBI%20-%20Prueba%20de%20Vida%20fetch_issue%20sin%20Filtrar%20el%20Token%20%28P1%29.md)

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Subir el manifiesto a `contract_version` `1.3.0`, declarar `tracker` con `done_gate: git` y apuntar `docs_layout` a directorios que existen. El desvío del inverso se escribe en el cuerpo del manifiesto.
- **Entorno:** Un solo fichero, [`.SddIA/project.md`](../../../.SddIA/project.md). Si falta `docs/features`, se crea el directorio vacío. No se mueve el corpus.
- **Entropía asimilada:**
  - *Filtro A (Mismo artefacto):* `tracker` y `docs_layout` viven en el frontmatter de `project.md`. Van en un solo corte para no dejar un manifiesto a medias.
  - *Filtro B (El inverso no lee el layout):* `tracker-markdown-apply` recorre cuatro rutas fijas y no consulta `docs_layout`. Alinear el layout no hace operativo el inverso. El criterio de la HU admite dejar el desvío escrito.
  - *Filtro C (Corpus quieto):* `Documentacion/HistoriasDeUsuario/` y `Documentacion/PBI/` no se archivan, no se vacían y no se duplican bajo `docs/todos/`.

---

## 1. Declaración de intención (INVEST)

**Como** operador de BarcelonaXplorer,
**quiero** el bloque `tracker` en el manifiesto 1.3.0 y un `docs_layout` que señale árboles reales,
**para** que el binding del Core acepte el proyecto y quede escrito por qué el inverso aún no resuelve ficheros.

---

## 2. Hechos que fijan el diseño

1. El manifiesto vigente es `contract_version: "1.1.0"`, sin `tracker`. `docs_layout` apunta a `docs/features` (no existe), `docs/fixes` (existe), `docs/todos/pending` y `docs/todos/done` (no existen).
2. El corpus vivo está en `Documentacion/HistoriasDeUsuario/`, `Documentacion/PBI/Pendiente/` y `Documentacion/PBI/Realizado/`.
3. El validador (`validate_tracker_config`) exige `provider: linear`, `team_key` no vacío, claves de `state_map` dentro de las seis canónicas, labels no vacías si se declaran, y `done_gate` ∈ `git` | `linear` | `both`. Prohíbe secretos `LINEAR_*` en el manifiesto. No exige que el directorio de `docs_layout` exista: eso lo exige el criterio de esta HU.
4. `scan_tracker_markdowns` recorre solo `docs/todos/pending`, `docs/todos/done`, `docs/todos/historias` y `Documentacion/PBI/Realizado`. `resolve_hu_ref_by_tracker` solo mira `docs/todos/historias`.
5. `forge-pbi` rechaza `historia_ref` si la ruta no contiene la subcadena `historias` en minúsculas. `HistoriasDeUsuario` no la contiene. Parchear ese predicado es mutar el Core, fuera de esta HU.
6. `done_gate: linear` y `both` quedan fuera. Este proyecto entra con `git`.

---

## 3. Corte

### Frontmatter

Se conservan `id`, `uuid`, `git_remote`, `default_branch`, `delivery_mode`, `codex_slug`, `env_ref`, `mcp` y `qa_gates`. `contract_version` pasa a `"1.3.0"`. Se inserta `tracker` y se sustituye `docs_layout` por:

```yaml
tracker:
  provider: linear
  team_key: BX
  state_map:
    backlog: Backlog
    todo: Todo
    in_progress: In Progress
    in_review: In Review
    done: Done
    cancelled: Cancelled
  labels:
    hu: hu
    pbi: pbi
    fix: fix
    kaizen: kaizen
    deuda: deuda
    spike: spike
    editable: sddia-editable
  done_gate: git
docs_layout:
  features: docs/features
  fixes: docs/fixes
  todos_pending: Documentacion/PBI/Pendiente
  todos_done: Documentacion/PBI/Realizado
```

No se añade `project_id`. No se crea `.SddIA/config/linear-mapping.json`. Ningún valor de `state_map` es un UUID.

`docs/features` se crea vacío si no existe, para que las cuatro rutas del layout resuelvan a un directorio. No se le copia contenido.

### Cuerpo del manifiesto

Debajo del título se añade este desvío, para que el siguiente operador no «corrija» el layout moviendo el corpus:

> `docs_layout.todos_pending` y `todos_done` apuntan a directorios que existen. `tracker-markdown-apply` no lee `docs_layout`: recorre `docs/todos/pending`, `docs/todos/done`, `docs/todos/historias` y `Documentacion/PBI/Realizado`. El único camino que coincide con el corpus vivo es `Documentacion/PBI/Realizado`. `Documentacion/PBI/Pendiente` y `Documentacion/HistoriasDeUsuario/` quedan fuera de ese recorrido, y `forge-pbi` exige la subcadena `historias` en `historia_ref`. Esta HU no mueve ni vacía esos árboles y no parchea el Core. El inverso se considera no operativo para el alta y para resolver la HU padre hasta un laudo posterior. `done_gate` permanece `git`.

---

## 4. Criterios de aceptación

- [x] **CA-1 (Contrato):** `.SddIA/project.md` declara `contract_version: "1.3.0"`, `tracker.provider: linear`, `tracker.team_key: BX` y `tracker.done_gate: git`. El frontmatter no contiene `LINEAR_`, ni un fichero `linear-mapping.json`, ni un UUID en `state_map`.
- [x] **CA-2 (Layout real):** `docs_layout.todos_pending` es `Documentacion/PBI/Pendiente` y `todos_done` es `Documentacion/PBI/Realizado`. `docs/features` y `docs/fixes` existen como directorios. El binding del Core no responde `PROJECT_CONFIG_INVALID` sobre este manifiesto.
- [x] **CA-3 (Desvío):** el cuerpo del manifiesto contiene el párrafo de la sección 3. El inverso queda no operativo para Pendiente y para las historias, y así se lee en ese párrafo.
- [x] **CA-4 (Corpus quieto):** `Documentacion/HistoriasDeUsuario/` y `Documentacion/PBI/` conservan sus ficheros. No aparece un árbol nuevo `docs/todos/`.

---

## 5. Fuera de alcance

- Crear el equipo en Linear o la API key.
- Activar `done_gate: linear` o `both`.
- Añadir `Documentacion/PBI/Pendiente` o `Documentacion/HistoriasDeUsuario` al escáner del Core.
- Renombrar `HistoriasDeUsuario` para colar la subcadena `historias`.
- Symlinks `docs/todos/*` hacia `Documentacion/`. Sería un segundo corpus lógico; si el Vértice lo quiere, es otro laudo.
- Invocar `fetch_issue`.

---

## 6. Orden

Este corte y la bóveda pueden ir en paralelo. El equipo Linear tiene que acabar con los mismos nombres de esta tabla. La prueba de vida va después.

---

## 7. Resolución y Evidencias de Validación

- **Actualización de manifiesto:** `.SddIA/project.md` actualizado con `contract_version: "1.3.0"`, bloque `tracker` completo (`provider: linear`, `team_key: BX`, seis estados canónicos `state_map`, siete labels canónicas y `done_gate: git`). Cero variables secretas o UUIDs en frontmatter.
- **Alineación de rutas `docs_layout`:** `todos_pending` fijado a `Documentacion/PBI/Pendiente` y `todos_done` a `Documentacion/PBI/Realizado`. Creado directorio `docs/features/` preservando `docs/fixes/`.
- **Registro documental del desvío inverso:** Incorporado el párrafo explicativo en el cuerpo de `.SddIA/project.md` documentando la no operatividad del ciclo inverso para `Pendiente` e `HistoriasDeUsuario` sin mutar el genoma del Core.
- **Incolumidad del corpus:** `Documentacion/HistoriasDeUsuario/` y `Documentacion/PBI/` preservados íntegramente sin migraciones a `docs/todos/`.
