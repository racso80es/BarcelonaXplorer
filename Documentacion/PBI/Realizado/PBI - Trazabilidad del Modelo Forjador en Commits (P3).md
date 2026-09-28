# [OPERATIVO] Documento Destilado: PBI - Trazabilidad del Modelo Forjador en Commits

**Identificador:** PBI-STEEL-020  
**Estatus:** Realizado  
**Fecha de Creación:** 2026-09-28  
**Fecha de Certificación:** 2026-09-28  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)  
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-19  
**Módulo:** Gobernanza — trazabilidad de forja  
**Entorno:** `AGENTS.md` (convención de trailer). No se modifica la configuración de git del usuario ni se instalan hooks bloqueantes.  
**Prioridad:** Baja (P3 — de los 62 commits del delta, 19 llevaban `Co-authored-by: Cursor` y ninguno el modelo)  
**Estimación Táctica:** 1 Story Point  
**Depende de:** —  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** La HU-15 pedía un auditor de otra familia que el forjador. Para habilitar esa verificación de forma determinista y sin fricción de bloqueo, se instaura la convención del trailer `Forged-by`.
- **Entorno:** Convención escrita para los agentes en `AGENTS.md`. Sin hooks que rechacen commits.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* El modelo va en un trailer `Forged-by`, además de `Co-authored-by`.
  - *Filtro B:* Las HUs de auditoría futuras nombrarán un auditor de otra familia cuando el trailer y el auditor coincidan.
  - *Filtro C:* Un commit hecho a mano por el Vértice Biológico es soberano y no lleva el trailer.

---

## 1. Declaración de Intención (INVEST)

**Como** Vértice Biológico,  
**Quiero** que el próximo delta pueda decir qué modelo forjó cada commit de agente,  
**Para** poder encargar la auditoría a otra familia cuando toque.  

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Convención):** `AGENTS.md` incorpora la instrucción explícita del trailer `Forged-by: <familia y modelo>`. El nombre del modelo se toma directamente del declarado en la sesión; prohibido inventarlo.
- [x] **CA-2 (Sin barrera):** no se instaló ningún hook bloqueante en `commit-msg` ni se alteró `git config`. Los commits del Vértice Biológico no requieren trailer.
- [x] **CA-3 (Auditorías futuras):** la convención estipula que si los trailers del delta y el auditor propuesto son de la misma familia, la historia de usuario de auditoría deberá nombrar a otra familia antes de empezar. No se modificaron retrospectivamente commits previos.
- [x] **CA-4 (Historia intacta):** el historial de commits pasado permanece inmutable, sin `rebase`, `filter-repo` ni reescrituras artificiales.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **El trailer no es una firma criptográfica:** Sirve como señal de trazabilidad para la gobernanza de auditorías cruzadas, no como control de acceso.
- **Preservación de la soberanía humana:** El desarrollador humano puede commitear con total libertad sin trabas en los hooks de git.

---

## 4. Evidencia de Certificación

1. **Adición formal a la Gobernanza en [`AGENTS.md`](file:///home/racso/Proyectos/BarcelonaXplorer/AGENTS.md):**
   Se forjó la sección `## 🏷️ Trazabilidad del Modelo Forjador en Commits (PBI-STEEL-020)` definiendo los preceptos del trailer `Forged-by`, el principio de origen de identidad, la soberanía humana y la regla de auditorías cruzadas.
2. **Validación de Integridad de Hooks:**
   No se modificó `.git/hooks/commit-msg`.
