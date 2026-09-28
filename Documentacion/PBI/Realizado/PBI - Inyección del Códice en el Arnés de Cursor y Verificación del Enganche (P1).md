# [ARQUITECTURA] Documento Destilado: PBI - Inyección del Códice en el Arnés de Cursor y Verificación del Enganche

**Identificador:** PBI-CODEX-004  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-28  
**Fecha de Culminación:** 2026-09-28  
**Historia de Usuario Relacionada:** [HU-14](../../HistoriasDeUsuario/[ARQUITECTURA]%20Historia%20de%20Usuario%2014:%20Forja%20del%20Códice%20Maestro%20Tecnológico%20y%20Arnés%20Multi-IDE.md)  
**Depende de:** PBI-CODEX-002, PBI-CODEX-003  

---

## Criterios de Aceptación

- [x] **CA-1:** Bloque canónico en `.cursor/rules/sddia-axiomas-forja.mdc` y `.cursorrules`.
- [x] **CA-2:** Frontmatter del `.mdc` intacto.
- [x] **CA-3:** Test `injects the codex harness block in all IDE bootstrap files` sobre los cinco paths.
- [x] **CA-4:** Solo dos archivos Cursor + test/schema (constante exportada).
- [x] **CA-5:** `tsc`, `eslint`, `vitest` en verde (4 tests en contrato).

---

## Evidencia de Certificación

- `LIBRARY_CODEX_HARNESS_INJECTION` y `LIBRARY_CODEX_HARNESS_RELATIVE_PATHS` en `library-codex.schema.ts`.
- `vitest run features/governance/library-codex.contract.test.ts` — 4 passed.
