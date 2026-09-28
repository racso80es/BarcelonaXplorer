# [ARQUITECTURA] Documento Destilado: PBI - Desmantelamiento del Barrel Contaminado de Planner y Erradicación de Prisma del Bundle Cliente

**Identificador:** PBI-STEEL-007
**Estatus:** Realizado (2026-09-28)
**Fecha de Creación:** 2026-09-28
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 15: Auditoría Ontológica de Acero y Purga Kaizen](../../HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2015%3A%20Auditor%C3%ADa%20Ontol%C3%B3gica%20de%20Acero%20y%20Purga%20Kaizen%20%28El%20Hombre%20de%20Acero%29.md)
**Origen:** [`AUD-OPS-STEEL-001`](../../Auditorias/Auditoria%20-%20Log%20de%20Friccion%20HU-15%20Hombre%20de%20Acero%20%28Delta%20v2.0.1-doc-anchor%20a%201c4d1b0%29.md) · F-07, F-20 (enmienda ADR-001)
**Módulo:** Topología de código — Vertical Slicing y frontera cliente/servidor
**Entorno:** `src/features/planner/index.ts`, nuevo barrel de servidor de `planner`, consumidores de `@/features/planner` en `src/app/**` y `src/components/**`, `src/eslint.config.mjs`, `Documentacion/ADR/ADR-001-Topologia-Codigo-Vertical-Slicing-vs-Capas.md`
**Prioridad:** Alta (P1 — regresión del PBI‑P0 de barrels)
**Estimación Táctica:** 3 Story Points
**Depende de:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** `features/planner/index.ts` reexporta con `export *` veinte módulos, incluidos `PrismaItineraryRepository` y los casos de uso de servidor. Dos componentes cliente lo importan y el build mete `new PrismaClient` en el bundle del navegador.
- **Entorno:** Barrel de `planner`, `app/orchestrator/page.tsx`, `components/tactical/hybrid-canvas.tsx`, regla `no-restricted-imports`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Dos superficies con exports nominales: dominio puro y servidor.
  - *Filtro B:* La regla ESLint cubre toda superficie de servidor de cualquier feature.
  - *Filtro C:* El criterio de éxito es el bundle, no la lectura del código.

---

## 1. Declaración de Intención (INVEST)

**Como** Custodio de la Arquitectura,
**Quiero** que cada feature exponga una superficie de dominio puro, consumible desde el cliente, separada de su superficie de servidor,
**Para** que ningún adaptador de infraestructura (Prisma, LanceDB, `fs`) vuelva a entrar en el bundle del navegador.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Superficie de dominio puro):** `features/planner/index.ts` exporta con nombres explícitos solo esquemas, entidades, value objects, `ChronologicalPropagator` y tipos. Prohibido `export *`. No exporta `consumeOrchestratorStream` ni `formatSseMessage`: PBI-STEEL-005 elimina el canal SSE. Si este PBI se forja antes, esos dos módulos se dejan fuera del barrel igualmente.
- [x] **CA-2 (Superficie de servidor):** un barrel de servidor (p. ej. `features/planner/server.ts`) con `import 'server-only'` exporta con nombres los casos de uso, `PrismaItineraryRepository`, `InMemoryDensityMatrixRepository` y `AffiliateEnricherService`. Los Route Handlers y el caso de uso de triaje importan desde ahí.
- [x] **CA-3 (Regla ESLint general):** `no-restricted-imports` prohíbe importar cualquier `@/features/*/server` desde `app/**/page.tsx`, `components/**` y `features/**/components/**`, sustituyendo la regla específica de `@/features/triage`.
- [x] **CA-4 (Solo planner):** este PBI no refactoriza los otros ocho `index.ts`. Su inventario y su saneamiento son PBI-STEEL-022. La regla ESLint de CA-3 puede prohibir `@/features/*/server` desde el cliente; no obliga a crear esas superficies en este cambio.
- [x] **CA-5 (Criterio empírico):** tras `npm run build`, `grep -l PrismaClient .next/static -r` no devuelve ningún fichero. El resultado se anota en la sección 4, junto al tamaño del chunk de `/orchestrator` antes (490 KB) y después.
- [x] **CA-6 (Enmienda ADR-001):** se enmienda la línea 49 de ADR-001 con la norma vigente: superficie de dominio puro consumible desde cliente + superficie de servidor con `server-only`, siempre con exports nominales. El PBI‑P0 de barrels se enlaza como antecedente.

---

## 3. Notas de Forja (Anti‑Alucinación)

- **Evidencia de partida:** el chunk `.next/static/chunks/04ff15n2oxfdp.js` (490 KB), referenciado por `server/app/orchestrator/page_client-reference-manifest.js`, contiene `globalThis.prismaItineraryClient??new m1.PrismaClient` y las clases de error de Prisma. El build y los E2E pasan porque el stub de navegador de `@prisma/client` no falla al construirse, así que el problema es invisible para los oráculos.
- **Por qué la regla actual no bastó:** `eslint.config.mjs:49` solo prohíbe `@/features/triage`; el PBI‑P0 corrigió ese barrel y dejó `planner` con `export *`.
- **`server-only` en Vitest:** `vitest.config.ts` ya aliasa `server-only` a un módulo vacío, así que los tests pueden importar la superficie de servidor.
- **Contradicción normativa a cerrar:** ADR-001 prescribe consumir "exclusivamente los puertos exportados por el barrel `index.ts`" y el PBI‑P0 prescribe exports nominales sin servidor en cliente. Ninguno de los dos distingue superficies; CA-6 resuelve la contradicción.

---

## 4. Evidencia de Certificación

- `npm run build` (2026-09-28): `grep -rl PrismaClient src/.next/static` → **0 coincidencias** (referencia previa ~490 KB con Prisma).
- Vitest: 91 ficheros / 482 tests en verde.
- ADR-001 enmendado (punto 3).
