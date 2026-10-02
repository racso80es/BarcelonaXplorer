---
feature_name: e2e-workspace-1xn-ac9
fix_name: e2e-workspace-1xn-ac9
created: "2026-10-02"
process: bug-fix
phase: Diseño del fix
base: main
scope: e2e-ac9-reargos-idempotent-validacion-bridge
branch_name: fix/e2e-workspace-1xn-ac9
persist_ref: /home/racso/Proyectos/BarcelonaXplorer/docs/fixes/e2e-workspace-1xn-ac9
pbi_ref: docs/todos/pending/[ARQUITECTURA] Workspace 1×N — ciclo bug-fix real sobre BarcelonaXplorer.md
project_slug: barcelonaxplorer
project_root: /home/racso/Proyectos/BarcelonaXplorer
correlation_id: "7e7f6c84-be03-424c-a786-57a9dabb8e1b"
plan_emitted: false
design_verdict: ok
agent: dedalo
mode: reargos_idempotent
anchor_commit: "847d3ee"
prior_cycles:
  - correlation_id: "4b86fe0d-ba93-4c86-a91b-f8d2c0b4b91e"
    role: producto_inicial
  - correlation_id: "130bf443-617b-469a-84df-356934e66f2b"
    role: reintento_evidence_bridge_branch_pr
    commit: "fac64f4"
    pr: "https://github.com/racso80es/BarcelonaXplorer/pull/2"
---

# Spec — E2E AC-9 Re-Argos idempotente (sin cascada duplicada)

## Ingesta

| Input | Estado | Nota |
|-------|--------|------|
| `objectives.md` | **Presente** | Consumido vía MCP. Misión: ciclo real piloto; PBI `PBI-ARQUITECTURA-BX-KALMA2-E2E`; AC-9 / §4.H F6. |
| Semilla (este `execution_id`) | Presente | «Re-Argos AC-9 idempotente: `validacion.md` coherente con último Runtime evidence (machine) APTO; Diseño y Ejecución sin duplicar cascada; rama `fix/e2e-workspace-1xn-ac9` commit `847d3ee`.» |
| `pbi_ref` | Fuera de jurisdicción piloto | Path en Paciente 0; `docs/todos/**` **no existe** en BX (`fs_list` → ENOENT). No reescribir KM desde Dedalo/Tekton/Argos. |
| Cascada previa | Materializada | `spec`/`marker`/`implementation`/`execution`/`validacion` bajo `persist_ref`. |
| `validacion.md` (ciclo 130bf443…) | `global: APTO` | Producto CA-1..CA-8 + bridge session APTO; PR #2; `pbi_archived: false`. |
| Último Runtime evidence (machine) en handoff | **APTO** | `materialized_at: 2026-10-02T09:22:32Z`; `TECH_FORMAL_EXECUTE_PROCESS: APTO`; `GIT_EVIDENCE_VIA_GIT_MANAGER: APTO`; `git_manager_invoked: true`; `notes: handoff-formal-scan`. |
| Ancla git (semilla) | `847d3ee` | Rama `fix/e2e-workspace-1xn-ac9` (supersede narrativa `fac64f4` del reintento bridge si el tip avanzó). |
| `active_norm_pack` | `features-documentation-pattern` | Este ciclo: **solo** alinear Diseño → mandato Re-Argos; **no** reabrir Ejecución de producto. |

## Problema / objetivo (Re-Argos idempotente)

El producto AC-9 **ya está cerrado** en el piloto:

```text
2026-10-02T08:14:15Z WORKSPACE_1XN_AC9_OK correlation_id=4b86fe0d-ba93-4c86-a91b-f8d2c0b4b91e
2026-10-02T08:30:00Z WORKSPACE_1XN_AC9_OK correlation_id=130bf443-617b-469a-84df-356934e66f2b
```

Cascada Tekton (`implementation.md` / `execution.md`) y cierre `branch_pr` (PR #2) **existen**. El último bloque machine del handoff declara bridge **APTO**. Este ciclo **no añade superficie** ni re-ejecuta F1–F5: es un **Re-Argos idempotente** para que `validacion.md` quede **coherente** con esa evidencia machine APTO y con el tip `847d3ee`, sin duplicar cascada de Diseño/Ejecución.

## Alcance (este ciclo)

| ID | Entrega |
|----|---------|
| D1 | Actualizar **este** `spec.md` (Dedalo) con `execution_id`/`correlation_id` actuales y mandato Re-Argos. |
| D2 | **No** emitir `plan.md` (`plan_emitted: false`; sin blueprint). |
| D3 | **No** reescribir `marker.md` (CA-1/CA-2 ya cumplidos; sin append F2). |
| D4 | **Prohibido duplicar cascada:** Tekton **no** debe reescribir `implementation.md` / `execution.md` ni re-correr commit/push/PR salvo que Argos detecte incoherencia bloqueante documentada. |
| D5 | Argos: re-leer `validacion.md` + último `### Runtime evidence (machine)` APTO; alinear frontmatter/`global`/checks/git_changes/branch con evidencia real (incl. commit ancla `847d3ee` si es el tip citado por semilla); **no inventar** APTO si el machine del turno actual revirtiera a NO_APTO. |
| D6 | Diff documental de este diseño: preferentemente solo `docs/fixes/e2e-workspace-1xn-ac9/spec.md` (+ `validacion.md` si Argos ajusta coherencia). |

## Fuera de alcance

- Blueprint / `plan.md`.
- Nueva línea en `marker.md` o token de producto adicional.
- Re-ejecución Tekton de F4/F5 (git-manager commit/push/PR) **salvo** bloqueo real de coherencia.
- Escritura bajo `docs/todos/**` (RBAC KM: Cumulo / `Kaizen_Alert_Required`).
- Inventar `GIT_EVIDENCE_VIA_GIT_MANAGER: APTO` o `global: APTO` sin bloque machine / session bridge real.
- Mutar genoma SddIA o app piloto fuera de este `persist_ref`.

## Criterios de aceptación (Re-Argos)

| ID | Criterio | Origen |
|----|----------|--------|
| CA-1 | Existe `marker.md` con literal `WORKSPACE_1XN_AC9_OK` (histórico intacto). | AC-9 / idempotencia |
| CA-2 | Cascada previa presente: `implementation.md` + `execution.md` + `validacion.md` **sin** reescritura Tekton en este ciclo. | Semilla «sin duplicar cascada» |
| CA-3 | Último Runtime evidence (machine) con `TECH_FORMAL_EXECUTE_PROCESS: APTO` ∧ `GIT_EVIDENCE_VIA_GIT_MANAGER: APTO`. | Semilla Re-Argos |
| CA-4 | `validacion.md` coherente con ese machine APTO (`global: APTO` solo si machine/session lo respaldan). | Semilla |
| CA-5 | Rama `fix/e2e-workspace-1xn-ac9`; tip/ancla citada `847d3ee` (o digest enlazable equivalente) en `validacion.md` / git_changes. | Semilla |
| CA-6 | Escrituras vía MCP `sddia-workspace-server` / jurisdicción `barcelonaxplorer`. | R-E2E-3 |
| CA-7 | `pbi_archived` coherente con Paciente 0 (si PBI sigue en `pending/` → `false`). | R-E2E-6 |
| CA-8 | Dedalo de este ciclo **no** emite `plan.md`; no duplica marcador. | Diseño |

## Mandato a Tekton (Ejecución)

1. **Idempotente / no-op de producto:** si `marker.md` + `implementation.md` + `execution.md` ya cumplen el ciclo previo APTO, **no** reescribir cascada ni append al marcador.
2. No invocar `skill:git-manager` commit/push/PR **a menos** que Argos o el runtime exijan un diff mínimo (p.ej. solo este `spec.md`) y el Evidence Bridge deba registrar invocación — preferir no tocar git si no hay cambios de producto.
3. Si la fase Ejecución se dispara igual: documentar en `execution.md` un apéndice breve `reargos_idempotent: skipped_cascade` **sin** borrar el historial del ciclo `130bf443…` (append-only o nota; no reset).
4. **Prohibido** escribir bajo `docs/todos/`.

## Mandato a Argos (Verificación — foco de este ciclo)

1. Copiar el **último** `### Runtime evidence (machine)` del handoff (o session bridge del turno) sin reinventar stdout.
2. Verificar coherencia: `validacion.md` ↔ machine APTO ↔ ancla `847d3ee` / PR #2 / CA-1..CA-7 previos.
3. Si `validacion.md` ya está `global: APTO` y alineada con machine APTO + tip semilla → **confirmar idempotente** (actualizar solo `correlation_id`/`execution_id` de este turno si el norm pack lo exige; no degradar a NO_APTO por ruido de ciclos antiguos `git_manager_invoked: false` ya supersedidos).
4. Si machine del **turno actual** fuera `NO_APTO` → `global: NO_APTO` / `verdict: blocked` sin inventar éxito.
5. `pbi_archived: true` solo con PBI en `docs/todos/done/` (Paciente 0); si permanece `pending/` → `false`.

## Blueprint

No aplica. `plan_emitted: false`.
