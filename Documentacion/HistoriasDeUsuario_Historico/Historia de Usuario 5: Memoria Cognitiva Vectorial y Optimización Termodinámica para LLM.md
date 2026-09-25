# [ARQUITECTURA] Historia de Usuario 5: Memoria Cognitiva Vectorial y Optimización Termodinámica para LLM

**Identificador:** HU-ARCH-COG-005  
**Estatus:** Implementado y Certificado S+ Grade  
**Fecha de Certificación:** 2026-09-25  
**PBI Certificado:** [PBI - Memoria Cognitiva Vectorial y Optimización Termodinámica (LanceDB RAG) (PBI-COG-MEM-005)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Memoria%20Cognitiva%20Vectorial%20y%20Optimizaci%C3%B3n%20Termodin%C3%A1mica%20%28LanceDB%20RAG%29.md)  
**Módulo:** Memoria Cognitiva (LanceDB) / Motor Híbrido / Aduana Universal / Observabilidad Táctica  
**PBIs Vinculados de Infraestructura:**  
- [PBI - Persistencia Vectorial Embebida y Aislamiento IaaC (LanceDB) (PBI-VEC-IAAC-004)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Persistencia%20Vectorial%20Embebida%20y%20Aislamiento%20IaaC%20%28LanceDB%29.md)  
- [PBI - Sensor Termodinámico Vectorial y Telemetría LanceDB (/Admin/System) (PBI-SYS-VEC-003)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Sensor%20Termodin%C3%A1mico%20Vectorial%20%28Telemetr%C3%ADa%20LanceDB%20en%20Admin%20System%29.md)  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Compresión semántica de alta densidad, persistencia vectorial in-process sobre LanceDB (Apache Arrow), recuperación RAG paramétrica y blindaje analítico anti-OOM (Red Teaming).
- **Entorno:** Backend Next.js App Router (Route Handler [`/api/triage`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/triage/route.ts), Casos de uso de aplicación, volumen `/app/vector_storage` montado en Nodo 11, base relacional MySQL/Prisma).
- **Entropía Asimilada (Filtros A, B y C - Red Teaming Synthesis):**
  - *Filtro A (Rigor Técnico y Cero Alucinación):* Erradicación de la premisa de que los vectores se calculan sin un puerto de embeddings formal (`IEmbeddingPort`). Corrección del borrado accidental de la memoria en la orquestación (`clearMatrixPayload`) y eliminación del falso supuesto de que LanceDB debe calcular métricas agregadas mediante `Array.reduce()` en Node.js (causa de colapso OOM).
  - *Filtro B (Determinismo Hexagonal y Segregación de Responsabilidades):* Separación estricta entre LanceDB (exclusivo para persistencia y búsqueda vectorial K-NN) y MySQL (cálculo de indicadores relacionales como Zeigarnik Score y Entropía de Ingestión). Puertos desacoplados ([`ICognitiveMemoryPort`](file:///home/racso/Proyectos/BarcelonaXplorer/src/application/ports/out/cognitive-memory.port.ts), [`IEmbeddingPort`](file:///home/racso/Proyectos/BarcelonaXplorer/src/application/ports/out/embedding.port.ts), [`ICognitiveMetricsPort`](file:///home/racso/Proyectos/BarcelonaXplorer/src/application/ports/out/cognitive-metrics.port.ts)).
  - *Filtro C (Eficiencia Térmica y Bounded Ingestion):* Purga absoluta de historiales conversacionales crudos en el prompt de Gemini (reducción > 80% tokens). Aplicación de consultas acotadas (`limit: 100`) para alimentar la interfaz tabular, garantizando fluidez a 60 FPS sin fugas de memoria.

---

## 1. Descripción General (INVEST)

**Como** Arquitecto de Software y guardián de la eficiencia del orquestador (LLM),  
**Quiero** que la información extraída de la conversación no se guarde en la base de datos vectorial como texto libre o transcripciones crudas, sino que se transmute y formatee bajo una estructura semántica de alta densidad y tipado determinista ([`DenseSemanticMatrix`](file:///home/racso/Proyectos/BarcelonaXplorer/src/domain/value-objects/dense-semantic-matrix.vo.ts)), segregando la analítica agregada hacia MySQL y aplicando límites defensivos de extracción,  
**Para** que, al recuperar el historial mediante RAG, la inyección de contexto maximice el rendimiento cognitivo del motor, minimice el consumo de tokens y proteja la economía termodinámica del sistema evitando la saturación por ruido conversacional, la pérdida de contexto en iteraciones posteriores y la asfixia térmica por Out Of Memory (OOM).

---

## 2. Justificación Arquitectónica (Vía del Yunque y Filtro C)

Confiar exclusivamente en la ventana de contexto bruta de un LLM inyectando el historial de chat literal es ineficiente y empuja al sistema hacia el Secuestro Semántico y la Amnesia Termodinámica. La solución exige un Cúmulo Activo mediante LanceDB.

Para maximizar el rendimiento, se aplica estrictamente el Filtro C (Eficiencia): la aduana de entrada transmuta el diálogo humano en una matriz de datos estandarizada (etiquetas semánticas y JSON denso) antes de calcular el vector. Al orquestador pesado no le sirven las interacciones conversacionales vagas; necesita variables logísticas compactas para cruzar intenciones con precisión quirúrgica y latencia mínima.

Asimismo, bajo el ataque de **Red Teaming**, se estableció el principio innegociable de no forzar a LanceDB a ejecutar funciones agregadas (OLAP) en memoria de Node.js, delegando los promedios y métricas de maduración a MySQL y acotando toda consulta de observabilidad a un máximo de 100 registros.

---

## 3. Coreografía de la Memoria Cognitiva Optimizada (RAG)

1. **Destilación y Formateo Pre-Vectorial:**  
   Cada vez que el agente ligero (SLM) interactúa en la Aduana Universal, purga la fricción humana. Extrae y formatea un esquema compacto y determinista: `[Grupo: 4 personas | Ventana: hoy | Vibe: familiar | Restricciones: niños, presupuesto bajo]`.

2. **Vectorización de Alta Densidad (IEmbeddingPort):**  
   Este bloque estructurado se convierte en un vector matemático mediante el puerto formal de embeddings ([`IEmbeddingPort`](file:///home/racso/Proyectos/BarcelonaXplorer/src/application/ports/out/embedding.port.ts) / [`GeminiEmbeddingAdapter`](file:///home/racso/Proyectos/BarcelonaXplorer/src/infrastructure/ai/gemini-embedding.adapter.ts)) y se persiste en la tabla canónica `cognitive_memories` de LanceDB, enlazado al Identificador Sombra (`bx_session_id`).

3. **Ensamblaje del Prompt (Inyección Silenciosa):**  
   Ante una nueva petición o al alcanzar el umbral de supervivencia (>= 60%), el motor de recuperación consulta LanceDB y extrae estos bloques paramétricos. El orquestador ensambla un payload oculto que inyecta este contexto al LLM pesado (Gemini). Al estar purgado de ruido, el LLM consume el mínimo de tokens y destina su capacidad de cómputo exclusivamente a la resolución del itinerario S+ Grade.

4. **Persistencia No Destructiva para Refinamientos:**  
   A diferencia del borrador efímero de triaje (que se resetea tras despachar la ruta), la memoria cognitiva consolidada se preserva en LanceDB. Esto permite que solicitudes posteriores de modificación de ruta (ej. *"Cambia el museo por un parque"*) mantengan íntegro el contexto demográfico y de preferencias sin solicitarlo de nuevo.

5. **Segregación Analítica Anti-OOM y Consultas Acotadas:**  
   LanceDB no ejecuta promedios ni agregaciones analíticas. Las métricas de sesión se derivan hacia MySQL. Cualquier lectura masiva para observabilidad administrativa se restringe a un umbral defensivo de `limit: 100`.

---

## 4. Criterios de Aceptación Certificados (Verificación Empírica)

- [x] **Escenario 1: Compresión Termodinámica del Historial:**  
  Al superar el peaje (>= 60%), la conversación se transmuta a `DenseSemanticMatrix` (`toDensePromptString()`), se vectoriza mediante `IEmbeddingPort` y se inyecta silenciosamente en el prompt de Gemini sin transcripciones crudas de chat.
- [x] **Escenario 2: Retención de Contexto Estructurado y Búsqueda Semántica:**  
  El motor RAG ejecuta búsqueda semántica en LanceDB e inyecta la etiqueta formateada `[Vibe: Romántico | Grupo: 2 personas]` al orquestador, recomendando experiencias acordes sin gastar ciclos en interpretar lenguaje natural ambiguo del pasado.
- [x] **Escenario 3: Refinamiento de Ruta con Prevención de Alucinación:**  
  Ante solicitudes de alteración de itinerario, el caso de uso recupera la matriz estructurada desde LanceDB (`getLatestSessionMemory`) en lugar de asumir contexto vacío, conservando el tamaño del grupo y restricciones.
- [x] **Escenario 4: Tolerancia a Fallos de Embeddings (Fail-Soft):**  
  Ante caídas o cuotas de la API externa de embeddings, `GeminiEmbeddingAdapter` activa un fallback determinista normalizado L2 y registra telemetría WARN sin interrumpir el flujo del usuario.
- [x] **Escenario 5: Agregación Analítica en MySQL (Cero OOM en LanceDB):**  
  Las consultas analíticas agregadas (Zeigarnik Score, turnos promedio) son ejecutadas por MySQL vía Prisma en milisegundos sin transferir metadatos masivos a la RAM de Node.js.
- [x] **Escenario 6: Extracción Bounded Defensiva (`limit: 100`):**  
  La persistencia de LanceDB aplica un límite inmutable de 100 registros (`limit: 100`) para consultas tabulares, garantizando renderizado a 60 FPS sin degradación de memoria.
