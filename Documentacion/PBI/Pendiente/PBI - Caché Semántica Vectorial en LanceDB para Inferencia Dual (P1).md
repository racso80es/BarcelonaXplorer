# [OPERATIVO] Documento Destilado: PBI - Caché Semántica Vectorial en LanceDB para Inferencia Dual

**Identificador:** PBI-COGN-CACHE-001  
**Estatus:** Pendiente / Listo para Forja (S+ Grade)  
**Fecha de Creación:** 2026-09-26  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario: Optimización Kaizen, Resiliencia Perimetral y Eficiencia Cognitiva v2.1.0](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario:%20Estabilizaci%C3%B3n%20Evolutiva%20y%20Saneamiento%20Post-Anclaje%20v2.0.1.md)  
**Auditoría Vinculada:** [AUD-OPS-ANCHOR-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Ciclo%20Evolutivo%20v2.0.0-a-c82b741.md)  
**Fuente Base Vinculada:** [Ancla Evolutiva BarcelonaXplorer_01.md](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Fuentes/Ancla%20Evolutiva%20BarcelonaXplorer_01.md)  
**Módulo:** `src/features/cognitive-memory/`, `src/features/triage/`  
**Entorno:** LanceDB (Vector Search Embebido), Apache Arrow, Google Gemini Embedding Adapter  
**Prioridad:** Alta (P1 - Optimización Termodinámica y Reducción de Costes)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Interceptación semántica de las intenciones de usuario en el pipeline de triaje para recuperar respuestas idénticas o altamente análogas almacenadas en LanceDB, erradicando llamadas redundantes a las APIs de inferencia.
- **Entorno:** `src/features/cognitive-memory/` (almacén vectorial `prompt_cache`), integrado con `TriageInputUseCase` en `src/features/triage/`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Rigor Técnico):* Umbral de similitud coseno estricto ($\ge 0.95$) y ventana de validez temporal (TTL $\le 24\text{ horas}$) para garantizar que la respuesta semántica recuperada siga siendo contextualmente precisa y vigente.
  - *Filtro B (Determinismo y Soberanía):* El almacenamiento de vectores se realiza íntegramente de manera local en el volumen `storage/lancedb` sin dependencias de red de terceros.
  - *Filtro C (Eficiencia Operativa):* Reducción de la latencia de respuesta de ~1200ms a $< 50\text{ ms}$ en aciertos de caché, ahorrando el 100% de los tokens de generación del SLM/LLM.

---

## 1. Declaración de Intención (INVEST)

**Como** Ingeniero de Inferencia y Optimizador Termodinámico (Vértice Biológico),  
**Quiero** consultar una tabla de caché semántica vectorial en LanceDB antes de invocar los modelos de inferencia remota,  
**Para** devolver respuestas inmediatas a consultas turísticas recurrentes, ahorrar costes de API y proporcionar una experiencia instantánea al usuario.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Tabla de Caché Semántica en LanceDB):** Creación del esquema y tabla `semantic_prompt_cache` en LanceDB conteniendo vector (768 dimensiones), prompt normalizado, respuesta estructurada, fecha de inserción y contador de aciertos.
- [ ] **CA-2 (Caso de Uso de Consulta y Almacenamiento):** Implementación del puerto y servicio `SemanticCacheService` con métodos `get(vector: number[]): Promise<CachedTriageResult | null>` y `set(vector: number[], result: TriageResult): Promise<void>`.
- [ ] **CA-3 (Integración en Triaje):** En [`triage-input.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage-input.use-case.ts), si el embedding del prompt coincide con similitud $\ge 0.95$ y antigüedad $< 24\text{h}$, retornar la respuesta cacheada y emitir evento de telemetría `TRIAGE_ROUTED` con metadato `cacheHit: true` y `tokensSaved`.
- [ ] **CA-4 (Verificación de Oráculos):** Pruebas unitarias colocadas en `src/features/cognitive-memory/semantic-cache.test.ts` evaluando inserción, coincidencia por similitud coseno, descarte por TTL y fallback transparente ante fallo de LanceDB.
