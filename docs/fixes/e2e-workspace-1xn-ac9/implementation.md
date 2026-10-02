---
feature_name: e2e-workspace-1xn-ac9
fix_name: e2e-workspace-1xn-ac9
created: "2026-10-02"
process: bug-fix
phase: Ejecución
items:
  - id: F1
    action: verify_idempotent
    path: docs/fixes/e2e-workspace-1xn-ac9/marker.md
    summary: Marcador histórico correlation_id=4b86fe0d… intacto (CA-1/CA-2)
  - id: F2
    action: append
    path: docs/fixes/e2e-workspace-1xn-ac9/marker.md
    summary: Línea reintento correlation_id=130bf443-617b-469a-84df-356934e66f2b (diff fresco branch_pr)
  - id: F4
    action: git_evidence_bridge
    skill: git-manager
    summary: status/checkout/commit/push vía ./sddia-run.sh --tool git-manager (JSON stdin)
  - id: F5
    action: branch_pr
    branch_name: fix/e2e-workspace-1xn-ac9
    summary: Push origin + PR (shell-executor gh) o evidencia enlazable
  - id: reargos_idempotent
    action: skipped_cascade
    summary: Ciclo 7e7f6c84… — no-op producto; sin F1–F5 ni git mutante
correlation_id: "7e7f6c84-be03-424c-a786-57a9dabb8e1b"
prior_correlation_id: "130bf443-617b-469a-84df-356934e66f2b"
branch_name: fix/e2e-workspace-1xn-ac9
persist_ref: docs/fixes/e2e-workspace-1xn-ac9
pbi_ref: docs/todos/pending/[ARQUITECTURA] Workspace 1×N — ciclo bug-fix real sobre BarcelonaXplorer.md
project_slug: barcelonaxplorer
agent: tekton
mode: reargos_idempotent
anchor_commit: "847d3ee"
---

# Implementation — E2E AC-9 reintento Evidence Bridge + `branch_pr`

## Touchpoints (ciclo producto `130bf443…`)

| ID | Acción | Destino | Notas |
|----|--------|---------|-------|
| TP-1 | Verificar + append F2 | `docs/fixes/e2e-workspace-1xn-ac9/marker.md` | Histórico 4b86fe0d… + línea 130bf443… |
| TP-2 | Cascada documental | `implementation.md` + `execution.md` | Ciclo producto previo |
| TP-3 | Evidence Bridge git | `skill:git-manager` | Piloto `barcelonaxplorer`; no Core |
| TP-4 | Cierre `branch_pr` | rama `fix/e2e-workspace-1xn-ac9` | commit selectivo `persist_ref` → push → PR |

## Resolución de jurisdicción

| Campo | Valor |
|-------|-------|
| `project_slug` | `barcelonaxplorer` |
| `project_root` | `/home/racso/Proyectos/BarcelonaXplorer` (jurisdicción MCP; no Write IDE) |
| Diff producto | Solo `docs/fixes/e2e-workspace-1xn-ac9/**` |

## `skill_invocations` planificadas (ciclo producto — histórico)

### GIT-1 — status

```json
{
  "operation_type": "status",
  "repository_path": "/home/racso/Proyectos/BarcelonaXplorer",
  "operation_payload_json": {}
}
```

### GIT-2 — checkout

```json
{
  "operation_type": "checkout",
  "repository_path": "/home/racso/Proyectos/BarcelonaXplorer",
  "operation_payload_json": {
    "branch_name": "fix/e2e-workspace-1xn-ac9",
    "create_if_not_exists": true
  }
}
```

### GIT-3 — commit (persist_ref selectivo)

```json
{
  "operation_type": "commit",
  "repository_path": "/home/racso/Proyectos/BarcelonaXplorer",
  "operation_payload_json": {
    "message": "fix(e2e): AC-9 reintento Evidence Bridge + cascada Tekton correlation 130bf443",
    "files": [
      "docs/fixes/e2e-workspace-1xn-ac9/marker.md",
      "docs/fixes/e2e-workspace-1xn-ac9/spec.md",
      "docs/fixes/e2e-workspace-1xn-ac9/objectives.md",
      "docs/fixes/e2e-workspace-1xn-ac9/implementation.md",
      "docs/fixes/e2e-workspace-1xn-ac9/execution.md",
      "docs/fixes/e2e-workspace-1xn-ac9/validacion.md",
      "docs/fixes/e2e-workspace-1xn-ac9/_agent_handoff.md"
    ]
  }
}
```

### GIT-4 — push

```json
{
  "operation_type": "push",
  "repository_path": "/home/racso/Proyectos/BarcelonaXplorer",
  "operation_payload_json": {
    "remote": "origin",
    "branch": "fix/e2e-workspace-1xn-ac9",
    "force": false
  }
}
```

### PR-1 — apertura forja (fuera de git-manager)

Según `pull-request-orchestration.md`: `shell-executor` + `gh pr create` (o `delivery-close-cycle`). No enrutar `gh` por git-manager.

## Touchpoints — ciclo Re-Argos (`7e7f6c84…` / `ba7baf93…`)

| ID | Acción | Destino | Notas |
|----|--------|---------|-------|
| TP-R1 | Verificar idempotencia | `marker.md` + cascada | CA-1/CA-2 ya cumplidos; **sin** append F2 |
| TP-R2 | Documentar no-op | `implementation.md` + `execution.md` | Apéndice `reargos_idempotent: skipped_cascade` |
| TP-R3 | Git mutante | — | **No** invocar commit/push/PR (mandato D4) |
| TP-R4 | KM / todos | — | **Prohibido** |

Sin nuevas `skill_invocations` git en este ciclo: producto cerrado; ancla semilla `847d3ee`; machine handoff APTO ya materializado.

## Restricciones

- Escritura piloto solo MCP `sddia-workspace-server` (CA-6 Re-Argos / CA-4 histórico).
- Git solo `skill:git-manager` / Evidence Bridge; sin inventar `GIT_EVIDENCE_VIA_GIT_MANAGER: APTO`.
- Prohibido mutar `docs/todos/**` (RBAC KM).
- Sin blueprint (`plan.md` no emitido).
- Este ciclo: **no** duplicar cascada Diseño/Ejecución de producto.
