# [ARQUITECTURA] Historia de Usuario 17: Reconexión de la Memoria Cognitiva a Largo Plazo y Pipeline de Indexación Vectorial (S+ Grade)

**Identificador:** HU-ARCH-COG-017  
**Estatus:** Completado / Certificado (S+ Grade)  
**Fecha de Revisión:** 2026-09-29  
**Fecha de Finalización:** 2026-10-01  
**Autor:** Arquitectura BarcelonaXplorer (destilado de FUENTE-ANEXO-EVOL-001)  
**Módulo:** Memoria Cognitiva (LanceDB) / Aduana Universal (Triaje) / Motor de Embeddings  
**HU Antecesora:** [Historia de Usuario 5: Memoria Cognitiva Vectorial (HU-ARCH-COG-005)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/Historia%20de%20Usuario%205:%20Memoria%20Cognitiva%20Vectorial%20y%20Optimizaci%C3%B3n%20Termodin%C3%A1mica%20para%20LLM.md) — *entrega funcional completada y certificada bajo HU 17.*

**Fuentes de la Brecha:**
- [FUENTE-ANEXO-EVOL-001 §5.4](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Fuentes/%5BANEXO%5D%20Destilado%20de%20Contexto%20Evolutivo%20y%20T%C3%A9cnico%20-%20Auditor%C3%ADas,%20Historias%20y%20PBIs%20Realizados.md) — *"El pipeline conversacional (`TriageInputUseCase`) no indexa fragmentos vectoriales de la conversación. La memoria semántica a largo plazo (HU-5) sigue desconectada."*
- [`AUD-OPS-STEEL-001` F-02](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/) — Vectores falsos de embedding (fallback determinista) corrompen la similitud semántica en LanceDB (16 eventos en producción resueltos).

---

## Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Cierre del lazo de persistencia y recuperación RAG. Reconexión del pipeline conversacional a la memoria vectorial embebida (LanceDB) y garantía de pureza semántica del corpus indexado.
- **Entorno:** Backend Next.js App Router — caso de uso [`TriageInputUseCase`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage-input.use-case.ts), feature [`cognitive-memory`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/cognitive-memory/) (LanceDB + embeddings), motor de embeddings vía IA Gateway.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Cero Alucinación / Pureza del Corpus):* Se erradica la contaminación de la memoria a largo plazo con vectores pseudoaleatorios. Un embedding no verificado **no se persiste**: envenena la búsqueda K-NN y devuelve vecinos falsos.
  - *Filtro B (Determinismo Hexagonal):* La indexación es un efecto explícito del pipeline de triaje, no un side-effect implícito. Contrato a través de [`ICognitiveMemoryPort`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/cognitive-memory/cognitive-memory.port.ts) e [`IEmbeddingPort`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/ai-engine); toda comunicación bajo `OperationEnvelope<T>` (Axioma V).
  - *Filtro C (Eficiencia Térmica):* Solo se indexa la `DenseSemanticMatrix` destilada (no transcripciones crudas). La recuperación RAG inyecta contexto compacto, minimizando el peaje termodinámico del orquestador pesado.

---

## 1. Descripción General (INVEST)

**Como** turista recurrente que conversa con el Conserje Efímero a lo largo de varias sesiones,  
**Quiero** que el sistema recuerde de forma persistente las preferencias, restricciones y contexto que ya revelé (grupo, vibe, presupuesto, procedencia), indexándolos como memoria semántica de largo plazo,  
**Para** que cada nueva interacción parta del conocimiento acumulado sin repetir el interrogatorio, y el itinerario generado herede mi contexto histórico con fricción cero.

> **Nota de gobernanza:** Esta HU **completa la promesa funcional de HU-5**, cuya infraestructura (LanceDB, puertos, embeddings) estaba desplegada pero cuyo lazo de indexación conversacional permanecía desconectado. No introduce infraestructura nueva: **reconecta y verifica** la existente.

---

## 2. Justificación Arquitectónica (Vía de la Red)

HU-5 desplegó el motor vectorial (LanceDB embebido), los puertos (`ICognitiveMemoryPort`, `IEmbeddingPort`, `ICognitiveMetricsPort`) y el Value Object `DenseSemanticMatrix`. Sin embargo, el estado real certificado en el anexo evolutivo reveló dos fracturas que anulaban el valor de usuario:

1. **Lazo abierto de indexación:** El `TriageInputUseCase` destilaba la matriz densa y la recuperaba vía RAG, pero **no persistía sistemáticamente** el fragmento vectorial de cada turno consolidado. Resultado empírico: **0 *cache hits* en los últimos 7 días** y memoria a largo plazo inoperante. Resuelto mediante `IndexSessionMemoryService` (PBI-MEM-001).
2. **Corpus envenenado:** El adaptador de embeddings, ante error 404/503 del modelo, generaba un vector pseudoaleatorio derivado de hash (fallback determinista) y **lo persistía** como si fuera semántico. Purgado con éxito en producción (13 vectores eliminados en Nodo 11, 0 restantes) y protegido contra persistencia (PBI-MEM-001 y PBI-MEM-004).

La corrección implementada es el *fail-closed de persistencia*: **un embedding degradado puede servir al usuario en caliente, pero jamás se escribe en el corpus de largo plazo.** La pureza del índice vectorial queda blindada al 100%.

---

## 3. Coreografía de la Reconexión (RAG de Ciclo Cerrado)

1. **Destilación Pre-Vectorial (existente):**
   Cada turno consolidado de la Aduana Universal transmuta el diálogo en `DenseSemanticMatrix` (`toDensePromptString()`), purgada de ruido conversacional.

2. **Vectorización Verificada (reforzado):**
   La matriz se envía a [`IEmbeddingPort`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/ai-engine) (Gemini Embedding vía IA Gateway). El sobre `OperationEnvelope<T>` distingue explícitamente `origin: 'model' | 'deterministic-fallback'`.

3. **Indexación Condicionada (nuevo lazo):**
   El `TriageInputUseCase` persiste el vector en la tabla `cognitive_memories` de LanceDB, ligado a `bx_session_id`, **únicamente si `origin === 'model'`**. Un `deterministic-fallback` se usa en caliente para no romper el flujo, pero emite telemetría `WARN` bajo `AI_INFERENCE` y **se descarta de la persistencia**.

4. **Recuperación RAG Silenciosa (verificado):**
   Ante nueva petición o al superar el umbral (≥60%), el motor consulta LanceDB (`getLatestSessionMemory` / K-NN con prefiltro determinista de `sessionId`) e inyecta el contexto histórico compacto en el prompt del orquestador.

5. **Higiene del Corpus (saneamiento):**
   Los vectores falsos preexistentes se purgaron mediante el script CJS ejecutable `scripts/purge-lancedb-fallback-vectors.cjs` y playbook Ansible en producción, complementado con la sonda de pureza en `/Admin/Cognitive`.

---

## 4. Criterios de Aceptación (Verificación Empírica)

- [x] **Escenario 1 — Cierre del Lazo de Indexación:**
  *Dado* un turno de triaje consolidado con embedding de origen `model`,
  *cuando* el `TriageInputUseCase` finaliza el turno,
  *entonces* existe un registro nuevo en `cognitive_memories` (LanceDB) ligado al `bx_session_id`, verificable por sonda.
  *(Certificado en [PBI-MEM-001](../PBI/Realizado/PBI%20-%20Pipeline%20de%20Indexaci%C3%B3n%20Vectorial%20en%20el%20Turno%20de%20Triaje%20%28P1%29.md) y test de integración `triage-memory.integration.test.ts` CA-1)*.

- [x] **Escenario 2 — Recuperación RAG Efectiva (Cache Hit):**
  *Dado* un `bx_session_id` con memoria previa indexada,
  *cuando* el usuario inicia una nueva petición semánticamente relacionada,
  *entonces* la búsqueda K-NN devuelve ≥1 vecino real y el contexto histórico se inyecta al orquestador sin re-preguntar variables ya conocidas (cache hit registrado en telemetría `COGNITIVE_MEMORY_RECALL`).
  *(Certificado en [PBI-MEM-003](../PBI/Realizado/PBI%20-%20Recuperaci%C3%B3n%20RAG%20por%20Similitud%20Sem%C3%A1ntica%20y%20Prefiltro%20de%20Sesi%C3%B3n%20%28P1%29.md) y test de integración `triage-memory.integration.test.ts` CA-4)*.

- [x] **Escenario 3 — Pureza del Corpus (Fail-Closed de Persistencia):**
  *Dado* un fallo del modelo de embeddings (404/503) que activa el fallback determinista,
  *cuando* el pipeline procesa el turno,
  *entonces* el flujo del usuario continúa (fail-soft en caliente), se emite telemetría `WARN`, y **no se escribe ningún vector** en `cognitive_memories`.
  *(Certificado en [PBI-MEM-001](../PBI/Realizado/PBI%20-%20Pipeline%20de%20Indexaci%C3%B3n%20Vectorial%20en%20el%20Turno%20de%20Triaje%20%28P1%29.md) y test de integración `triage-memory.integration.test.ts` CA-2)*.

- [x] **Escenario 4 — Saneamiento del Corpus Histórico:**
  *Dado* el corpus contaminado por vectores falsos históricos (`AUD-OPS-STEEL-001 F-02`),
  *cuando* se ejecuta el saneador `purge-fallback-vectors`,
  *entonces* el índice queda libre de vectores de origen `deterministic-fallback`, verificado por conteo cero en sonda.
  *(Certificado en [PBI-MEM-004](../PBI/Realizado/PBI%20-%20Saneamiento%20Operativo%20del%20Corpus%20Vectorial%20en%20Producci%C3%B3n%20y%20Sonda%20de%20Pureza%20%28P2%29.md) ejecutado con `--apply` en producción Nodo 11: 13 vectores eliminados, 0 restantes)*.

- [x] **Escenario 5 — Refinamiento Cross-Sesión con Contexto Heredado:**
  *Dado* un usuario que en una sesión anterior reveló `grupo: 4`, `vibe: familiar`, `restricción: niños`,
  *cuando* regresa y solicita *"algo para mañana por la tarde"* sin repetir datos,
  *entonces* el itinerario hereda el contexto histórico desde LanceDB sin volver a solicitarlo.
  *(Certificado en [PBI-MEM-002](../PBI/Realizado/PBI%20-%20Esquema%20Zod%20de%20Metadatos%20y%20Rehidrataci%C3%B3n%20Fiel%20de%20la%20Matriz%20Densa%20%28P1%29.md), [PBI-MEM-003](../PBI/Realizado/PBI%20-%20Recuperaci%C3%B3n%20RAG%20por%20Similitud%20Sem%C3%A1ntica%20y%20Prefiltro%20de%20Sesi%C3%B3n%20%28P1%29.md) y suite `triage-memory.integration.test.ts` CA-3)*.

- [x] **Escenario 6 — Cuarteto de Oráculos en Verde:**
  *Dado* el cierre de la implementación,
  *cuando* se ejecuta la Aduana de Fricción,
  *entonces* superan en verde `tsc --noEmit`, `eslint --max-warnings 0`, `vitest run` y `npm run build` (Axioma IV ampliado).
  *(Certificado en [PBI-MEM-005](../PBI/Realizado/PBI%20-%20Certificaci%C3%B3n%20de%20Integraci%C3%B3n%20Cross-Sesi%C3%B3n%20de%20la%20Memoria%20Cognitiva%20sobre%20LanceDB%20Real%20%28P1%29.md): 95 suites de test / 533 tests en verde, 0 advertencias de linter, compilación Next.js 16 exitosa)*.

---

## 5. Contratos, Axiomas y Trazabilidad

| Elemento | Referencia |
|---|---|
| Puerto de memoria vectorial | [`ICognitiveMemoryPort`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/cognitive-memory/cognitive-memory.port.ts) |
| Puerto de embeddings | [`IEmbeddingPort`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/ai-engine) (vía IA Gateway, HU-16) |
| Value Object de compresión | [`DenseSemanticMatrix`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/cognitive-memory/dense-semantic-matrix.vo.ts) |
| Caso de uso reconectado | [`TriageInputUseCase`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage-input.use-case.ts) |
| Saneador de corpus | [`purge-lancedb-fallback-vectors.cjs`](file:///home/racso/Proyectos/BarcelonaXplorer/scripts/purge-lancedb-fallback-vectors.cjs) |
| Suite de integración end-to-end | [`triage-memory.integration.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage-memory.integration.test.ts) |
| Axiomas aplicados | I (Localidad ≤3 hops), II (Zod en frontera), IV (Cuarteto de Oráculos), V (`OperationEnvelope<T>`) |

**Deuda técnica absorbida:** `AUD-OPS-STEEL-001 F-02` (vectores falsos) y la brecha crítica de §5.4 del anexo evolutivo (pipeline desconectado).

---

## 6. Registro de Despliegue de PBIs

| PBI | Descripción | Commit | Estatus |
|---|---|---|---|
| **PBI-MEM-001** | Pipeline de Indexación Vectorial en el Turno de Triaje | `c57fd39` | Realizado |
| **PBI-MEM-002** | Esquema Zod de Metadatos y Rehidratación Fiel de la Matriz Densa | `593e9de` | Realizado |
| **PBI-MEM-003** | Recuperación RAG por Similitud Semántica y Prefiltro de Sesión | `7e857a2` | Realizado |
| **PBI-MEM-004** | Saneamiento Operativo del Corpus Vectorial en Producción y Sonda de Pureza | `2489187` | Realizado |
| **PBI-MEM-005** | Certificación de Integración Cross-Sesión de la Memoria Cognitiva sobre LanceDB Real | `f4c5567` | Realizado |
