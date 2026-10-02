# [ARQUITECTURA] Documento Destilado: PBI - Gobernanza Relacional de Fuentes, Máquina de Estados y Seed YAML

**Identificador:** PBI-CTX-004
**Estatus:** Realizado
**Fecha de Creación:** 2026-09-30
**Fecha de Finalización:** 2026-10-02
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §3.1, §3.2, §3.3 · Escenarios 1, 2 (lógica de transición)
**Módulo:** `src/prisma/schema.prisma`, `ansible/hooks/after_symlink.yml`, `src/features/context-sources/` (entidad, máquina de estados, repositorio, seed)
**Entorno:** Prisma 5 / MySQL 8, Vitest
**Prioridad:** Alta (P1)
**Estimación Táctica:** 3 Story Points
**Depende de:** PBI-CTX-001 (enum de tipos cerrado y seed con fuentes viables)
**Bloquea:** PBI-CTX-005, PBI-CTX-009, PBI-CTX-010

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Catálogo relacional de fuentes cuyo estado sobrevive a los despliegues de Ansistrano, con su ciclo de vida modelado como máquina de estados declarativa.
- **Entorno:** Nueva feature `src/features/context-sources/`, modelo `ContextSource` (`@@map("context_sources")`), DDL idempotente en `after_symlink.yml` (producción no ejecuta `prisma migrate`).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Soberanía Humana):* Solo el actor `HUMAN` puede llevar una fuente a `ACTIVE`; `ARGOS` solo crea filas `PENDING_APPROVAL`.
  - *Filtro B (Axioma III):* Transiciones como matriz de datos `(estado, evento, actor) → estado`, no `if/else`. Transición no listada ⇒ `OperationEnvelope` de error sin mutar la fila.
  - *Filtro C (Idempotencia):* El seed es `upsert` por `sourceTag` y no pisa `status` ni `failedAttempts` de filas existentes.

---

## 1. Declaración de Intención (INVEST)

**Como** Vértice Biológico,
**Quiero** un catálogo de fuentes en MySQL con estados y transiciones controladas,
**Para** que la ingesta, la Sonda Argos y el panel operen sobre una única verdad y ninguna fuente entre en producción sin mi aprobación.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Modelo Prisma):** `ContextSource` implementado según HU §3.1 en `src/prisma/schema.prisma` con camelCase, `@@map("context_sources")`, `@@index([status])`, `supersedesSourceTag` y enum `ContextSourceType` cerrado a las fuentes viables (`SOCRATA`, `SPARQL`, `RSS`, `ICAL`, `API_REST`, `JSON_LD_SCHEMA_ORG`). Cliente generado con `npx prisma generate`.
- [x] **CA-2 (DDL de producción):** Sentencia `CREATE TABLE IF NOT EXISTS \`context_sources\`` agregada al bloque de hooks idempotentes en `ansible/hooks/after_symlink.yml` con enums coherentes y tipos MySQL exactos (`VARCHAR(64)`, `VARCHAR(191)`, `TEXT`, `INT UNSIGNED`, `DATETIME(3)`).
- [x] **CA-3 (Máquina de estados):** Matriz declarativa `CONTEXT_SOURCE_TRANSITIONS` forjada en `src/features/context-sources/context-source-state-machine.ts` cubriendo las 9 transiciones canónicas con validación estricta de actor (`HUMAN`, `SYSTEM`, `ARGOS`). Transiciones ilegales emiten `createErrorEnvelope` (422) sin mutación. 16 tests unitarios colocalizados.
- [x] **CA-4 (Circuit Breaker puro):** Función pura `applyIngestionResult` que incrementa `failedAttempts`, degrada a `DEGRADED` al alcanzar el umbral de 3 fallos consecutivos y resetea a 0 tras ingesta exitosa.
- [x] **CA-5 (Repositorio):** Puerto `IContextSourceRepository` e implementación `PrismaContextSourceRepository` en `src/features/context-sources/` con Pure DI, parseo Zod en frontera y operaciones `findByStatus`, `findByTag`, `findAll`, `save`, `create` y `upsertFromSeed`.
- [x] **CA-6 (Seed):** Servicio `ContextSourceSeedService` con parseo seguro `YAML.parse()` y validación Zod de `context-sources.seed.yml`. Tests colocalizados verificando idempotencia y no sobreescritura de estados de fuentes ya existentes.
- [x] **CA-7 (Oráculos):** Oráculos de acero superados en verde:
  - TypeScript: `tsc --noEmit` (0 errores).
  - Linter AST: `eslint` (0 warnings, 0 errores).
  - Tests: `vitest run` (97 suites, 555 tests en verde).
  - Next.js: `npm run build` (compilación y optimización en verde).

---

## 3. Fuera de Alcance

- Ingesta real (PBI-CTX-005), acciones del panel (PBI-CTX-010).
