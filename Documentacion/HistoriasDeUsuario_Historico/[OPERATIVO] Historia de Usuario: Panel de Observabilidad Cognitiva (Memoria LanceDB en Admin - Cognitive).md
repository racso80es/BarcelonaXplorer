# [OPERATIVO] Historia de Usuario: Panel de Observabilidad Cognitiva (Memoria LanceDB en Admin - Cognitive)

**Identificador:** HU-OPER-COG-006  
**Estatus:** Implementado y Certificado S+ Grade  
**Fecha de Certificación:** 2026-09-25  
**PBI Certificado:** [PBI - Panel de Observabilidad Cognitiva (Memoria LanceDB y KPIs en Admin Cognitive) (PBI-ADMIN-COG-006)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Panel%20de%20Observabilidad%20Cognitiva%20%28Memoria%20LanceDB%20y%20KPIs%20en%20Admin%20Cognitive%29.md)  
**Módulo:** Consola de Administración, Observabilidad Cognitiva y Persistencia Vectorial ([`src/app/Admin/Cognitive/`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin))  
**PBIs Vinculados:**  
- [PBI - Memoria Cognitiva Vectorial y Optimización Termodinámica (LanceDB RAG) (PBI-COG-MEM-005)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Memoria%20Cognitiva%20Vectorial%20y%20Optimizaci%C3%B3n%20Termodin%C3%A1mica%20%28LanceDB%20RAG%29.md)  
- [PBI - Sensor Termodinámico Vectorial y Telemetría LanceDB (/Admin/System) (PBI-SYS-VEC-003)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Sensor%20Termodin%C3%A1mico%20Vectorial%20%28Telemetr%C3%ADa%20LanceDB%20en%20Admin%20System%29.md)  
- [PBI - Forja de la Sala de Control y Dashboard Táctico (Admin) (PBI-ADMIN-CORE-002)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Forja%20de%20la%20Sala%20de%20Control%20y%20Dashboard%20T%C3%A1ctico%20%28Admin%29.md)  
- [PBI - Persistencia Vectorial Embebida y Aislamiento IaaC (LanceDB) (PBI-VEC-IAAC-004)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Persistencia%20Vectorial%20Embebida%20y%20Aislamiento%20IaaC%20%28LanceDB%29.md)  
**Estimación Táctica:** 5 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Observabilidad táctica, seguimiento funcional de memoria vectorial RAG y blindaje analítico Anti-OOM (*Bounded Query Pattern* y Segregación LanceDB vs MySQL).
- **Entorno:** Consola de operaciones ([`/Admin/Cognitive`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin)), Server Components con `export const dynamic = 'force-dynamic'`, streaming reactivo con `<Suspense>`, base de datos relacional MySQL (Prisma), persistencia vectorial LanceDB (`/app/vector_storage`) y Edge Middleware con Basic Auth (RFC 7617).
- **Entropía Asimilada (Filtros A, B y C - Red Teaming Synthesis):**
  - *Filtro A (Rigor Técnico y Cero Alucinación):* Erradicación de la asunción de que LanceDB puede calcular promedios analíticos en memoria (`Array.reduce()`), evitando asfixia térmica y colapsos por Out Of Memory (OOM) en Node.js; eliminación de volcados masivos sin límite hacia `DataTable<T>`; y rectificación de la autoría de cookies (`/api/triage` en lugar de `middleware.ts`).
  - *Filtro B (Determinismo Hexagonal y Pureza de Tipos):* Preservación estricta de Clean Architecture ([`CONSTITUTION.MD`](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.MD)). Los Server Components no importan LanceDB directamente; consumen el puerto [`ICognitiveMemoryPort`](file:///home/racso/Proyectos/BarcelonaXplorer/src/application/ports/out/cognitive-memory.port.ts) y [`ICognitiveMetricsPort`](file:///home/racso/Proyectos/BarcelonaXplorer/src/application/ports/out/cognitive-metrics.port.ts) forjados en PBI-COG-MEM-005. Tipado estricto sin `any` mediante DTOs serializables (`CognitiveSessionItem`, `CognitiveMetricsSummary`).
  - *Filtro C (Eficiencia Térmica y Bounded Ingestion):* Imposición de una ventana de extracción acotada (`limit: 100` ordenado por timestamp descendente) para alimentar el DOM interactivo a 60 FPS sin degradación de memoria; y delegación de métricas analíticas complejas (Zeigarnik Score, Entropía de Ingestión) al motor relacional de MySQL en sub-milisegundos.

---

## 1. Descripción General (INVEST)

**Como** Operador Técnico y Centinela del Nodo 11 (Racso),  
**Quiero** disponer de un panel de observabilidad dedicado ([`/Admin/Cognitive`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin)) compuesto por 4 tarjetas KPI de rendimiento (Zeigarnik Score, Entropía de Ingestión, Tasa de Anclaje y Salud de LanceDB) y una bitácora tabular interactiva acotada a las 100 sesiones más recientes ([`DataTable<CognitiveSessionItem>`](file:///home/racso/Proyectos/BarcelonaXplorer/src/components/ui/data-table/data-table.tsx)),  
**Para** realizar el seguimiento funcional de la evolución de las sesiones de los usuarios (asociadas a su Identidad Sombra / UUID), auditar la precisión de las matrices hiper-densas generadas por la Aduana Universal (SLM) y diagnosticar anomalías en la inyección de contexto RAG sin provocar asfixia térmica por OOM ni degradación del navegador.

---

## 2. Diagnóstico Forense y Ataque de Red Teaming: Detección y Erradicación de Incongruencias

La auditoría forense contrastada con la realidad técnica de BarcelonaXplorer y los artefactos de [PBI-COG-MEM-005](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Memoria%20Cognitiva%20Vectorial%20y%20Optimizaci%C3%B3n%20Termodin%C3%A1mica%20%28LanceDB%20RAG%29.md) desveló 7 discrepancias y vulnerabilidades críticas:

| # | Dimensión Analizada | Planteamiento Original en HU (Alucinación / Vulnerabilidad) | Realidad Empírica en el Código (Cero Alucinación) | Resolución / Mitigación S+ Grade |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **[RED TEAMING] Agregaciones Analíticas sobre LanceDB** | Planteaba calcular el Zeigarnik Score y la Entropía de Ingestión recorriendo registros en LanceDB mediante un caso de uso con `Array.reduce()`. | LanceDB es un motor vectorial K-NN (Apache Arrow), no una base de datos OLAP. Con 10.000 sesiones, extraer los metadatos a la memoria RAM de Node.js provocará asfixia térmica y caída por OOM. | **Segregación Estricta:** Las métricas analíticas agregadas se consultan en **MySQL (Prisma)** mediante [`ICognitiveMetricsPort`](file:///home/racso/Proyectos/BarcelonaXplorer/src/application/ports/out/cognitive-metrics.port.ts) forjado en PBI-COG-MEM-005. LanceDB se limita a entregar su estado de disco mediante `ping()`. |
| **2** | **[RED TEAMING] Paginación en Cliente vs Ingesta Masiva** | Asumía que como `DataTable<T>` pagina en cliente mediante `.slice()`, era seguro entregarle la totalidad de las sesiones de LanceDB. | Transferir miles de registros históricos serializados en JSON colapsa el Time To First Byte (TTFB), satura la memoria del navegador y congela el DOM. | **Bounded Query Ingestion:** El caso de uso y el puerto aplican un límite duro inmutable: `getRecentMemories({ limit: 100 })`, mostrando únicamente la actividad cognitiva reciente, en idéntica simetría con [`TelemetryRecentLogsCard`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin/System/TelemetryRecentLogsCard.tsx) (`take: 100`). |
| **3** | **Enlace y Navegación en `AdminSidebarRight`** | No contemplaba la actualización del menú de navegación lateral de la Sala de Control. | En [`AdminSidebarRight.tsx:L14`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin/_components/AdminSidebarRight.tsx#L14), `NAV_ITEMS` solo incluye `Dashboard`, `Sensores` y `Bitácora`. El operador no dispondría de enlace directo para navegar a `/Admin/Cognitive`. | Se incorpora `{ label: 'Cognición RAG', href: '/Admin/Cognitive', icon: Brain }` en `NAV_ITEMS`, garantizando cohesión ergonómica en toda la consola. |
| **4** | **Identidad Sombra y Autoría de Cookies** | Afirmaba que el UUID es inyectado por el Edge Middleware (`middleware.ts`). | [`src/middleware.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/middleware.ts#L251) solo intercepta `/Admin` para Basic Auth. La cookie `bx_session_id` se genera y gestiona en [`src/app/api/triage/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/triage/route.ts#L75). | Se documenta con exactitud: el identificador proviene de las cookies perimetrales o parámetros de triaje, sin alucinaciones sobre el middleware. |
| **5** | **Esquema de Datos de Memoria en LanceDB** | Hablaba de forma abstracta de "vectores y matrices hiper-densas". | En PBI-COG-MEM-005 se consolidó la tabla `cognitive_memories` con metadatos estructurados: `sessionId`, `matrixId`, `timeWindow`, `groupSize`, `vibe`, `constraints`, `districts`, `score`, `survivalThreshold`, `updatedAt`, `denseString`. | Los componentes de la UI consumen el DTO tipado [`CognitiveSessionItem`](file:///home/racso/Proyectos/BarcelonaXplorer/src/application/ports/out/cognitive-memory.port.ts#L3), proyectando exactamente estos campos en la tabla. |
| **6** | **Topología de Rutas Canónicas en Next.js** | Sugería `/Admin/Cognitive (o subruta equivalente)`. | [`src/middleware.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/middleware.ts#L180) aplica una redirección 308 forzando mayúsculas canónicas (`/Admin/...`). La ruta canónica inmutable debe ser estrictamente [`src/app/Admin/Cognitive/page.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/Admin). | Se establece la ruta canónica `/Admin/Cognitive`, respetando la política de empaquetado y case-sensitivity en Linux musl / Docker. |
| **7** | **Aislamiento Hexagonal en la Capa de Presentación** | Riesgo de instanciar librerías nativas de LanceDB directamente en Server Components de la UI. | Viola [`CONSTITUTION.MD`](file:///home/racso/Proyectos/BarcelonaXplorer/CONSTITUTION.MD). Webpack y Turbopack pueden intentar compilar binarios C++/Rust en componentes React. | Los Server Components interactúan exclusivamente mediante casos de uso y puertos desacoplados ([`ICognitiveMemoryPort`](file:///home/racso/Proyectos/BarcelonaXplorer/src/application/ports/out/cognitive-memory.port.ts) y [`ICognitiveMetricsPort`](file:///home/racso/Proyectos/BarcelonaXplorer/src/application/ports/out/cognitive-metrics.port.ts)). |

---

## 3. Justificación Arquitectónica (La Vía del Yunque y Red Teaming)

La implementación de esta interfaz coreografía los órganos ya establecidos en la arquitectura bajo principios de resiliencia estricta:

1. **Reutilización del Componente Genérico con Ingesta Acotada (*Bounded Query Pattern*):**  
   La visualización se delega al componente [`DataTable<T>`](file:///home/racso/Proyectos/BarcelonaXplorer/src/components/ui/data-table/data-table.tsx). Si bien la tabla pagina en cliente (`.slice()`), la extracción de persistencia impone un límite estricto de 100 registros (`limit: 100` ordenado por timestamp descendente) a través de [`ICognitiveMemoryPort.getRecentMemories()`](file:///home/racso/Proyectos/BarcelonaXplorer/src/application/ports/out/cognitive-memory.port.ts). Esto previene que una ingesta masiva colapse la serialización JSON, la red o la memoria de JavaScript.

2. **Aislamiento Hexagonal y Segregación Analítica (MySQL vs LanceDB):**  
   - **LanceDB:** Se destina exclusivamente a la recuperación vectorial RAG y al listado acotado de las 100 memorias cognitivas más recientes. Queda terminantemente prohibido ejecutar `Array.reduce()` o escaneos masivos en Node.js sobre LanceDB.  
   - **MySQL (Prisma):** Asume el cómputo de métricas analíticas agregadas (Zeigarnik Score, Entropía de Ingestión, Anclaje en Telegram), resolviendo promedios y conteos en milisegundos mediante índices B-Tree relacionales sin consumir RAM de la aplicación web.

3. **Trazabilidad de Identidad Sombra:**  
   Dado que el sistema no guarda transcripciones literales para proteger el consumo de tokens, la tabla expone el UUID inyectado por la API perimetral ([`/api/triage`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/triage/route.ts)) junto con el payload de las variables destiladas (ej. `timeWindow`, `groupSize`, `vibe`, `districts`, `score`), permitiendo auditar la transición del estado de la sesión hasta alcanzar el umbral de supervivencia.

---

## 4. Topología Tabular y Componentes (`ColumnDef<CognitiveSessionItem>`)

Para maximizar la observabilidad sin sobrecargar el DOM, las columnas de la tabla interactiva se estructuran en los siguientes vectores de información:

1. **Identidad (UUID):** El identificador perimetral de la sesión, truncado visualmente a 8 caracteres, pero copiable con un solo clic.
2. **Última Actividad (Timestamp):** Fecha y hora formateada en locale español (`dd/MM/yyyy HH:mm:ss`), ordenable.
3. **Estado de Maduración (Badge Térmico):**
   - **Saturación S+ Grade (Esmeralda):** `score === 100` (Modo Explorador desbloqueado).
   - **Peaje Superado (Azul):** `score >= 60 && score < 100` (Ruta despachable).
   - **Fase Inerte (Ámbar):** `score < 60` (Borrador parcial).
4. **Puntuación de Matriz (Progreso):** Barra de progreso compacta visual con el porcentaje de saturación (0-100%).
5. **Matriz Hiper-Densa (Payload JSON):** Representación compacta del texto denso con botón "Inspeccionar" que abre un modal con el JSON estructurado completo.

---

## 5. Tarjetas de Telemetría Cognitiva (Dashboard Superior Vía MySQL y LanceDB `ping()`)

El dashboard superior no ejecuta agregaciones sobre LanceDB, sino que delega el cálculo a MySQL para blindar al servidor contra asfixia térmica:

1. **Métrica 1: Tasa de Saturación (Zeigarnik Score):**  
   - *Definición:* Porcentaje de sesiones activas que han superado el umbral de supervivencia (60%), desbloqueando el despacho de ruta.  
   - *Motor de Cálculo:* MySQL (Prisma), evaluando registros de triaje consolidados en milisegundos.  
   - *Valor Operativo:* Evalúa si la gamificación sensorial (Efecto Zeigarnik) está funcionando o si los usuarios se frustran antes de completar el contexto necesario.

2. **Métrica 2: Entropía de Ingestión (Latencia Conversacional):**  
   - *Definición:* Promedio de turnos requeridos por la Aduana Universal (SLM) para destilar las variables válidas.  
   - *Motor de Cálculo:* MySQL (Prisma), calculando promedios desde la bitácora de telemetría.  
   - *Valor Operativo:* Mide la eficiencia del modelo SLM. Si el promedio de turnos es excesivamente alto, el SLM está fallando en su rebote conversacional.

3. **Métrica 3: Tasa de Anclaje Táctico:**  
   - *Definición:* Porcentaje de sesiones efímeras (UUID) que han ejecutado el deep link hacia el Telegram Bridge.  
   - *Motor de Cálculo:* MySQL (Prisma), mediante conteo relacional sobre anclajes registrados.  
   - *Valor Operativo:* Mide el éxito de la Táctica del Refugio y la consolidación de usuarios anónimos en el canal de notificaciones.

4. **Métrica 4: Densidad Vectorial y Salud de LanceDB:**  
   - *Definición:* Estado del motor vectorial, conteo de tablas y latencia de acceso a `/app/vector_storage`.  
   - *Motor de Cálculo:* [`LanceDbVectorAdapter.ping()`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/vector/lancedb-vector.adapter.ts) vía [`IVectorStorePort`](file:///home/racso/Proyectos/BarcelonaXplorer/src/application/ports/out/vector-store.port.ts).  
   - *Valor Operativo:* Sensor temprano de saturación de disco y salud del subsistema embebido.

---

## 6. Criterios de Aceptación (Verificación Empírica / Gherkin)

### Escenario 1: Renderizado Seguro y Extracción Acotada (Anti-OOM)
```gherkin
Dado que existen más de 1.000 fragmentos de memoria en la tabla 'cognitive_memories' de LanceDB
Cuando el operador accede a la ruta protegida /Admin/Cognitive
Entonces el caso de uso extrae como máximo los 100 registros cognitivos más recientes desde LanceDB (limit: 100)
Y los inyecta en el componente <DataTable columns={cognitiveColumns} data={sessions} pageSize={25}/>
Y el DOM de React renderiza fluidamente a 60 FPS sin saturación de memoria en cliente ni sobrecarga en SSR.
```

### Escenario 2: Renderizado Reactivo de Métricas Analíticas desde MySQL
```gherkin
Dado un conjunto de sesiones registradas en la base de datos MySQL
Cuando se renderizan las tarjetas de telemetría cognitiva
Entonces el backend ejecuta las agregaciones analíticas sobre Prisma (MySQL) sin consultar vectores en LanceDB
Y presenta las tarjetas con Zeigarnik Score, Entropía de Ingestión, Tasa de Anclaje y Salud de LanceDB
Y el cálculo se resuelve en menos de 50 ms.
```

### Escenario 3: Filtrado Multidimensional por Identidad o Estado
```gherkin
Dado el panel de observabilidad cargado con la información vectorial reciente
Cuando el operador introduce un fragmento de UUID en el buscador superior, o selecciona un estado en el filtro de columna
Entonces la tabla aísla de inmediato y muestra en caliente la trazabilidad exacta de ese usuario sin peticiones de red adicionales.
```

### Escenario 4: Inspección Forense de la Matriz Hiper-Densa (Modal JSON)
```gherkin
Dado un registro de sesión renderizado en la tabla cognitiva
Cuando el operador pulsa el botón "Inspeccionar" en la celda de la matriz densa
Entonces se despliega un diálogo modal en primer plano con el JSON formateado del payload
Y permite copiar al portapapeles el UUID de sesión y el objeto de variables con un solo clic.
```

### Escenario 5: Estricto Blindaje Perimetral y Redirección Canónica
```gherkin
Dado un intento de acceso a /admin/cognitive o /Admin/Cognitive sin cabecera de autenticación
Cuando la petición cruza el Edge Middleware
Entonces el sistema deniega el acceso mediante un error HTTP 401 Unauthorized
Y si se accede mediante /admin/cognitive, se aplica redirección canónica 308 hacia /Admin/Cognitive.
```

### Escenario 6: Navegación Ergonómica en AdminSidebarRight
```gherkin
Dado el acceso autenticado a la Sala de Control
Cuando el operador observa la barra de navegación lateral
Entonces se visualiza el elemento "Cognición RAG" con su icono Brain
Y al hacer clic, redirige limpiamente a /Admin/Cognitive marcando el enlace como activo con estilo esmeralda.
```

