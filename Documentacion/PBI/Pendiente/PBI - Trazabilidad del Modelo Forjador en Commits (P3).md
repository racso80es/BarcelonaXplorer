# [OPERATIVO] Documento Destilado: PBI - Trazabilidad del Modelo Forjador en Commits

**Identificador:** PBI-STEEL-020
**Estatus:** Pendiente (Backlog diferido — no se ejecuta antes de cerrar PBI-STEEL-001 a 009)
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-19
**Módulo:** Gobernanza — trazabilidad de forja
**Entorno:** `AGENTS.md` (convención de trailer). No se modifica la configuración de git del usuario.
**Prioridad:** Baja (P3 — de los 62 commits del delta, 19 llevan `Co-authored-by: Cursor` y ninguno el modelo)
**Estimación Táctica:** 1 Story Point
**Depende de:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** La HU-15 pedía un auditor de otra familia que el forjador. No se puede comprobar: los commits co-firmados por Cursor no dicen el modelo, y esta auditoría la hizo Claude Opus 5.5, no el Opus 4.8 que la HU preveía.
- **Entorno:** Convención escrita para los agentes. Sin hook que rechace commits.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* El modelo va en un trailer `Forged-by`, no solo en `Co-authored-by`.
  - *Filtro B:* Una HU de auditoría futura nombra un auditor de otra familia cuando el trailer y el auditor coinciden.
  - *Filtro C:* Un commit hecho a mano, sin modelo, sigue siendo válido. No lleva el trailer.

---

## 1. Declaración de Intención (INVEST)

**Como** Vértice Biológico,
**Quiero** que el próximo delta pueda decir qué modelo forjó cada commit de agente,
**Para** poder encargar la auditoría a otra familia cuando toque.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Convención):** `AGENTS.md` pide que un commit producido por un agente incluya el trailer `Forged-by: <familia y modelo>`, además del `Co-authored-by` que Cursor ya añade. El texto dice de dónde sale el nombre del modelo (el que la sesión declara) y prohíbe inventarlo si la sesión no lo dice.
- [ ] **CA-2 (Sin barrera):** no se instala un `commit-msg` que rechace commits, ni se cambia `git config`. El Vértice commitea sin modelo y ese commit no lleva `Forged-by`.
- [ ] **CA-3 (Auditorías futuras):** la misma convención dice que, si los trailers del delta y el auditor propuesto son de la misma familia, la HU de auditoría nombra otra familia antes de empezar. No se reescribe la HU-15 ni se atribuye modelo a los 19 commits que ya no lo tienen.
- [ ] **CA-4 (Historia intacta):** no hay `rebase`, `filter-repo` ni amend de commits ajenos para rellenar trailers viejos.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **F-19 no demuestra que el auditor y el forjador fueran el mismo modelo.** Demuestra que no se puede saber. Este PBI no concluye que hubiera contaminación. Solo deja de repetir la ceguera.
- **El trailer no es una firma.** Quien escribe el mensaje puede mentir. Sirve para la regla de la HU, no como control de acceso.

---

## 4. Evidencia de Certificación

Pendiente de forja.
