# [ARQUITECTURA] Documento Destilado: PBI - Indexación Vectorial Explícita de Cada Turno Consolidado con Sobre Determinista

**Identificador:** PBI-MEM-001  
**Estatus:** Realizado  
**Fecha de Creación:** 2026-09-30  
**Fecha de Finalización:** 2026-10-01  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 17: Reconexión de la Memoria Cognitiva a Largo Plazo y Pipeline de Indexación Vectorial (S+ Grade)](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2017%3A%20Reconexi%C3%B3n%20de%20la%20Memoria%20Cognitiva%20a%20Largo%20Plazo%20y%20Pipeline%20de%20Indexaci%C3%B3n%20Vectorial%20%28S%2B%20Grade%29.md) · §3.2, §3.3 · Escenarios 1, 3  
**Módulo:** `src/features/cognitive-memory/` (`index-session-memory.service.ts` + matriz `COGNITIVE_MEMORY_INDEXING_POLICY`), `src/features/triage/triage-input.use-case.ts`  
**Entorno:** LanceDB (`cognitive_memories`) vía `ICognitiveMemoryPort.persistMemory`, `IEmbeddingPort.generateEmbedding` (`GeminiEmbeddingAdapter`, 768 dims)  
**Prioridad:** Alta (P1)  
**Estimación Táctica:** 3 Story Points  
**Depende de:** —  
**Bloquea:** PBI-MEM-003, PBI-MEM-005  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Convertir la persistencia vectorial en un efecto explícito, declarativo y observable del triaje, y extenderla a los turnos que hoy se pierden.
- **Estado real del código (2026-09-30):** `TriageInputUseCase` ya persiste la `DenseSemanticMatrix` y ya descarta los vectores con `source === 'fallback'` (líneas 480-499, entregado en PBI-STEEL-002 CA-4), pero:
  1. Solo indexaba en el flujo de despacho (umbral ≥ 60 %). Los turnos `INCOMPLETE_REPROMPT` guardaban el progreso en `InMemoryDensityMatrixRepository`, que es **volátil**: un reinicio o despliegue del contenedor borraba las preferencias ya reveladas.
  2. El descarte por `fallback` era **silencioso**: no emitía telemetría, por lo que no había forma de medir el Escenario 3.
  3. La lógica vivía inline en un caso de uso de ~930 líneas, sin sobre `OperationEnvelope<T>` (Axioma V).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Pureza del Corpus):* Solo se persiste con `source === 'provider'`; `fallback` ⇒ descarte + `WARN`.
  - *Filtro B (Axioma V):* El servicio devuelve `OperationEnvelope<MemoryIndexingResult>`; decisión por matriz `Record<TriageStatus, ...>`, simétrica a `TRIAGE_SEMANTIC_CACHE_POLICY`.
  - *Filtro C (Eficiencia Térmica):* No se re-embebe si la cadena densa no cambió respecto a la última indexada de la sesión.

> **Reconciliación terminológica:** la HU habla de `origin: 'model' | 'deterministic-fallback'`. El contrato vigente de `IEmbeddingPort` es `source: 'provider' | 'fallback'`; **se conserva** para no romper consumidores (triaje, caché semántica, ingesta de HU-18).

---

## 1. Declaración de Intención (INVEST)

**Como** turista que revela sus preferencias a lo largo de varios turnos,  
**Quiero** que cada turno con información nueva quede indexado en la memoria de largo plazo,  
**Para** no perder lo que ya conté aunque no haya llegado a pedir el itinerario o el servidor se haya reiniciado.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Matriz declarativa):** `COGNITIVE_MEMORY_INDEXING_POLICY: Record<TriageStatus, { indexable: boolean }>` con `DISPATCH_READY`, `DISPATCH_CLAUDICATION` e `INCOMPLETE_REPROMPT` indexables; `CASUAL_DIALOGUE` y `REBOUND_OUT_OF_SCOPE` no. Test de tabla sobre los cinco estados.
- [x] **CA-2 (Servicio con Pure DI):** `IndexSessionMemoryService` recibe `ICognitiveMemoryPort`, `IEmbeddingPort` y `TelemetryRepositoryPort` opcional por constructor y expone `index(matrix, status, priorPayload?): Promise<OperationEnvelope<MemoryIndexingResult>>`, con `MemoryIndexingResult.outcome ∈ { 'INDEXED', 'DISCARDED_FALLBACK', 'SKIPPED_UNCHANGED', 'SKIPPED_POLICY', 'SKIPPED_EMPTY', 'FAILED' }`. Usa `@/shared/operation-envelope`.
- [x] **CA-3 (Turnos parciales):** En `INCOMPLETE_REPROMPT` se indexa si el payload contiene al menos una variable duradera (`group_size`, `vibe`, `constraints`, `districts`, `mood`). `toDensePromptString() === '[Contexto: Base]'` ⇒ `SKIPPED_EMPTY` sin llamada a `generateEmbedding`.
- [x] **CA-4 (Fail-closed de persistencia, Escenario 3):** `source === 'fallback'` ⇒ no se llama a `persistMemory`, `outcome = 'DISCARDED_FALLBACK'` y se emite **un** `WARN` con contexto `LLM_ENGINE`, `eventType: 'COGNITIVE_MEMORY_INDEXING'`, `sessionId`, `matrixId`. El flujo del usuario continúa.
- [x] **CA-5 (Deduplicación):** Si la cadena densa del payload fusionado coincide con la del payload previo del turno (`priorPayload`, venga de `matrixRepo` o de LanceDB) ⇒ `SKIPPED_UNCHANGED`, 0 llamadas a `generateEmbedding`. Test: dos turnos idénticos ⇒ una sola vectorización.
- [x] **CA-6 (Fail-soft ante LanceDB):** Excepción en `persistMemory` ⇒ `outcome = 'FAILED'`, `WARN` (se mantiene el mensaje actual `[Triage Fail-Soft]`) y el itinerario se genera igual.
- [x] **CA-7 (Telemetría de éxito, Escenario 1):** `INDEXED` emite `INFO` con `eventType: 'COGNITIVE_MEMORY_INDEXING'`, `outcome`, `sessionId`, `matrixId`. Esquema Zod `CognitiveMemoryIndexingEventSchema` añadido a `HybridOrchestrationEventSchema` en `telemetry.schema.ts`.
- [x] **CA-8 (Reconexión en el caso de uso):** `TriageInputUseCase` delega en el servicio en los flujos `INCOMPLETE_REPROMPT`, `DISPATCH_READY` y `DISPATCH_CLAUDICATION`; se elimina el bloque inline de las líneas 480-499. La firma pública del constructor no cambia (el servicio se compone a partir de `cognitiveMemory` + `embeddingPort` ya inyectados).
- [x] **CA-9 (Tests colocalizados):** `index-session-memory.service.test.ts` cubre los seis `outcome`; `triage.test.ts` verifica una llamada a `persistMemory` en un turno parcial y ninguna con embedding `fallback`. Los tests existentes del triaje siguen en verde.
- [x] **CA-10 (Oráculos):** `tsc --noEmit`, `eslint --max-warnings 0`, `vitest run` y `npm run build` en verde.

---

## 3. Evidencia de Cumplimiento

- **Servicio y Política:** `src/features/cognitive-memory/index-session-memory.service.ts` implementa la orquestación de indexación desacoplada y tipada bajo `OperationEnvelope<MemoryIndexingResult>`.
- **Esquema de Telemetría:** `CognitiveMemoryIndexingEventSchema` y `CognitiveMemoryIndexingOutcomeSchema` incorporados en `src/features/telemetry/telemetry.schema.ts` dentro de `HybridOrchestrationEventSchema`.
- **Caso de Uso:** `TriageInputUseCase` delega explícitamente en `sessionMemoryIndexer` en `INCOMPLETE_REPROMPT`, `DISPATCH_CLAUDICATION` y `DISPATCH_READY`.
- **Oráculos:**
  - `tsc --noEmit`: 0 errores.
  - `eslint --max-warnings 0`: 0 warnings.
  - `vitest run`: 94 suites pasadas (514 tests).
  - `npm run build`: Compilación Turbo App Router completada exitosamente.
