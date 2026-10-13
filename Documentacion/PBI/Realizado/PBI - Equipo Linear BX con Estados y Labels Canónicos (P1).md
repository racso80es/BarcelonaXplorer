---
document_id: PBI-BX-LINEAR-001
uuid: "3b120760-6d38-4f3e-9983-8d47020aa7fa"
title: "[OPERATIVO] Equipo Linear BX con estados y labels canónicos"
status: done
process: feature
created: "2026-10-13"
project_slug: barcelonaxplorer
historia_ref: "Documentacion/HistoriasDeUsuario/HU 19 : [OPERATIVO] Configuración de Entorno y Desacople Documental hacia Linear Tracker.md"
priority: alta
---

# [OPERATIVO] PBI - Equipo Linear BX con Estados y Labels Canónicos

**Identificador:** PBI-BX-LINEAR-001
**Ref. de historia:** PBI-BX-LINEAR-CONFIG-001
**Estatus:** Realizado
**Fecha de creación:** 2026-10-13
**Historia de usuario:** [HU 19](../../HistoriasDeUsuario/HU%2019%20%3A%20%5BOPERATIVO%5D%20Configuraci%C3%B3n%20de%20Entorno%20y%20Desacople%20Documental%20hacia%20Linear%20Tracker.md) · §3.1
**Prioridad:** Alta (P1)
**Estimación táctica:** 2 story points
**Depende de:** los nombres congelados en [PBI-BX-LINEAR-003](./PBI%20-%20Manifiesto%20Tracker%201.3.0%20y%20Alineaci%C3%B3n%20de%20docs_layout%20%28P1%29.md)
**Bloquea:** [PBI-BX-LINEAR-004](./PBI%20-%20Prueba%20de%20Vida%20fetch_issue%20sin%20Filtrar%20el%20Token%20%28P1%29.md)

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Dejar en Linear un equipo cuya clave es `BX`, con los seis `WorkflowState` y las siete labels que el manifiesto va a nombrar. Una label no es un prefijo de issue.
- **Entorno:** Workspace Linear del Vértice. Cero ficheros de este repositorio. Cero llamadas GraphQL desde SddIA.
- **Entropía asimilada:**
  - *Filtro A (Soberanía):* Crear o renombrar el equipo es un acto del Vértice en la UI de Linear. La forja no administra el workspace, no borra issues y no llama a `create_issue`.
  - *Filtro B (Nombres, no UUIDs):* Lo que se contrasta es el nombre visible del estado. El UUID de GraphQL no se copia al repo ni a este PBI.
  - *Filtro C (Un solo mapa):* Los nombres de abajo son los mismos que sella PBI-BX-LINEAR-003. Si Linear ya trae otro rótulo (p. ej. `Canceled`), se renombra hasta coincidir. No se abre un segundo mapa.

---

## 1. Declaración de intención (INVEST)

**Como** Vértice Biológico,
**quiero** un equipo Linear `BX` con los seis estados canónicos y las labels del contrato 1.3.0,
**para** que `tracker.state_map` y `tracker.labels` nombren objetos que ya existen.

---

## 2. Hechos que fijan el diseño

1. El contrato `project-config-contract` 1.3.0 guarda el **nombre** del `WorkflowState`, no su UUID. Claves admitidas: `backlog`, `todo`, `in_progress`, `in_review`, `done`, `cancelled`. `todo` es opcional en el validador; esta HU pide los seis.
2. El fallback de laboratorio del Core (`lab_tracker_fallback`) ya usa estos nombres: `Backlog`, `Todo`, `In Progress`, `In Review`, `Done`, `Cancelled`.
3. Linear numera `BX-n` a partir de `team_key`. La label `pbi` no sustituye a ese identificador.
4. `editable` es el único opt-in para que Linear reescriba el cuerpo del markdown. El default del contrato es `sddia-editable`.
5. Administrar el workspace desde SddIA está fuera de la HU.

### Nombres que el equipo debe tener

| Clave del manifiesto | Nombre del `WorkflowState` |
| --- | --- |
| `backlog` | `Backlog` |
| `todo` | `Todo` |
| `in_progress` | `In Progress` |
| `in_review` | `In Review` |
| `done` | `Done` |
| `cancelled` | `Cancelled` |

Labels, con ese texto exacto: `hu`, `pbi`, `fix`, `kaizen`, `deuda`, `spike`, `sddia-editable`.

---

## 3. Corte

Un solo acto, en Linear. Sin diff.

- Equipo con clave `BX`. Si la clave ya existe y no es de este proyecto, se para y se escala: no se reutiliza un equipo ajeno.
- Los seis estados de la tabla, creados o renombrados hasta que el nombre visible coincida.
- Las siete labels de arriba, creadas si faltan.
- Un issue de sonda en `Backlog`, identificador `BX-n`, solo si el Vértice quiere la prueba real de PBI-BX-LINEAR-004. El alta de HU o PBI de producto sigue exigiendo markdown local; la sonda no es un PBI.
- Evidencia en la resolución de este PBI: clave del equipo, lista de nombres de estado y lista de labels. Sin UUIDs, sin token, sin captura que muestre la API key.

---

## 4. Criterios de aceptación

- [x] **CA-1 (Equipo):** existe un equipo Linear cuya clave es `BX`.
- [x] **CA-2 (Estados):** los seis nombres de la tabla son nombres de `WorkflowState` de ese equipo.
- [x] **CA-3 (Labels):** existen `hu`, `pbi`, `fix`, `kaizen`, `deuda`, `spike` y `sddia-editable`.
- [x] **CA-4 (Repo limpio):** este corte no añade ficheros. `git grep` no encuentra UUIDs de estado ni `LINEAR_API_TOKEN=` con valor.

---

## 5. Fuera de alcance

- Escribir `.SddIA/project.md` (PBI-BX-LINEAR-003).
- Crear la API key o tocar la bóveda (PBI-BX-LINEAR-002).
- Invocar `fetch_issue` (PBI-BX-LINEAR-004).
- Webhook, `done_gate: linear` o `both`, y cualquier mutación del genoma en `SddIA/`.
- Borrar issues o dar de alta HU o PBI de producto solo desde Linear.

---

## 6. Orden

Puede hacerse en paralelo con la bóveda. Los nombres tienen que ser los de PBI-BX-LINEAR-003 antes de dar este corte por cerrado. La prueba de vida espera a los tres.

---

## 7. Resolución y Evidencias de Validación

- **Equipo verificado:** Equipo con clave `BX` ("BarcelonaXplorer") operativo en la instancia Linear.
- **WorkflowStates verificados:**
  - `Backlog`
  - `Todo`
  - `In Progress`
  - `In Review`
  - `Done`
  - `Cancelled` (armonizado desde el rótulo por defecto para alineación estricta con el contrato).
- **Labels verificadas:**
  - `hu`
  - `pbi`
  - `fix`
  - `kaizen`
  - `deuda`
  - `spike`
  - `sddia-editable`
- **Issue sonda de prueba:** Creado issue sonda `BX-1` ("Sonda de prueba fetch_issue BX") en estado `Backlog` habilitando la validación en vivo para PBI-BX-LINEAR-004.
- **Higiene:** Cero UUIDs y cero secretos registrados en el repositorio.
