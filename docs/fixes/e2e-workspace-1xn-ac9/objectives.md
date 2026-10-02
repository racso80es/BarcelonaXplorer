---





feature_name: e2e-workspace-1xn-ac9
created: "2026-10-02"
process: bug-fix
branch_name: fix/e2e-workspace-1xn-ac9
persist_ref: /home/racso/Proyectos/BarcelonaXplorer/docs/fixes/e2e-workspace-1xn-ac9
pbi_ref: docs/todos/pending/[ARQUITECTURA] Workspace 1×N — ciclo bug-fix real sobre BarcelonaXplorer.md
---
# Objetivos — e2e-workspace-1xn-ac9

## Misión

Ciclo real sobre el piloto
document_id: PBI-ARQUITECTURA-BX-KALMA2-E2E

Historia madre: §4.H, fase F6, AC-9. Último PBI de código de la historia. No añade superficie: prueba las anteriores juntas.

## Alcance (manifiesto)

Inicialización de contexto vía orquestador nativo `execute-process` (laboratorio).

## Ley aplicada

- Git exclusivamente vía `skill:git-manager`.
- Jerarquía: Acción → Agente → Skill → Tools.
