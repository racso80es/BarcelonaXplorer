---
feature_name: e2e-workspace-1xn-ac9
fix_name: e2e-workspace-1xn-ac9
created: "2026-10-02"
process: bug-fix
phase: Diseño del fix
base: main
scope: e2e-ac9-workspace-1xn-retry-evidence-bridge-branch-pr
branch_name: fix/e2e-workspace-1xn-ac9
persist_ref: /home/racso/Proyectos/BarcelonaXplorer/docs/fixes/e2e-workspace-1xn-ac9
pbi_ref: docs/todos/pending/[ARQUITECTURA] Workspace 1×N — ciclo bug-fix real sobre BarcelonaXplorer.md
project_slug: barcelonaxplorer
project_root: /home/racso/Proyectos/BarcelonaXplorer
correlation_id: "130bf443-617b-469a-84df-356934e66f2b"
plan_emitted: false
design_verdict: ok
agent: dedalo
retry_of:
  correlation_id: "4b86fe0d-ba93-4c86-a91b-f8d2c0b4b91e"
  block_reason: "GIT_EVIDENCE_VIA_GIT_MANAGER: NO_APTO (git_manager_invoked: false)"
---

# Spec — E2E AC-9 reintento: Evidence Bridge git + cierre `branch_pr`

## Ingesta

| Input | Estado | Nota |
|-------|--------|------|
| `objectives.md` | **Presente** bajo `persist_ref` | Consumido vía MCP. Misión: ciclo real piloto; PBI `PBI-ARQUITECTURA-BX-KALMA2-E2E`; AC-9 / §4.H F6. |
| Semilla (este `execution_id`) | Presente | «Reintento: Evidence Bridge git piloto activo; completar Argos APTO y cierre branch_pr.» |
| `pbi_ref` | Presente (Paciente 0) | `document_id: PBI-ARQUITECTURA-BX-KALMA2-E2E`; `status: pending`; `delivery_mode` esperado vía manifiesto piloto → cierre `branch_pr`. |
| Ciclo previo | Materializado + **NO_APTO** | Argos (`validacion.md`): producto CA-1/CA-2/CA-4/CA-5 APTO; CA-6 **NO_APTO** por bridge `GIT_EVIDENCE_VIA_GIT_MANAGER: NO_APTO`. |
| `project_slug` / `project_root` | `barcelonaxplorer` → `/home/racso/Proyectos/BarcelonaXplorer` | Mutación solo en jurisdicción del piloto vía MCP. |
| `active_norm_pack` | `features-documentation-pattern` | Cascada: este `spec.md`; Tekton → `implementation.md` + `execution.md`; Argos → `validacion.md`. |
| `fix_name` | `e2e-workspace-1xn-ac9` | Path de producto = este directorio. |

## Problema / objetivo (reintento)

El marcador de producto **ya existe** y cumple el token AC-9:

```text
2026-10-02T08:14:15Z WORKSPACE_1XN_AC9_OK correlation_id=4b86fe0d-ba93-4c86-a91b-f8d2c0b4b91e
```

El ciclo previo falló el **cierre formal**: Evidence Bridge registró `git_manager_invoked: false` → `GIT_EVIDENCE_VIA_GIT_MANAGER: NO_APTO`, por lo que Argos emitió `global: NO_APTO` sin inventar éxito. Este reintento **no añade superficie de producto**; cierra el gap de evidencia git + `delivery_mode: branch_pr` para habilitar `global: APTO` y `pbi_archived: true` con prueba real.

## Alcance (producto + forja)

| ID | Entrega |
|----|---------|
| F1 | **Verificar** `docs/fixes/e2e-workspace-1xn-ac9/marker.md` (CA-1/CA-2). Token `WORKSPACE_1XN_AC9_OK` ya presente → **no reescribir** el histórico. |
| F2 | Opcional de trazabilidad de este reintento: **append** de una línea ` <ISO-8601-UTC> WORKSPACE_1XN_AC9_OK correlation_id=130bf443-617b-469a-84df-356934e66f2b` solo si Tekton necesita un diff de producto fresco para commit/PR; si el commit/PR puede basarse en cascada + evidencia previa del marcador, no duplicar. |
| F3 | Diff de producto limitado a `docs/fixes/e2e-workspace-1xn-ac9/**` (+ cascada); no mutar genoma SddIA ni app piloto. |
| F4 | **Evidence Bridge git activo:** toda operación git del piloto vía `skill:git-manager` (`./sddia-run.sh --tool git-manager` JSON stdin o handler PPR nativo) de forma que el runtime materialice `git_manager_invoked: true` y `GIT_EVIDENCE_VIA_GIT_MANAGER: APTO`. |
| F5 | **Cierre `branch_pr`:** rama `fix/e2e-workspace-1xn-ac9`; push + PR (o evidencia equivalente del manifiesto) enlazable desde `validacion.md`. |
| F6 | Argos: `validacion.md` con `global: APTO` **solo** si bridge git APTO + enlaces commit/PR reales; `pbi_archived: true` solo si el PBI pasa a `docs/todos/done/` en Paciente 0 con evidencia. |

### Formato canónico (si F2 append)

```text
<ISO-8601-UTC> WORKSPACE_1XN_AC9_OK correlation_id=130bf443-617b-469a-84df-356934e66f2b
```

## Fuera de alcance

- Blueprint de proceso nuevo → **`plan.md` no emitido** (`plan_emitted: false`).
- Escribir bajo `docs/todos/**` desde Tekton/Argos (RBAC KM: solo Cúmulo / `Kaizen_Alert_Required`).
- Inventar `GIT_EVIDENCE_VIA_GIT_MANAGER: APTO` o `global: APTO` sin stdout/JSON real del skill.
- Encender IDEs; reparar ruido git ajeno del piloto (`Documentacion/...`) salvo que bloquee el commit selectivo de este `persist_ref`.
- Opt-in/revierte `software_forge` en Paciente 0 (R-E2E-1): entorno, no diseño de este fix.

## Criterios de aceptación (Tekton / Argos)

| ID | Criterio | Origen |
|----|----------|--------|
| CA-1 | Existe `marker.md` bajo este `persist_ref` en BX. | AC-9 |
| CA-2 | Contiene línea UTC + literal `WORKSPACE_1XN_AC9_OK`. | AC-9 |
| CA-3 | Diff de producto del piloto limitado a este `persist_ref` (commit/PR sin arrastrar ruido ajeno si el skill lo permite). | R-E2E / F3 |
| CA-4 | Escrituras vía MCP `sddia-workspace-server` / jurisdicción `barcelonaxplorer`. | R-E2E-3 |
| CA-5 | Cascada `implementation.md` + `execution.md` + `validacion.md` bajo `persist_ref`. | Norm pack |
| CA-6 | Git solo vía `skill:git-manager`; Evidence Bridge con `GIT_EVIDENCE_VIA_GIT_MANAGER: APTO` (`git_manager_invoked: true`). | Ley / R-E2E-4 / semilla reintento |
| CA-7 | Cierre según `delivery_mode` → **`branch_pr`**: rama `fix/e2e-workspace-1xn-ac9` + PR/commit enlazado en `validacion.md`. | R-E2E-4 / R-E2E-6 |
| CA-8 | `validacion.md`: `global: APTO` solo con evidencia real (bridge + commit/PR); `pbi_archived` coherente con estado del PBI en Paciente 0. | R-E2E-6 / AC-9 |

## Mandato a Tekton

1. Releer este `spec.md` + `marker.md` vía MCP; no duplicar el marcador salvo F2 justificado.
2. Actualizar `implementation.md` / `execution.md` para **este** `correlation_id` / `execution_id`, centrados en F4–F5.
3. Invocar `skill:git-manager` de forma que el Evidence Bridge del runtime registre invocación real (status → checkout rama `fix/e2e-workspace-1xn-ac9` → commit selectivo de `persist_ref` → push → create PR según manifiesto). Preferir `./sddia-run.sh --tool git-manager` (JSON stdin) o evidencia nativa PPR; **no** Shell IDE destructivo.
4. Si el bridge sigue `NO_APTO` o no hay PR, documentar `verdict: blocked` en `execution.md` sin inventar éxito.
5. **Prohibido** escribir bajo `docs/todos/`.

### Plantilla mínima git-manager (orientativa)

```json
{
  "skill": "git-manager",
  "stdin": {
    "operation_type": "checkout",
    "repository_path": "/home/racso/Proyectos/BarcelonaXplorer",
    "operation_payload_json": {
      "branch_name": "fix/e2e-workspace-1xn-ac9",
      "create_if_not_exists": true
    }
  }
}
```

Commit: solo paths bajo `docs/fixes/e2e-workspace-1xn-ac9/` (spec/marker/cascada). Push + PR: según operaciones soportadas por el skill / `delivery_mode: branch_pr`.

## Mandato a Argos

- Copiar veredictos del Evidence Bridge (R1/R2/R3) sin reinventar stdout.
- `global: APTO` **iff** `TECH_FORMAL_EXECUTE_PROCESS: APTO` ∧ `GIT_EVIDENCE_VIA_GIT_MANAGER: APTO` ∧ CA-1..CA-7 con evidencia MCP/PR.
- Si bridge git sigue `NO_APTO` → `global: NO_APTO` / `verdict: blocked` (como el ciclo previo).
- `pbi_archived: true` solo con PBI en `docs/todos/done/` (Paciente 0); si permanece en `pending/` → `false`.
- AC-1 cierre: sin `project_root` literal en UI/payload de agente.

## Blueprint

No aplica. `plan_emitted: false`.
