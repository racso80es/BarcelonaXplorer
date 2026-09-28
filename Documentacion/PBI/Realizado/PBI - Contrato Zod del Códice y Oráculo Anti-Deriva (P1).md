# [ARQUITECTURA] Documento Destilado: PBI - Contrato Zod del Códice y Oráculo Anti-Deriva

**Identificador:** PBI-CODEX-002  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-28  
**Fecha de Culminación:** 2026-09-28  
**Historia de Usuario Relacionada:** [HU-14 — Forja del Códice Maestro Tecnológico y Arnés Multi-IDE](../../HistoriasDeUsuario/[ARQUITECTURA]%20Historia%20de%20Usuario%2014:%20Forja%20del%20Códice%20Maestro%20Tecnológico%20y%20Arnés%20Multi-IDE.md)  
**Módulo:** Gobernanza tecnológica — oráculo del Códice  
**Entorno:** `src/features/governance/`, `src/package.json`  
**Prioridad:** Alta (P1 — Peaje del Oráculo)  
**Estimación Táctica:** 2 Story Points  
**Depende de:** PBI-CODEX-001  

---

## 1. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1:** `yaml` en `devDependencies` (`npm install -D yaml` desde `src/`).
- [x] **CA-2:** `library-codex.schema.ts` y `library-codex.contract.test.ts` en `src/features/governance/`.
- [x] **CA-3:** Parseo con `parse` de `yaml` y validación Zod del frontmatter del Códice.
- [x] **CA-4:** Esquema con uuid v4, slug, SemVer, `Library_Codex`, status, fecha, `source_of_truth` y `target_technologies`.
- [x] **CA-5:** `z.uuid()` con refinamiento del nibble v4 en índice 14.
- [x] **CA-6:** Anti-deriva por major version contra `src/package.json`.
- [x] **CA-7:** Presencia de los 11 identificadores `TC-*` en el cuerpo.
- [x] **CA-8:** `tsc --noEmit`, `eslint` y `vitest run` en verde (3 tests).
- [x] **CA-9:** Sin aserción de arnés (reservada a PBI-CODEX-004).

---

## 2. Evidencia de Certificación

1. **Compilador:** `npx tsc --noEmit` — exit 0.
2. **Linter:** `npm run lint` — exit 0.
3. **Tests:** `vitest run features/governance/library-codex.contract.test.ts` — 3 passed.

---

## 3. Notas de Forja (Anti-Alucinación)

- Sin `index.ts` barrel en `governance/` (decisión de HU-14).
- `extractFrontmatterYaml` vive en el esquema para reutilización en PBI-CODEX-004.
