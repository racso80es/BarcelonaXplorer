---
document_id: PBI-BX-LINEAR-CONFIG-001
title: "[OPERATIVO] Configuración de Entorno y Desacople Documental hacia Linear Tracker"
format: markdown
version: "1.1.0"
created: "2026-10-01"
updated: "2026-10-13"
status: "cerrada"
priority: alta
process: infrastructure
aligns_with:
  - "SddIA HU-LINEAR-DIRECT-CYCLE (cerrada, PR #335)"
  - "SddIA HU-LINEAR-SSOT-INVERSE (cerrada, PR #336–#341)"
  - "SddIA/library/codexes/codex-software-engineering/contracts/project-config-contract.md 1.3.0"
related:
  - .SddIA/project.md
  - .SddIA/.dev/.env
---

### [OPERATIVO] Configuración de Entorno y Desacople Documental hacia Linear Tracker

#### 1. Descripción

**Como** Vértice Biológico y operador de BarcelonaXplorer,
**quiero** declarar el tracker Linear en el manifiesto del proyecto y guardar el secreto solo en la bóveda,
**para** que la cápsula `linear-tracker-adapter` y los procesos ya forjados en SddIA (`forge-pbi`, `refine-hu`, `tracker-stamp`, `linear-bridge-watcher`, `tracker-markdown-apply`) operen sobre este repositorio sin un mapa de estados paralelo.

La serie Linear de SddIA está cerrada. Esta HU solo configura la instancia BX. No reabre genoma del Core.

#### 2. Lo que el Core ya exige (no se reinventa)

| Pieza | SSOT |
|-------|------|
| Secreto | `LINEAR_API_TOKEN` en la bóveda (`env_ref`). Precedencia: entorno del proceso, luego `.SddIA/.dev/.env` del proyecto. Prohibido en el manifiesto y en cualquier envelope. `LINEAR_API_KEY` no es el nombre. |
| Equipo | `tracker.team_key` (identificador Linear, p. ej. `BX`). Linear asigna `BX-n`. Una label no es un prefijo. |
| Estados | `tracker.state_map`: clave canónica → **nombre** del `WorkflowState` (`backlog`, `todo`, `in_progress`, `in_review`, `done`, `cancelled`). No se guardan UUIDs de GraphQL. |
| Labels | `tracker.labels.*` (`hu`, `pbi`, `fix`, `kaizen`, `deuda`, `spike`, `editable`). `editable` (default `sddia-editable`) es el único opt-in para que Linear reescriba el cuerpo del markdown. |
| Gate de Done | `tracker.done_gate` ∈ `git` \| `linear` \| `both`. Default `git`. |
| Réplica | El markdown local no se poda. Con sincronización inversa, Linear puede ser fuente de requerimientos y el fichero queda como réplica (`tracker-markdown-apply`, rama `tracker-sync/{slug}`). |

`done_gate: linear` en el primer ciclo real quedó reservado a Core-self y **no está activado**: el índice del Core no tiene manifiesto del propio SddIA. BarcelonaXplorer entra con `done_gate: git`. Pasar este proyecto a `linear` o `both` es un laudo posterior, fuera de esta HU.

#### 3. Trabajo en esta instancia

1. En Linear, equipo del proyecto (clave prevista `BX`) con los seis estados canónicos y las labels de arriba.
2. Personal API key en `.SddIA/.dev/.env` como `LINEAR_API_TOKEN`. No commitear el valor.
3. Subir `.SddIA/project.md` de `contract_version` `1.1.0` a `1.3.0` y añadir el bloque `tracker` (`provider: linear`, `team_key`, `state_map`, `labels`, `done_gate: git`). Sin secretos.
4. Alinear `docs_layout` con los árboles reales que el apply debe resolver. Hoy el manifiesto apunta a `docs/todos/pending|done` y el corpus vivo está en `Documentacion/HistoriasDeUsuario/` y `Documentacion/PBI/`. Hasta que esas rutas coincidan, el inverso no encuentra ficheros (`warn` no-op, no crea PBI desde Linear).
5. Prueba de vida: `fetch_issue` sobre un issue del equipo (mock o token real) devuelve `issue_ref` sin filtrar el token. Un prompt Kalma2 de lectura es comprobación de superficie, no sustituye el contrato de la cápsula.

#### 4. Criterios de aceptación

- [x] `.SddIA/.dev/.env` define `LINEAR_API_TOKEN`. El ejemplo de bóveda, si se versiona, nombra la variable vacía. El valor no está en git.
- [x] `.SddIA/project.md` es `contract_version: "1.3.0"`, valida con el binding del Core y declara `tracker.done_gate: git`. No existe `.SddIA/config/linear-mapping.json` ni UUIDs de estado.
- [x] `docs_layout.todos_pending` y `todos_done` (y el árbol de historias que use el índice inverso) apuntan a directorios que existen en este repo, o queda escrito el desvío y el inverso se considera no operativo hasta corregirlo.
- [x] `Documentacion/HistoriasDeUsuario/` y `Documentacion/PBI/` no se archivan ni se vacían en esta HU.
- [x] Una invocación `fetch_issue` del equipo BX no vuelca `LINEAR_API_TOKEN` en stdout ni en eventos.

#### 5. Fuera de alcance

- Activar `done_gate: linear` o `both` en BarcelonaXplorer.
- Webhook público de Linear.
- Borrar issues o administrar el workspace desde SddIA.
- Crear HU o PBI nuevos solo desde Linear (sin markdown local no hay alta).
- Mutar genoma del Core (`SddIA/`).

#### 6. PBIs

| Orden | ID | Corte |
| --- | --- | --- |
| 1 | [PBI-BX-LINEAR-003](../PBI/Realizado/PBI%20-%20Manifiesto%20Tracker%201.3.0%20y%20Alineaci%C3%B3n%20de%20docs_layout%20%28P1%29.md) | `project.md` a `1.3.0`: `tracker` con `done_gate: git` y `docs_layout` hacia directorios reales. El inverso queda no operativo, por escrito. |
| 1 | [PBI-BX-LINEAR-002](../PBI/Realizado/PBI%20-%20B%C3%B3veda%20LINEAR_API_TOKEN%20sin%20Valor%20en%20Git%20%28P1%29.md) | `LINEAR_API_TOKEN` en `.SddIA/.dev/.env`. El ejemplo versionado lleva la variable vacía. |
| 2 | [PBI-BX-LINEAR-001](../PBI/Realizado/PBI%20-%20Equipo%20Linear%20BX%20con%20Estados%20y%20Labels%20Can%C3%B3nicos%20%28P1%29.md) | Equipo `BX`, seis estados y siete labels. Acto en Linear, sin diff y sin UUIDs. |
| 3 | [PBI-BX-LINEAR-004](../PBI/Realizado/PBI%20-%20Prueba%20de%20Vida%20fetch_issue%20sin%20Filtrar%20el%20Token%20%28P1%29.md) | `fetch_issue` devuelve `issue_ref` y no vuelca el token. |

003 y 002 forjados y validados. 001 configurado en Linear con estados y labels canónicos. 004 validado con prueba de vida exitosa. HU completada.

