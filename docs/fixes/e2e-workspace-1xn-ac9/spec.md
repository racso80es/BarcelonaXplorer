---
feature_name: e2e-workspace-1xn-ac9
fix_name: e2e-workspace-1xn-ac9
created: "2026-10-02"
process: bug-fix
base: main
scope: e2e-ac9-workspace-1xn-marker-md
branch_name: fix/e2e-workspace-1xn-ac9
persist_ref: /home/racso/Proyectos/BarcelonaXplorer/docs/fixes/e2e-workspace-1xn-ac9
pbi_ref: docs/todos/pending/[ARQUITECTURA] Workspace 1×N — ciclo bug-fix real sobre BarcelonaXplorer.md
project_slug: barcelonaxplorer
project_root: /home/racso/Proyectos/BarcelonaXplorer
execution_id: "0240cb08-3aca-4b8e-a103-06ec453be2fc"
correlation_id: "4b86fe0d-ba93-4c86-a91b-f8d2c0b4b91e"
plan_emitted: false
design_verdict: ok
agent: dedalo
---

# Spec — E2E AC-9 marcador `WORKSPACE_1XN_AC9_OK` en `marker.md`

## Ingesta

| Input | Estado | Nota |
|-------|--------|------|
| `objectives.md` | **Presente** bajo `persist_ref` | Consumido vía MCP. Misión: ciclo real piloto; PBI `PBI-ARQUITECTURA-BX-KALMA2-E2E`; AC-9 / §4.H F6. |
| `bug_summary` / semilla | Presente | «Inicia bug-fix fix_name e2e-workspace-1xn-ac9. Diseño: leer objectives.md vía MCP; escribir spec.md y marker.md (WORKSPACE_1XN_AC9_OK) solo vía sddia-workspace-server.» |
| `pbi_ref` | Presente | Paciente 0: `docs/todos/pending/[ARQUITECTURA] Workspace 1×N — ciclo bug-fix real sobre BarcelonaXplorer.md` (`document_id: PBI-ARQUITECTURA-BX-KALMA2-E2E`). |
| `project_slug` | `barcelonaxplorer` | Evento `Kalma2_Process_Requested` (`correlation_id`); mutación en jurisdicción del piloto. |
| `project_root` | Resuelto vía índice | `.SddIA/projects/barcelonaxplorer.md` → `/home/racso/Proyectos/BarcelonaXplorer`. |
| `active_norm_pack` | `features-documentation-pattern` | Cascada mínima: este `spec.md`; Tekton → `implementation.md` + `execution.md`; Argos → `validacion.md` (mismo `persist_ref`). |
| `fix_name` | `e2e-workspace-1xn-ac9` | Path de producto bajo el piloto = este directorio. |

## Problema / objetivo

Demostrar AC-9 (Workspace 1×N): un `bug-fix` orquestado desde Kalma2 de Paciente 0 modifica un fichero del piloto BarcelonaXplorer vía MCP/jurisdicción de proyecto. El cambio pedido es **una sola línea** en `{project_root}/docs/fixes/e2e-workspace-1xn-ac9/marker.md` con timestamp UTC y el literal `WORKSPACE_1XN_AC9_OK`.

Este ciclo no añade superficie de producto: prueba juntas las entregas previas (registry, fs-manager, workspace server, agent-runtime MCP, project slug, software_forge gate).

## Alcance (producto)

| ID | Entrega |
|----|---------|
| F1 | En el árbol del piloto (`project_slug: barcelonaxplorer`), asegurar el directorio `docs/fixes/e2e-workspace-1xn-ac9/` y el fichero `marker.md` (crear si no existen). |
| F2 | Añadir **exactamente una** línea que contenga un timestamp UTC (ISO-8601 con `Z`) y el literal `WORKSPACE_1XN_AC9_OK`. |
| F3 | No mutar genoma SddIA ni código app del piloto; diff de producto limitado a `marker.md` (+ artefactos de cascada bajo este `persist_ref`). |

### Formato canónico de la línea

```text
<ISO-8601-UTC> WORKSPACE_1XN_AC9_OK
```

Ejemplo (valores de este ciclo):

```text
2026-10-02T08:14:15Z WORKSPACE_1XN_AC9_OK
```

Opcional de trazabilidad (no sustituye el token obligatorio):

```text
2026-10-02T08:14:15Z WORKSPACE_1XN_AC9_OK correlation_id=4b86fe0d-ba93-4c86-a91b-f8d2c0b4b91e
```

- Si `marker.md` ya existe: **append** al final (nueva línea; no reescribir el resto).
- Si no existe: crear el fichero con esa única línea (más newline final).
- Idempotencia: si ya hay una línea con el mismo `correlation_id` (o idéntica línea completa del ciclo), no duplicar; si hay marcador de otro ciclo, append permitido.

### Nota de fase Diseño (semilla vigente)

La semilla de este `execution_id` pide a Dedalo materializar `spec.md` **y** `marker.md` vía `sddia-workspace-server` en Diseño. Tekton sigue siendo responsable de `implementation.md` / `execution.md` y del cierre git; no debe reescribir el marcador si ya contiene la línea de este `correlation_id`.

### Nota respecto a ciclos hermanos

Ciclos previos del mismo AC-9 usaron `persist_ref` bajo Paciente 0 o nombres de fix derivados del prompt. **Este ciclo** fija `persist_ref` absoluto en el piloto y `branch_name: fix/e2e-workspace-1xn-ac9`. Destino de producto: `docs/fixes/e2e-workspace-1xn-ac9/marker.md`, token `WORKSPACE_1XN_AC9_OK`. Tekton **no** debe mutar `docs.md` ni otros marcadores históricos.

## Fuera de alcance

- Crear o editar PBI bajo `docs/todos/**` (RBAC KM: solo Cúmulo / `Kaizen_Alert_Required`). El archivo del PBI a `done/` es cierre Argos/forja, no diseño.
- Blueprint de proceso nuevo → **`plan.md` no emitido** (`bug-fix` ya es el proceso vivo; cambio documental trivial).
- Encender IDEs; AC-9 asume runtime headless (`SDDIA_AGENT_RUNTIME_COMMAND`).
- Opt-in/revierte de `software_forge` en perfil Paciente 0 (R-E2E-1): operación de entorno, no diseño de este fix.
- Reparar divergencias git del piloto; jurisdicción `skill:git-manager` en ejecución.

## Criterios de aceptación (para Tekton / Argos)

| ID | Criterio | Origen |
|----|----------|--------|
| CA-1 | Existe `{project_root}/docs/fixes/e2e-workspace-1xn-ac9/marker.md` en BarcelonaXplorer. | Semilla / AC-9 |
| CA-2 | El fichero contiene una línea con timestamp UTC (ISO-8601 `Z`) y el literal `WORKSPACE_1XN_AC9_OK`. | Semilla / AC-9 |
| CA-3 | Diff de producto del piloto limitado a ese `marker.md` (+ cascada bajo este `persist_ref`). | R-E2E / F3 |
| CA-4 | Escritura vía jurisdicción del proyecto (`project_slug` / Workspace MCP / `tools/call` auditados); no `cwd` Core ni `--add-dir` improvisado. | R-E2E-3 |
| CA-5 | Cascada documental: `implementation.md` + `execution.md` + `validacion.md` con frontmatter norma bajo `persist_ref`. | Norm pack |
| CA-6 | Git del piloto solo vía `skill:git-manager`; rama `fix/e2e-workspace-1xn-ac9`; cierre según `delivery_mode` del manifiesto. | Ley / R-E2E-4 |
| CA-7 | `validacion.md`: `global: APTO` solo con evidencia real (commit/PR BX + telemetría); sin inventar éxito. | R-E2E-6 / AC-9 |

## Mandato a Tekton

1. Resolver `project_root` vía `.SddIA/projects/barcelonaxplorer.md` (Cúmulo / índice); no inventar rutas fuera de topología.
2. Si `marker.md` ya cumple CA-1/CA-2 para este `correlation_id`, no duplicar; si falta, aplicar F1–F2 vía MCP/`skill:filesystem-manager` en jurisdicción `barcelonaxplorer`.
3. Registrar touchpoints en `implementation.md` / `execution.md` bajo este `persist_ref`.
4. Git del piloto solo vía `skill:git-manager` / `./sddia-run.sh --tool git-manager` (rama `branch_name` del ciclo). Preferir evidencia JSON del skill; no bypass Shell IDE destructivo.
5. **Prohibido** escribir bajo `docs/todos/` (Paciente 0 o piloto).
6. Si no puede materializar o cerrar git en el piloto (MCP/jurisdicción bloqueada), documentar `blocked` en `execution.md` sin inventar APTO.

## Mandato a Argos

- Verificar CA-1..CA-7 contra el árbol del piloto + cascada en `persist_ref`.
- Comprobar correlación `Raw_Execution_Finished` del diff (AC-4 cierre) cuando haya telemetría.
- `pbi_archived: true` solo si el PBI queda en `docs/todos/done/` en Paciente 0 con evidencia; si permanece en `pending/` → `pbi_archived: false` y gate coherente (sin inventar cierre).
- AC-1 cierre: `rg` sin `project_root` literal en UI/payload de agente.

## Blueprint

No aplica. `plan_emitted: false`.
