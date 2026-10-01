# [ARQUITECTURA] Documento Destilado: PBI - Recuperación K-NN Acotada a Sesión y Telemetría de Memory Hit

**Identificador:** PBI-MEM-003  
**Estatus:** Completado (S+ Grade)  
**Fecha de Creación:** 2026-09-30  
**Fecha de Certificación:** 2026-10-01  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] HU 17: Reconexión de la Memoria Cognitiva a Largo Plazo y Pipeline de Indexación Vectorial (S+ Grade)](../../HistoriasDeUsuario/%5BARQUITECTURA%5D%20HU%2017%3A%20Reconexi%C3%B3n%20de%20la%20Memoria%20Cognitiva%20a%20Largo%20Plazo%20y%20Pipeline%20de%20Indexaci%C3%B3n%20Vectorial%20%28S%2B%20Grade%29.md) · §3.4 · Escenario 2  
**Módulo:** `src/features/cognitive-memory/` (`vector-store.port.ts`, `lancedb-vector.adapter.ts`, `lancedb-cognitive-memory.adapter.ts`), `src/features/triage/triage-input.use-case.ts` (pasos 1.1 y 2.1), `src/features/telemetry/telemetry.schema.ts`  
**Entorno:** LanceDB (`cognitive_memories`, distancia coseno), `IEmbeddingPort.generateEmbedding`  
**Prioridad:** Alta (P1)  
**Estimación Táctica:** 3 Story Points  
**Depende de:** PBI-MEM-001, PBI-MEM-002  
**Bloquea:** PBI-MEM-005  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Activar la búsqueda K-NN (`searchSimilarMemories`, hoy sin ningún consumidor) como segunda estrategia de recuperación y hacer medible cada recuperación de memoria.
- **Estado real del código (2026-09-30):**
  1. La rehidratación solo usa búsqueda exacta por id `sessionId:matrixId`. Si el usuario cambia de matriz (p. ej. de `gastronomy` a `default`), la migración solo cubre `default → otra`, no el sentido inverso, y la memoria no se encuentra.
  2. `searchSimilarMemories` filtra por `sessionId` **después** de aplicar `limit` sobre toda la tabla: con suficientes sesiones, los vecinos de la propia sesión quedan fuera del top-K y devuelve 0 aunque existan.
  3. No existe telemetría de recuperación de memoria. El indicador *"0 cache hits en 7 días"* citado en la HU corresponde a la caché semántica (`cacheHit` en `TRIAGE_ROUTED`), no a esta memoria: hoy no hay forma de medir el Escenario 2.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A:* Un embedding de consulta con `source === 'fallback'` no se usa para buscar (devolvería vecinos falsos).
  - *Filtro B:* La búsqueda **siempre** va acotada a la sesión propia; nunca se recuperan memorias de otro `bx_session_id` (coherente con el aislamiento de PBI-STEEL-003).
  - *Filtro C:* Un único embedding del prompt por turno, reutilizado por la caché semántica y por la memoria.

---

## 1. Declaración de Intención (INVEST)

**Como** turista que vuelve con una petición relacionada con lo que ya hablé,  
**Quiero** que el sistema encuentre mi contexto aunque la conversación anterior se clasificara en otra matriz,  
**Para** no repetir lo que ya dije.  

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Prefiltro en el puerto):** `IVectorStorePort.search(tableName, vector, { limit?, where? })` con prefiltro aplicado en LanceDB antes del top-K. Se actualizan el adaptador y todos los consumidores (caché semántica incluida). Test: 50 filas de otras sesiones más cercanas y 1 de la sesión objetivo ⇒ se devuelve la de la sesión objetivo.
- [x] **CA-2 (Sesión obligatoria):** `searchSimilarMemories(queryVector, { sessionId, limit, minSimilarity })` con `sessionId` **obligatorio** en el tipo; el prefiltro escapa comillas como el resto del adaptador. Test de no-fuga entre sesiones.
- [x] **CA-3 (Cadena de recuperación declarativa):** Estrategias ordenadas `exact → knn` en un array; se detiene en el primer acierto. `knn` solo se ejecuta si `exact` no encuentra nada y hay embedding `provider`. Umbral `minSimilarity` como constante nombrada (`COGNITIVE_MEMORY_KNN_MIN_SIMILARITY = 0.75`).
- [x] **CA-4 (Embedding único):** El embedding del prompt se calcula una vez, antes del paso 1.1, si hay `embeddingPort` (con independencia de que exista `semanticCache`), y se reutiliza en el paso 2.1. Test: una sola llamada a `generateEmbedding(prompt)` por turno.
- [x] **CA-5 (Telemetría de recuperación):** Cada turno con memoria disponible emite `INFO` con `eventType: 'COGNITIVE_MEMORY_RECALL'`, `sessionId`, `matrixId`, `memoryHit: boolean`, `strategy: 'exact' | 'knn' | 'none'` y `similarity` cuando aplique. Esquema Zod añadido a `HybridOrchestrationEventSchema`.
- [x] **CA-6 (Fail-soft):** LanceDB caído o embedding `fallback` ⇒ `strategy: 'none'`, `WARN` y el triaje continúa sin memoria.
- [x] **CA-7 (Escenario 2):** Test: sesión con memoria indexada en `gastronomy` y nueva petición en `default` semánticamente relacionada ⇒ `knn` devuelve ≥ 1 vecino, se inyectan las variables duraderas y `memoryHit: true`.
- [x] **CA-8 (Oráculos):** `tsc --noEmit`, `eslint --max-warnings 0`, `vitest run` (94 archivos, 526 tests) y `npm run build` en verde.

---

## 3. Fuera de Alcance

- K-NN global entre sesiones (implica compartir memoria entre usuarios; requiere decisión explícita de privacidad).
- Aislamiento de sesión de la caché semántica (`F-03`, ya cubierto por PBI-STEEL-003).

---

## 4. Evidencia de Certificación y Oráculos

1. **Compilador TypeScript (`tsc --noEmit`):**
   - 0 errores de tipado en todo el monorepo.
2. **Linter AST (`eslint --max-warnings 0`):**
   - 0 advertencias, 0 errores.
3. **Tests Unitarios y de Integración (`vitest run`):**
   - 94 archivos evaluados, 526 tests ejecutados, 100% pasando en verde.
   - Tests específicos colocados:
     - `lancedb-vector.adapter.test.ts`: CA-1 prefiltro `where` antes del top-K con 50 documentos más cercanos de otras sesiones.
     - `lancedb-cognitive-memory.adapter.test.ts`: CA-2 aislamiento estricto por `sessionId` sin fugas cross-sesión.
     - `triage.test.ts`: CA-7 & CA-5 recuperación K-NN y telemetría `COGNITIVE_MEMORY_RECALL`; CA-4 cálculo único del embedding del prompt para memoria y caché semántica; CA-6 fail-soft ante degradación o embedding de fallback.
4. **Construcción de Producción Next.js (`npm run build`):**
   - Compilación Turbopack y optimización estática completadas exitosamente en 3.1s.
