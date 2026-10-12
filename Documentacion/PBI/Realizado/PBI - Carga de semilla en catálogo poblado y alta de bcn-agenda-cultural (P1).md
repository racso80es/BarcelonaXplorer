# [ARQUITECTURA] PBI - Carga de semilla en catálogo poblado y alta de bcn-agenda-cultural

**Identificador:** PBI-CTX-017  
**Ref. de historia:** REF-CTX-03b  
**Estatus:** Realizado  
**Fecha de creación:** 2026-10-12  
**Fecha de realización:** 2026-10-12  
**Historia de usuario:** [Extracción declarativa bifásica CKAN](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Extracci%C3%B3n%20Declarativa%20Bif%C3%A1sica,%20Miner%C3%ADa%20de%20Contenedores%20CKAN%20y%20Saneamiento%20de%20Fuentes%20Hiperlocales.md) · §3.3 · Escenario 2  
**Módulo:** `src/features/context-sources/ingest-context.use-case.ts`, su test, `src/app/Admin/Context/ContextSourcesCard.tsx`, `context-sources.seed.yml`  
**Prioridad:** Alta (P1)  
**Depende de:** PBI-CTX-014, PBI-CTX-015, PBI-CTX-016  
**Bloquea:** —

---

## 1. Declaración

**Como** operador del motor de contexto,  
**Quiero** que la semilla inserte `bcn-agenda-cultural` aunque `context_sources` ya tenga las seis fuentes,  
**Para** verla en el panel en `PENDING_APPROVAL` sin esperar a una base vacía.

Hoy `loadSeed` solo corre si el catálogo está vacío, en `IngestContextUseCase` (`allSources.length === 0`) y en `ContextSourcesCard` (`sources.length === 0`). No hay otro call site.

---

## 2. Criterios de aceptación

- [x] **CA-1 (Ingesta):** `loadSeed` corre incondicionalmente al principio de `execute()`, sincronizando fuentes nuevas en catálogo poblado. Si el sobre de semilla no es de éxito, se captura el error y el ciclo continúa normalmente procesando las fuentes `ACTIVE` sin abortar ni lanzar excepciones no controladas.
- [x] **CA-2 (Panel):** `ContextSourcesCard` invoca `loadSeed` incondicionalmente de forma tolerante a fallos y refresca el listado de fuentes con `listSources()`.
- [x] **CA-3 (Alta):** Se añade `bcn-agenda-cultural` a `context-sources.seed.yml` con tipo `CKAN_DATASTORE`, estado `PENDING_APPROVAL`, `proposedBy: HUMAN`, y bloque `extraction` determinista (`cultura-agenda-cultural`, `format: CSV`, `datastoreActive: true`, `fieldMap`, paginación y agrupación por `register_id`). No se añaden conjuntos no auditados.
- [x] **CA-4 (Catálogo poblado):** Con las filas preexistentes presentes, `loadSeed` persiste `bcn-agenda-cultural` con su `extractionConfig`. En pases subsiguientes sin modificación semántica, la fila se computa como `untouched` preservando inalterado su estado (`PENDING_APPROVAL` u operativo tras aprobación humana).
- [x] **CA-5 (Oráculos):** Compilación `npx tsc --noEmit` limpia, `npm run lint` en 0 warnings y suite `vitest` completa (124 archivos, 700 tests) en verde.

---

## 3. Evidencias de Implementación y Oráculos

- **Sincronización incondicional en Ingesta:** `src/features/context-sources/ingest-context.use-case.ts`
- **Sincronización incondicional en Panel Admin:** `src/app/Admin/Context/ContextSourcesCard.tsx`
- **Semilla declarativa actualizada:** `src/features/context-sources/context-sources.seed.yml`
- **Tests colocalizados:**
  - `src/features/context-sources/ingest-context.use-case.test.ts` (2 tests nuevos para CA-1)
  - `src/features/context-sources/context-source-seed.service.test.ts` (validación de `bcn-agenda-cultural` y extraction)
- **Resultados de Oráculos:**
  - `npx tsc --noEmit`: Salida 0 (sin errores de tipado)
  - `npm run lint`: Salida 0 (sin advertencias ESLint)
  - `npx vitest run`: 124 archivos pasados, 700 tests pasados (100% verde)
