# [ARQUITECTURA] Documento Destilado: PBI - Gobernanza Relacional de Fuentes, Máquina de Estados y Seed YAML

**Identificador:** PBI-CTX-004
**Estatus:** Pendiente (bloqueado por PBI-CTX-001)
**Fecha de Creación:** 2026-09-30
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

- [ ] **CA-1 (Modelo Prisma):** `ContextSource` según HU §3.1 (camelCase, `@@map("context_sources")`, `@@index([status])`, incluido `supersedesSourceTag`), con el enum `ContextSourceType` reducido a lo que decida PBI-CTX-001. El campo `type` referencia la matriz de adaptadores de HU §4.2.
- [ ] **CA-2 (DDL de producción):** `CREATE TABLE IF NOT EXISTS context_sources` añadido al DDL idempotente de `ansible/hooks/after_symlink.yml`, coherente columna a columna con el modelo Prisma (enums como `ENUM` MySQL), y el nombre de la tarea actualizado.
- [ ] **CA-3 (Máquina de estados):** Matriz declarativa con las nueve transiciones de HU §3.2. Tests colocalizados: cada transición legal produce el estado y contadores esperados; las ilegales (p. ej. `ACTIVE`→Aprobar, `ARGOS`→`ACTIVE`) devuelven error y no mutan.
- [ ] **CA-4 (Circuit Breaker puro):** Función de dominio que, dada una fuente y el resultado de ingesta, aplica las filas `Ingesta OK` / `Ingesta KO` (reset a 0 tras éxito; `DEGRADED` al tercer fallo consecutivo). Tests para `failedAttempts` 0→1→2→3 y para 2→0 tras éxito.
- [ ] **CA-5 (Repositorio):** Puerto `IContextSourceRepository` + adaptador Prisma, Pure DI por constructor, con `findByStatus`, `findByTag`, `applyTransition` y `upsertFromSeed`. Entradas de BD parseadas con Zod en la frontera.
- [ ] **CA-6 (Seed):** Carga de `context-sources.seed.yml` con `YAML.parse()` + Zod; idempotente (test: segunda ejecución no cambia `status` ni `failedAttempts`). Mecanismo de ejecución documentado (script o paso en `after_symlink.yml`).
- [ ] **CA-7 (Oráculos):** `tsc --noEmit`, `eslint`, `vitest run` y `npm run build` en verde.

---

## 3. Fuera de Alcance

- Ingesta real (PBI-CTX-005), acciones del panel (PBI-CTX-010).
