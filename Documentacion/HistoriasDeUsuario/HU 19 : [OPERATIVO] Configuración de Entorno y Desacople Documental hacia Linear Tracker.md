---
document_id: PBI-BX-LINEAR-CONFIG-001
title: "[OPERATIVO] Configuración de Entorno y Desacople Documental hacia Linear Tracker"
format: markdown
version: "1.1.0"
created: "2026-10-01"
updated: "2026-10-12"
status: "abierto"
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

- [ ] `.SddIA/.dev/.env` define `LINEAR_API_TOKEN`. El ejemplo de bóveda, si se versiona, nombra la variable vacía. El valor no está en git.
- [ ] `.SddIA/project.md` es `contract_version: "1.3.0"`, valida con el binding del Core y declara `tracker.done_gate: git`. No existe `.SddIA/config/linear-mapping.json` ni UUIDs de estado.
- [ ] `docs_layout.todos_pending` y `todos_done` (y el árbol de historias que use el índice inverso) apuntan a directorios que existen en este repo, o queda escrito el desvío y el inverso se considera no operativo hasta corregirlo.
- [ ] `Documentacion/HistoriasDeUsuario/` y `Documentacion/PBI/` no se archivan ni se vacían en esta HU.
- [ ] Una invocación `fetch_issue` del equipo BX no vuelca `LINEAR_API_TOKEN` en stdout ni en eventos.

#### 5. Fuera de alcance

- Activar `done_gate: linear` o `both` en BarcelonaXplorer.
- Webhook público de Linear.
- Borrar issues o administrar el workspace desde SddIA.
- Crear HU o PBI nuevos solo desde Linear (sin markdown local no hay alta).
- Mutar genoma del Core (`SddIA/`).
