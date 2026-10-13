---
id: barcelonaxplorer
uuid: "b7c3e891-4d2a-4f1e-9c8b-1a2b3c4d5e6f"
git_remote: https://github.com/racso80es/BarcelonaXplorer.git
default_branch: main
delivery_mode: branch_pr
contract_version: "1.3.0"
codex_slug: codex-software-engineering
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
env_ref: .SddIA/.dev/.env
mcp:
  allowed_executables:
    - npm
    - npx
qa_gates: []
---

# Manifiesto — BarcelonaXplorer

> `docs_layout.todos_pending` y `todos_done` apuntan a directorios que existen. `tracker-markdown-apply` no lee `docs_layout`: recorre `docs/todos/pending`, `docs/todos/done`, `docs/todos/historias` y `Documentacion/PBI/Realizado`. El único camino que coincide con el corpus vivo es `Documentacion/PBI/Realizado`. `Documentacion/PBI/Pendiente` y `Documentacion/HistoriasDeUsuario/` quedan fuera de ese recorrido, y `forge-pbi` exige la subcadena `historias` en `historia_ref`. Esta HU no mueve ni vacía esos árboles y no parchea el Core. El inverso se considera no operativo para el alta y para resolver la HU padre hasta un laudo posterior. `done_gate` permanece `git`.

Proyecto piloto Workspace Server 1×N (HU-KALMA2-PROJECT-WORKSPACE-SERVER-1xN).
