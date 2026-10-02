# [ARQUITECTURA] Documento Destilado: PBI - Recuperación RAG de Contexto Hiperlocal en el Generador Táctico

**Identificador:** PBI-CTX-011
**Estatus:** Pendiente (bloqueado por PBI-CTX-005 y por disponer de al menos un adaptador real)
**Fecha de Creación:** 2026-09-30
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 18: Motor de Contexto Autónomo, RAG Dinámico y Autogestión de Fuentes](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2018%3A%20Motor%20de%20Contexto%20Aut%C3%B3nomo%2C%20RAG%20Din%C3%A1mico%20y%20Autogesti%C3%B3n%20de%20Fuentes.md) · §7 · Escenario 7
**Módulo:** `src/features/context-sources/` (`IContextRetrievalPort` + adaptador LanceDB), `src/features/planner/generate-tactical-route.use-case.ts`, composición en `src/features/planner/server.ts`
**Entorno:** LanceDB (`context_memory`), `IEmbeddingPort.generateEmbedding`, `AiGeneratorPort.generateTacticalRoute`
**Prioridad:** Alta (P1 — sin este PBI la ingesta no aporta valor al usuario)
**Estimación Táctica:** 3 Story Points
**Depende de:** PBI-CTX-005, PBI-CTX-006 o PBI-CTX-007 (datos reales)
**Bloquea:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Búsqueda K-NN sobre `context_memory` e inyección de hasta K=5 entradas compactas en el prompt del generador táctico.
- **Entorno:** `GenerateTacticalRouteUseCase` hoy recibe `aiPort` y `telemetryRepo` por constructor y llama a `aiPort.generateTacticalRoute(prompt)`; el contexto se antepone al prompt.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Solo entradas vigentes (`expiresAt > now`); el embedding de consulta con `source === 'fallback'` no se usa para buscar (vecinos falsos).
  - *Filtro B:* Puerto opcional inyectado por constructor (Pure DI), resultado en `OperationEnvelope<ContextEntry[]>`.
  - *Filtro C:* Formato compacto `title · startsAt · location.name · url`; máximo K=5.

---

## 1. Declaración de Intención (INVEST)

**Como** turista que pide un itinerario,
**Quiero** que la ruta propuesta tenga en cuenta eventos y lugares actuales de Barcelona,
**Para** recibir recomendaciones vigentes y no solo conocimiento genérico del modelo.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Puerto):** `IContextRetrievalPort.search(queryVector, { limit, category?, notExpired: true })` con adaptador sobre `IVectorStorePort.search('context_memory', ...)` y filtrado de caducadas.
- [ ] **CA-2 (Inyección):** `GenerateTacticalRouteUseCase` recibe el puerto y el `IEmbeddingPort` como dependencias opcionales por constructor; antepone al prompt un bloque de contexto con ≤ 5 entradas compactas.
- [ ] **CA-3 (Embedding de consulta):** Si `generateEmbedding(prompt)` devuelve `source === 'fallback'`, no se busca y se continúa sin contexto con `WARN` (`LLM_ENGINE`).
- [ ] **CA-4 (Fail-soft):** LanceDB caído o 0 resultados ⇒ la ruta se genera igual, con `WARN`. Test con puerto que lanza error.
- [ ] **CA-5 (Trazabilidad):** La telemetría de la generación registra los `id` de las entradas inyectadas (Escenario 7).
- [ ] **CA-6 (Composición):** Cableado en `src/features/planner/server.ts` sin romper los consumidores actuales (tests existentes del planner en verde).
- [ ] **CA-7 (Oráculos):** `tsc --noEmit`, `eslint`, `vitest run` y `npm run build` en verde.
