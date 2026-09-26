# [OPERATIVO] Documento Destilado: PBI - Caso de Uso de Ignición Contextual y Adaptador SLM para Saludos Proactivos

**Identificador:** PBI-TRIAGE-IGN-002  
**Estatus:** Pendiente  
**Fecha de Creación:** 2026-09-26  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 7.1 (Refinada): Ignición Contextual y Saludo Dinámico (Aduana Universal)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%207.1%20%28Refinada%29:%20Ignici%C3%B3n%20Contextual%20y%20Saludo%20Din%C3%A1mico%20%28Aduana%20Universal%29.md)  
**Módulo:** `src/features/triage/`, `src/features/ai-engine/`  
**Entorno:** Next.js 16 (Node.js Runtime), Groq / Llama-3, LanceDB RAG, Pure DI  
**Prioridad:** Alta (P1 - Núcleo de la Ignición Contextual)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Forja del caso de uso de dominio `ContextualIgnitionUseCase` dentro del vertical slice `src/features/triage/` y extensión del puerto `IConversationalSLMPort` con su adaptador `GroqConversationalSlmAdapter` para la síntesis de saludos proactivos y chispas tácticas basadas en el entorno del usuario y su memoria RAG previa en LanceDB.
- **Entorno:** `src/features/triage/`, `src/features/ai-engine/`, `src/features/cognitive-memory/`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Localidad y Pureza Arquitectónica):* Inyección explícita por constructor (*Pure DI*) de `IConversationalSLMPort`, `ICognitiveMemoryPort`, `IWeatherPort`, `DensityMatrixRepositoryPort` y `TelemetryRepositoryPort`. Retorno del sobre tipado canónico `OperationEnvelope<IgnitionOutcome>`.
  - *Filtro B (Resiliencia Térmica y Fallback Heurístico):* Timeout de inferencia en SLM de 250 ms. Si el SLM o la red fallan, se conmuta inmediatamente a un catálogo declarativo de saludos heurísticos canónicos según franja horaria y dispositivo (`isFallback: true`), garantizando latencia < 300 ms en el peor escenario.
  - *Filtro C (Continuidad Semántica sin Fricción):* Si existe rastro en LanceDB para el `bx_session_id`, el saludo lo referencia sutilmente sin interrogatorios forzados ni amnesia.

---

## 1. Declaración de Intención (INVEST)

**Como** Turista que accede al sistema,  
**Quiero** que el orquestador ligero procese mi contexto sensorial y mi historial de sesión de forma proactiva,  
**Para** recibir un saludo conversacional personalizado que me oriente sobre el momento actual en Barcelona e invite a planificar sin fricción.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Extensión del Puerto SLM):** Incorporación en `IConversationalSLMPort` del método `generateContextualGreeting(sensoryContext: IgnitionSensoryContextDto): Promise<string>` e implementación en `GroqConversationalSlmAdapter` respetando el límite de 2 oraciones concisas y empáticas.
- [ ] **CA-2 (Caso de Uso `ContextualIgnitionUseCase`):** Implementación en `src/features/triage/contextual-ignition.use-case.ts` con la siguiente coreografía:
  - Recuperación de memoria previa en LanceDB mediante `cognitiveMemory.getLatestSessionMemory(sessionId, 'default')`.
  - Recuperación o consulta meteorológica resiliente mediante `IWeatherPort`.
  - Inferencia con SLM Rápido o conmutación a fallback heurístico si falla o excede timeout.
  - Construcción de chispas iniciales (`IgnitionSpark`: clima, hora táctica).
  - Ensamblado del sobre `OperationEnvelope<IgnitionOutcome>`.
- [ ] **CA-3 (Catálogo Declarativo de Fallback Heurístico):** Mapeo determinista por matriz para `(period, device)` en caso de corte de red o indisponibilidad de proveedores externos.
- [ ] **CA-4 (Colocated Tests S+ Grade):** Pruebas unitarias en `src/features/triage/contextual-ignition.use-case.test.ts` con cobertura de los 4 escenarios de negocio (Ignición virgen con lluvia, Retorno de sesión LanceDB, Madrugada en escritorio, y Fallback determinista por fallo de SLM).

---

## 3. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

*(Se completará tras la implementación y validación empírica)*
