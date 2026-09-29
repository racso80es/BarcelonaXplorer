# [OPERATIVO] Documento Destilado: PBI - Enmienda del Códice sobre Fuentes Tailwind y Symlinks, y Anotación de AUD-INFRA-GW-001

**Identificador:** PBI-GW-018
**Estatus:** Realizado
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [HU-KAIZEN-003 — Consolidación Kaizen del IA Gateway y Blindaje del Oráculo de Empaquetado](../../HistoriasDeUsuario/16%20-%5BOPERATIVO%5D%20HU%3A%20Consolidaci%C3%B3n%20Kaizen%20del%20IA%20Gateway%20y%20Blindaje%20del%20Or%C3%A1culo%20de%20Empaquetado%20%28Post-AUD-INFRA-GW-001%29.md) · Escenario 7
**Origen:** [`AUD-INFRA-GW-001`](../../Auditorias/Auditoria%20-%20Aplicacion%20de%20HU-16%20IA%20Gateway%20y%20Fallo%20de%20Arranque%20Local%20%28Symlink%20ia-gateway%20vs%20Turbopack%29.md) · F-20, F-16
**Módulo:** `.SddIA/library/codexes/tech-master-nextjs-prisma.md`, `Documentacion/`
**Entorno:** Gobernanza documental
**Prioridad:** Baja (P3)
**Estimación Táctica:** 1 Story Point (solo documentación y gobernanza de oráculos)
**Depende de:** Ninguno
**Bloqueo:** Ninguno

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Convertir las dos lecciones estructurales de la auditoría en norma permanente y dejar constancia del incidente en los documentos que certificaron el estado anterior.
- **Entorno:** el Códice `tech-master-nextjs-prisma` (TC-UI-001 fija el uso de Tailwind 4 y prohíbe `tailwind.config.*`, pero no decía cómo se declaran las fuentes ni la gobernanza de enlaces simbólicos), la HU-16 y el PBI-GW-008.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (El oráculo no lo ve):* F-01 pasó `tsc`, `eslint` y `vitest` porque ninguno ejecuta el pipeline CSS. La norma nueva nombra explícitamente el oráculo que sí lo detecta (`next build`), incorporado por PBI-GW-011.
  - *Filtro B (Cuatro lectores):* la introducción de enlaces simbólicos bajo `src/` exige exclusión explícita en los cuatro lectores — `tsconfig.json` (`exclude`), `vitest.config.mts` (`exclude`), las fuentes Tailwind (`source(none)` sin incluirlo en `@source`) y `src/.dockerignore`.
  - *Filtro C (F-16 registrado y diferido):* el aviso `middleware` → `proxy` de Next 16 queda registrado y diferido, en estricto cumplimiento de TC-NEXT-004 que fija `src/middleware.ts` como perímetro canónico.

---

## 1. Declaración de Intención (INVEST)

**Como** responsable de la gobernanza del repositorio,
**Quiero** que el Códice prohíba la combinación que rompió el arranque y que la HU-16 y el PBI-GW-008 apunten a la auditoría,
**Para** que el próximo agente que toque esa zona lea la restricción antes de repetir el fallo.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Fundamento nuevo):** el Códice incorpora el fundamento `TC-UI-002` (declaración explícita de fuentes Tailwind con `source(none)` y `@source`) y `TC-INFRA-001` (gobernanza de enlaces simbólicos bajo `src/` con exclusión en los cuatro lectores y paso obligatorio de `npx next build`).
- [x] **CA-2 (Anclaje real):** ambos fundamentos citan como anclaje el estado vigente (`src/app/globals.css` con `source(none)`, `src/ia-gateway` como symlink, `src/.dockerignore`, `src/tsconfig.json`, `src/vitest.config.mts`) y referencian a AUD-INFRA-GW-001.
- [x] **CA-3 (Anotación de la HU-16):** la sección de Definición de Hecho de la HU-16 incluye una nota fechada que remite a AUD-INFRA-GW-001, aclara que la tríada de oráculos previa no cubría el empaquetado y apunta a HU-KAIZEN-003 como continuación.
- [x] **CA-4 (Anotación del PBI-GW-008):** la sección de certificación de oráculos de PBI-GW-008 incorpora una nota indicando que `docker compose config` y `tsc` no detectan el fallo del symlink, con enlace a la auditoría. El estatus se mantiene como Completado.
- [x] **CA-5 (F-16 registrado y diferido):** registrado explícitamente en notas que la migración de `middleware` a `proxy` queda fuera por mandato de TC-NEXT-004.
- [x] **CA-6 (Contrato del Códice):** `src/features/governance/library-codex.contract.test.ts` actualizado con `TC-UI-002` y `TC-INFRA-001`, ejecutando y pasando al 100% (4/4 tests).

---

## 3. Notas de Forja (Anti‑Alucinación)

- **El Códice prevalece sobre el conocimiento del modelo.** La incorporación de `TC-UI-002` y `TC-INFRA-001` no altera los fundamentos preexistentes.
- **No se mueve el symlink.** `src/ia-gateway -> ../ia-gateway` se preserva con sus directivas de aislamiento en los cuatro lectores.
- **La migración a `proxy` no se inicia aquí.** Conforme a TC-NEXT-004, `src/middleware.ts` es el perímetro vigente; la migración a la convención `proxy` de Next 16 constituye una historia de usuario independiente.

---

## 4. Evidencia de Implementación (Oráculos de Forja)

- **Enmienda del Códice:** Modificado `.SddIA/library/codexes/tech-master-nextjs-prisma.md` agregando `TC-UI-002` y `TC-INFRA-001` con anclajes e hipervínculos a AUD-INFRA-GW-001.
- **Aislamiento en Hojas de Estilo y Docker:** Aplicado `source(none)` y `@source` explícitos en `src/app/globals.css` y exclusión de `ia-gateway` en `src/.dockerignore`.
- **Anotaciones de Trazabilidad Histórica:** Añadidas notas informativas en el DoD de HU-16 y en la sección de oráculos de PBI-GW-008.
- **Suite de Pruebas de Contrato:** `npm run test -- features/governance/library-codex.contract.test.ts` en VERDE (4 tests).
- **Oráculo de Empaquetado:** `npx next build` ejecutado en VERDE (15/15 páginas estáticas y dynamic route handlers compilados con éxito).
