# [ARQUITECTURA] Documento Destilado: PBI - Recuperación RAG de Contexto Hiperlocal en el Generador Táctico

**Identificador:** PBI-CTX-011  
**Estatus:** Realizado  
**Fecha de Creación:** 2026-09-30  
**Fecha de Finalización:** 2026-10-02  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §7 · Escenario 7  
**Módulo:** `src/features/context-sources/` (`IContextRetrievalPort` + adaptador LanceDB), `src/features/planner/generate-tactical-route.use-case.ts`, composición en `src/features/planner/server.ts` y `src/app/api/triage/route.ts`  
**Entorno:** LanceDB (`context_memory`), `IEmbeddingPort.generateEmbedding`, `AiGeneratorPort.generateTacticalRoute`  
**Prioridad:** Alta (P1 — sin este PBI la ingesta no aporta valor al usuario)  
**Estimación Táctica:** 3 Story Points  
**Depende de:** PBI-CTX-005, PBI-CTX-006 o PBI-CTX-007 (datos reales)  
**Bloquea:** —  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Búsqueda K-NN sobre `context_memory` e inyección de hasta K=5 entradas compactas en el prompt del generador táctico.
- **Entorno:** `GenerateTacticalRouteUseCase` recibe `aiPort`, `telemetryRepo`, `contextRetrievalPort` y `embeddingPort` por constructor (Pure DI); el bloque de contexto delimitado se antepone al prompt de generación.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Solo entradas vigentes (`expiresAt > now`); el embedding de consulta con `source === 'fallback'` no se usa para buscar (evita vecinos falsos).
  - *Filtro B:* Puerto opcional inyectado por constructor (Pure DI), resultado tipado con `ContextEntry[]`.
  - *Filtro C:* Formato compacto `title · startsAt · location.name · url`; máximo K=5.

---

## 1. Declaración de Intención (INVEST)

**Como** turista que pide un itinerario,  
**Quiero** que la ruta propuesta tenga en cuenta eventos y lugares actuales de Barcelona,  
**Para** recibir recomendaciones vigentes y no solo conocimiento genérico del modelo.  

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Puerto):** `IContextRetrievalPort.search(queryVector, { limit, category?, notExpired: true })` con adaptador sobre `IVectorStorePort.search('context_memory', ...)` y filtrado de caducadas implementado en `LanceDbContextRetrievalAdapter`.
- [x] **CA-2 (Inyección):** `GenerateTacticalRouteUseCase` recibe el puerto y el `IEmbeddingPort` como dependencias opcionales por constructor (Pure DI); antepone al prompt un bloque de contexto hiperlocal delimitado con ≤ 5 entradas compactas (`title · startsAt · location.name · url`).
- [x] **CA-3 (Embedding de consulta):** Si `generateEmbedding(prompt)` devuelve `source === 'fallback'`, no se busca y se continúa sin contexto registrando WARN `LLM_ENGINE`.
- [x] **CA-4 (Fail-soft):** LanceDB caído, error de búsqueda o 0 resultados ⇒ la ruta se genera con normalidad registrando WARN en telemetría. Testeado con puerto que lanza error.
- [x] **CA-5 (Trazabilidad):** La telemetría de la generación registra `contextEntriesInjectedCount` y los `contextEntryIds` inyectados (Escenario 7 de HU 18).
- [x] **CA-6 (Composición):** Cableado en `src/app/api/triage/route.ts` manteniendo compatibilidad retroactiva completa y tests unitarios colocalizados.
- [x] **CA-7 (Oráculos):** `tsc --noEmit`, `eslint`, `vitest run` (111 test files, 613 tests) y `npm run build` en verde.

---

## 3. Evidencias de Verificación y Oráculos

### Tests Unitarios Colocalizados
- `src/features/context-sources/lancedb-context-retrieval.adapter.test.ts`: 4 tests pasando (búsqueda filtrada, exclusión de caducadas, manejo de errores).
- `src/features/planner/generate-tactical-route.test.ts`: 11 tests pasando (inyección K=5, fail-soft en LanceDB caído, rechazo de embedding fallback, registro en telemetría).
- `src/app/api/triage/route.test.ts`: 4 tests pasando (integración con el pipeline de triage).

### Oráculos del Protocolo de Acero
- `npx tsc --noEmit`: 0 errores.
- `npm run lint`: 0 advertencias / 0 errores.
- `vitest run`: 111 suites pasando (613 tests).
- `npm run build`: Build de producción de Next.js (Turbopack) 100% exitoso.
