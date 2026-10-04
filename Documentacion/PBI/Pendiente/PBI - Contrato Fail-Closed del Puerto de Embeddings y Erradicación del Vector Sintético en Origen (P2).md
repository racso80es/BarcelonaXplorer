---
# [ARQUITECTURA] Documento Destilado: PBI - Contrato Fail-Closed del Puerto de Embeddings y Erradicación del Vector Sintético en Origen

**Identificador:** PBI-MEM-006  
**Estatus:** Pendiente  
**Fecha de Creación:** 2026-10-04  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 17: Reconexión de la Memoria Cognitiva a Largo Plazo y Pipeline de Indexación Vectorial (S+ Grade)](../../HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20HU%2017%3A%20Reconexi%C3%B3n%20de%20la%20Memoria%20Cognitiva%20a%20Largo%20Plazo%20y%20Pipeline%20de%20Indexaci%C3%B3n%20Vectorial%20%28S%2B%20Grade%29.md)  
**Origen:** Auditoría de la propuesta «[ARQUITECTURA] Propuesta de Refactorización: Resiliencia del Almacén Vectorial» (2026-10-04) · alerta de telemetría local `cmutd9lgp0004fr2p24aakmzi`  
**Módulo:** `src/features/ai-engine/` (`embedding.port.ts`, `gemini-embedding.adapter.ts`, `deterministic-embedding-fallback.ts`) y sus consumidores en `cognitive-memory/`, `context-sources/`, `planner/`, `triage/`  
**Entorno:** Local (purga del histórico) · Producción sin cambios operativos (Nodo 11 ya purgado el 2026-10-01, PBI-MEM-004)  
**Prioridad:** Media (P2)  
**Estimación Táctica:** 3 Story Points  
**Depende de:** —  
**Bloquea:** —  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Refactor de contrato. El puerto de embeddings deja de fabricar vectores sintéticos; el fallo del proveedor se expresa por tipos, no por convención.
- **Estado real (2026-10-04):**
  - Los cuatro consumidores de `IEmbeddingPort` ya descartan `source === 'fallback'` antes de persistir o buscar: `index-session-memory.service.ts` (L141), `ingest-context.use-case.ts` (L137), `triage-input.use-case.ts` (L112, que también bloquea la caché semántica en L1045) y `generate-tactical-route.use-case.ts` (L48).
  - Sin embargo, `GeminiEmbeddingAdapter.generateEmbedding()` **sigue devolviendo un `vector` sintético** (`buildDeterministicFallbackVector`) junto a `source: 'fallback'`. La integridad del corpus depende de que cada consumidor futuro recuerde la guarda (riesgo latente, Axiomas II y V).
  - Corpus local (`src/data/lancedb`): 10 vectores sintéticos heredados (3 en `cognitive_memories`, 7 en `semantic_prompt_cache`), con ficheros fechados el 26–27/09, **anteriores** a las guardas de PBI-STEEL-002. Son los que disparan la alerta `WARN [LanceDB] Vectores de fallback detectados en corpus: 10`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Ningún vector que no proceda del proveedor puede llegar a LanceDB, porque el contrato hace imposible representarlo.
  - *Filtro B (Axioma V):* Respuesta en `OperationEnvelope<number[]>` (`src/shared/operation-envelope.ts`) en lugar del par `{ vector, source }`.
  - *Filtro C:* Cero coste extra: se elimina cómputo inútil (generar 768 floats que nadie usa).

### Decisiones de la Auditoría (propuesta descartada parcialmente)

| Vía propuesta | Decisión | Motivo |
| :--- | :--- | :--- |
| 1. Embeddings redundantes multi-proveedor en IA Gateway | **Rechazada** en su forma actual | Vectores de modelos distintos viven en espacios incompatibles (y con dimensiones distintas): mezclarlos corrompe el K-NN de forma indetectable. Solo sería admisible con tabla/índice por modelo. La premisa citaba además `text-embedding-004` (el real es `gemini-embedding-001`) y Jev AI como proveedor de embeddings (no lo es). |
| 2. Cola `pending_vectorization` | **Diferida** (fuera de alcance) | Redundante para contexto hiperlocal (el cron re-ingiere) y caché semántica (oportunista). Solo aportaría valor para la memoria de sesión; se evaluará en un PBI propio si la telemetría muestra pérdidas de recuerdo. |
| 3. Degradación elegante (abortar inserción) | **Ya implementada** | Ver «Estado real». Este PBI la eleva de convención a contrato tipado. |

---

## 1. Declaración de Intención (INVEST)

**Como** forjador de BarcelonaXplorer,  
**Quiero** que el puerto de embeddings no pueda devolver nunca un vector sintético,  
**Para** que la integridad del corpus vectorial no dependa de la disciplina de cada consumidor y desaparezca la necesidad de purgas.  

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Contrato fail-closed):** `IEmbeddingPort.generateEmbedding(text)` retorna `Promise<OperationEnvelope<number[]>>`. En fallo (texto vacío, error transitorio/permanente, dimensión inesperada, sin API key) devuelve `success: false`, sin `result`, con `errors` y `exitCode` que distingan `transient` / `permanent` / `invalid_input`. Se eliminan `EmbeddingGenerationResult` y `EmbeddingVectorSource`.
- [ ] **CA-2 (Validación en frontera):** El vector del proveedor se valida con un esquema Zod (array de `number` finitos, longitud `= getDimensions()`) antes de envolverse en `success: true`. Sin `any`, `as any` ni `!`.
- [ ] **CA-3 (Erradicación en origen):** `GeminiEmbeddingAdapter` deja de importar `buildDeterministicFallbackVector` y se elimina `generateDeterministicFallback()`. El constructor determinista queda importado **solo** por `purge-fallback-vectors.ts`, `audit-lancedb-health` y sus tests (verificable con `grep`).
- [ ] **CA-4 (Migración de consumidores):** Los cuatro consumidores ramifican sobre `envelope.success` y conservan su comportamiento y telemetría actuales (422 `FALLBACK_EMBEDDING_REJECTED` en planner, descarte en ingesta, sin K-NN ni caché en triaje, sin persistencia en memoria de sesión). Cambiar el texto de la telemetría de «fallback» a «embedding no disponible» es opcional y debe quedar documentado.
- [ ] **CA-5 (Telemetría del adaptador intacta):** Se mantienen los `WARN` / `ERROR` en `LLM_ENGINE` del adaptador ya existentes (clasificación transitorio/permanente, dimensión inesperada).
- [ ] **CA-6 (Tests colocados):** Se actualizan `gemini-embedding.adapter.test.ts`, `index-session-memory.service.test.ts`, `ingest-context.use-case.test.ts` y `triage-memory.integration.test.ts`. Se añade un caso por consumidor que verifique que con `success: false` **no se invoca ningún `upsert` sobre LanceDB**.
- [ ] **CA-7 (Saneamiento local):** Se ejecuta `NODE_PATH=src/node_modules node scripts/purge-lancedb-fallback-vectors.cjs --uri ./src/data/lancedb --apply` (previo backup del directorio). Un *dry-run* posterior reporta 0 coincidencias, y la tarjeta `Salud LanceDB` deja de emitir el `WARN` en `SYSTEM`.
- [ ] **CA-8 (Oráculos):** `tsc --noEmit`, `eslint --max-warnings 0`, `vitest run` y `npm run build` en verde.

---

## 3. Fuera de Alcance

- Redundancia de embeddings en IA Gateway (Vía 1): requiere ADR propio sobre versionado de espacios vectoriales.
- Cola de re-vectorización asíncrona (Vía 2).
- Producción: el Nodo 11 ya quedó purgado (PBI-MEM-004, 2026-10-01); la sonda de pureza sigue vigilándolo.
- `scripts/purge-lancedb-fallback-vectors.cjs`: mantiene su copia CommonJS del algoritmo determinista (requisito de ejecución autónoma de PBI-MEM-004 CA-1).

---

## 4. Notas Técnicas

- Ningún consumidor de producción usa hoy el `vector` cuando `source === 'fallback'`, así que la migración no tiene impacto funcional. Solo cambia la forma del contrato.
- Superficie de cambio: 1 puerto + 1 adaptador + 4 consumidores + 4 tests. Excede la regla de ≤ 3 *context hops* por ser un cambio de contrato transversal; se recomienda **un commit por consumidor** tras el commit del puerto y el adaptador.
