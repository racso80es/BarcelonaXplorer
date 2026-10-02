# [ARQUITECTURA] Documento Destilado: PBI - Contrato de Fuente y Pipeline de Ingesta hacia LanceDB con Circuit Breaker

**Identificador:** PBI-CTX-005
**Estatus:** Realizado
**Fecha de Creación:** 2026-09-30
**Fecha de Finalización:** 2026-10-02
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §4.1, §4.2, §5 · Escenarios 1, 2, 5, 6, 8
**Módulo:** `src/features/context-sources/` (`ContextEntrySchema`, `IContextSourceAdapter`, matriz de adaptadores, `IngestContextUseCase`), `src/app/api/context/ingest/route.ts`, `src/cron/crontab`
**Entorno:** Next.js Route Handler (`runtime = 'nodejs'`), LanceDB vía `IVectorStorePort`, `IEmbeddingPort` (`GeminiEmbeddingAdapter`, 768 dims)
**Prioridad:** Alta (P1)
**Estimación Táctica:** 5 Story Points
**Depende de:** PBI-CTX-001, PBI-CTX-004, PBI-CTX-003 (solo para la entrada de `crontab`)
**Bloquea:** PBI-CTX-006, PBI-CTX-007, PBI-CTX-008, PBI-CTX-010, PBI-CTX-011

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Esqueleto completo de la ingesta: contrato de salida normalizado, puerto de adaptador, orquestación por fuente `ACTIVE` con Circuit Breaker, deduplicación, vectorización fail-closed, persistencia en la tabla nueva `context_memory` y caducidad. Se entrega con un adaptador *stub* de test; los adaptadores reales llegan en PBI-CTX-006/007/008.
- **Entorno:** Reutiliza `IVectorStorePort.upsert/delete` y `IEmbeddingPort.generateEmbedding` existentes.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Pureza del Corpus):* Solo se persisten vectores con `source === 'provider'`; los `fallback` se descartan con `WARN` en contexto `LLM_ENGINE`.
  - *Filtro B (Axioma V):* Adaptadores devuelven `OperationEnvelope<ContextEntry[]>`; selección por `Record<ContextSourceType, IContextSourceAdapter>`.
  - *Filtro C (Eficiencia Térmica):* Deduplicación por `contentHash` antes de embeber; caducidad por `expiresAt` al final de cada ejecución.

---

## 1. Declaración de Intención (INVEST)

**Como** Orquestador de Experiencias Turísticas,
**Quiero** un proceso de ingesta diario que recorra las fuentes activas, normalice su contenido, lo vectorice y lo persista, degradando solo las fuentes que fallan de forma sostenida,
**Para** alimentar el RAG con contexto hiperlocal fresco y limpio sin intervención manual.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Contrato de salida):** `ContextEntrySchema` y función pura `calculateContextContentHash` (SHA-256) forjados en `src/features/context-sources/context-entry.schema.ts`. Validación geográfica estricta para la caja de Barcelona (`lat ∈ [41.2, 41.5]`, `lng ∈ [2.0, 2.3]`). Tests colocalizados con entradas válidas e inválidas.
- [x] **CA-2 (Puerto y matriz):** Puerto `IContextSourceAdapter` y tipo `ContextAdapterRegistry` en `src/features/context-sources/context-source-adapter.port.ts`, inyectados por Pure DI en `IngestContextUseCase`.
- [x] **CA-3 (Circuit Breaker integrado):** Cada fuente activa ejecuta `applyIngestionResult`: tres fallos consecutivos degradan la fuente a `DEGRADED`, y la cuarta ejecución no la consulta al filtrar por `ACTIVE` (Escenario 1); un éxito con `failedAttempts = 2` resetea el contador a 0 y actualiza `lastSuccessAt` (Escenario 2).
- [x] **CA-4 (Aislamiento entre fuentes):** Ejecución desacoplada en bloque `try/catch` individual por fuente; fallos o excepciones en una fuente no abortan las demás.
- [x] **CA-5 (Deduplicación):** Consulta previa de IDs existentes en `context_memory` mediante `vectorStore.getByIds`. Si el `id` y `contentHash` coinciden, no se llama a `generateEmbedding` ni se reinserta (Escenario 6).
- [x] **CA-6 (Vectorización fail-closed):** Si `generateEmbedding(summary)` retorna `source === 'fallback'`, la entrada se descarta sin escribir en LanceDB y se emite registro de telemetría `WARN` con contexto `LLM_ENGINE` (Escenario 5).
- [x] **CA-7 (Persistencia):** Persistencia en lote en la tabla aislada `context_memory` mediante `vectorStore.upsert(CONTEXT_MEMORY_TABLE, docs)`.
- [x] **CA-8 (Caducidad):** Al finalizar la ingesta, eliminación higiénica de entradas con `expiresAt < now` mediante `vectorStore.delete('context_memory', { expiredBefore: nowIso })` (y soporte nativo para filtro de cadena `expiresAt < '...'`).
- [x] **CA-9 (Route Handler):** `POST /api/context/ingest` implementado con el mismo esquema fail-closed de `CRON_SECRET` que `/api/telemetry/prune` (`Bearer` o `x-cron-secret`, `constantTimeEqual`, 401 en producción sin secreto). Tests verifican que peticiones sin secreto o inválidas devuelven 401 sin consultar fuentes (Escenario 8).
- [x] **CA-10 (Telemetría):** Emisión de evento `CONTEXT_INGESTION_SUMMARY` en `telemetryRepo` con `fetched`, `deduplicated`, `persisted`, `discardedFallback`, `sourcesDegraded` y duración en milisegundos.
- [x] **CA-11 (Planificación):** Trabajo diario a las 04:00 AM añadido al `src/cron/crontab` maestro del sidecar.
- [x] **CA-12 (Oráculos):** Trinity de oráculos validada en verde:
  - `tsc --noEmit` (0 errores).
  - `npm run lint` (0 warnings).
  - `vitest run` (100 suites, 573 tests en verde).
  - `npm run build` (Next.js compilado exitosamente con ruta `/api/context/ingest`).

---

## 3. Fuera de Alcance

- Adaptadores reales por tipo de fuente (PBI-CTX-006, 007, 008).
- Consumo del contexto en el planner (PBI-CTX-011).
