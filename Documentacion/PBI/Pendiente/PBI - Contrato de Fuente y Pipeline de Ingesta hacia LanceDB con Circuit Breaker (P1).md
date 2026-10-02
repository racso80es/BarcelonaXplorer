# [ARQUITECTURA] Documento Destilado: PBI - Contrato de Fuente y Pipeline de Ingesta hacia LanceDB con Circuit Breaker

**Identificador:** PBI-CTX-005
**Estatus:** Pendiente (bloqueado por PBI-CTX-001 y PBI-CTX-004)
**Fecha de Creación:** 2026-09-30
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

- [ ] **CA-1 (Contrato de salida):** `ContextEntrySchema` (HU §4.1) ajustado con el mapeo de PBI-CTX-001, incluida la caja geográfica de Barcelona y `contentHash` SHA-256. Tests de frontera con entradas válidas e inválidas.
- [ ] **CA-2 (Puerto y matriz):** `IContextSourceAdapter` (HU §4.2) y matriz `Record<ContextSourceType, IContextSourceAdapter>` inyectada por constructor en `IngestContextUseCase`.
- [ ] **CA-3 (Circuit Breaker integrado):** Por cada fuente `ACTIVE`, el resultado del adaptador aplica la función de PBI-CTX-004 y persiste la transición. Test: tres fallos consecutivos ⇒ `DEGRADED`, `failedAttempts = 3` y la cuarta ejecución no la consulta (Escenario 1); éxito con `failedAttempts = 2` ⇒ 0 y `lastSuccessAt` actualizado (Escenario 2).
- [ ] **CA-4 (Aislamiento entre fuentes):** El fallo de una fuente no aborta las demás.
- [ ] **CA-5 (Deduplicación):** Entradas cuyo `id` y `contentHash` ya existen en `context_memory` no se embeben. Test: segunda ingesta sin cambios ⇒ 0 llamadas a `generateEmbedding` (Escenario 6).
- [ ] **CA-6 (Vectorización fail-closed):** `generateEmbedding(summary)` con `source === 'fallback'` ⇒ la entrada no se escribe y se emite `WARN` con contexto `LLM_ENGINE` (Escenario 5).
- [ ] **CA-7 (Persistencia):** `IVectorStorePort.upsert('context_memory', docs)` con `VectorDocument { id, vector, text: summary, metadata }`. Tabla separada de `cognitive_memories` y `semantic_prompt_cache`.
- [ ] **CA-8 (Caducidad):** Al final de la ejecución se eliminan de `context_memory` las entradas con `expiresAt < now`. Test con entradas caducadas (Escenario 6). Verificar que el filtro de `IVectorStorePort.delete` soporta la condición; si no, ampliar el puerto y su adaptador con test.
- [ ] **CA-9 (Route Handler):** `POST /api/context/ingest` con el mismo esquema fail-closed de `CRON_SECRET` que `/api/telemetry/prune` (Bearer o `x-cron-secret`, `constantTimeEqual`, 401 en producción sin secreto). Test: sin secreto o inválido ⇒ 401 y ninguna fuente consultada (Escenario 8).
- [ ] **CA-10 (Telemetría):** Un `TelemetryLog` por ejecución con `fetched`, `deduplicated`, `persisted`, `discardedFallback`, `sourcesDegraded`.
- [ ] **CA-11 (Planificación):** Entrada diaria (madrugada) para `/api/context/ingest` añadida a `src/cron/crontab`.
- [ ] **CA-12 (Oráculos):** `tsc --noEmit`, `eslint`, `vitest run` y `npm run build` en verde.

---

## 3. Fuera de Alcance

- Adaptadores reales por tipo de fuente (PBI-CTX-006, 007, 008).
- Consumo del contexto en el planner (PBI-CTX-011).
