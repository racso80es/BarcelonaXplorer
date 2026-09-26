# [OPERATIVO] Documento Destilado: PBI - Caso de Uso de Ignición Contextual y Adaptador SLM para Saludos Proactivos

**Identificador:** PBI-TRIAGE-IGN-002  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-26  
**Fecha de Culminación:** 2026-09-26  
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
  - *Filtro A (Localidad y Pureza Arquitectónica):* Inyección explícita por constructor (*Pure DI*) de `IConversationalSLMPort`, `ICognitiveMemoryPort`, `IWeatherPort` y `TelemetryRepositoryPort`. Retorno del sobre tipado canónico `OperationEnvelope<IgnitionOutcome>`.
  - *Filtro B (Resiliencia Térmica y Fallback Heurístico):* Timeout de inferencia en SLM de 250 ms. Si el SLM o la red fallan, se conmuta inmediatamente a un catálogo declarativo de saludos heurísticos canónicos según franja horaria y dispositivo (`isFallback: true`), garantizando latencia < 300 ms en el peor escenario.
  - *Filtro C (Continuidad Semántica sin Fricción):* Si existe rastro en LanceDB para el `bx_session_id`, el saludo lo referencia sutilmente sin interrogatorios forzados ni amnesia.

---

## 1. Declaración de Intención (INVEST)

**Como** Turista que accede al sistema,  
**Quiero** que el orquestador ligero procese mi contexto sensorial y mi historial de sesión de forma proactiva,  
**Para** recibir un saludo conversacional personalizado que me oriente sobre el momento actual en Barcelona e invite a planificar sin fricción.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Extensión del Puerto SLM):** Incorporación en [`src/features/ai-engine/conversational-slm.port.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/ai-engine/conversational-slm.port.ts) del método `generateContextualGreeting(sensoryContext: IgnitionSensoryContextDto): Promise<string>` e implementación en [`src/features/ai-engine/groq/groq-conversational-slm.adapter.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/ai-engine/groq/groq-conversational-slm.adapter.ts) con prompt contextual dedicado [`src/features/ai-engine/groq/prompts/contextual-greeting.prompt.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/ai-engine/groq/prompts/contextual-greeting.prompt.ts), respetando el límite de 2 oraciones concisas y empáticas.
- [x] **CA-2 (Caso de Uso `ContextualIgnitionUseCase`):** Implementación en [`src/features/triage/contextual-ignition.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/contextual-ignition.use-case.ts) con la siguiente coreografía:
  - Recuperación de memoria previa en LanceDB mediante `cognitiveMemory.getLatestSessionMemory(sessionId, 'default')` y `toDensePromptString()`.
  - Recuperación climática resiliente mediante `IWeatherPort`.
  - Inferencia con SLM Rápido o conmutación a fallback heurístico si falla o excede timeout.
  - Construcción de chispas tácticas iniciales (`IgnitionSpark`: clima, sesión previa).
  - Ensamblado del sobre canónico `OperationEnvelope<IgnitionOutcome>`.
- [x] **CA-3 (Catálogo Declarativo de Fallback Heurístico):** Mapeo determinista por matriz para `(period, device)` en caso de corte de red o indisponibilidad de proveedores externos (`CANONICAL_HEURISTIC_GREETINGS`).
- [x] **CA-4 (Colocated Tests S+ Grade):** Pruebas unitarias en [`src/features/triage/contextual-ignition.use-case.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/contextual-ignition.use-case.test.ts) (4 escenarios BDD) y [`src/features/ai-engine/groq-tests/groq-conversational-slm.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/ai-engine/groq-tests/groq-conversational-slm.test.ts) pasando al 100% bajo Vitest.

---

## 3. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

1. **Compilador TypeScript (`tsc --noEmit`):**
   ```bash
   npx tsc --noEmit
   # Exit code: 0 (Cero errores de tipos)
   ```
2. **Linter AST (`eslint`):**
   ```bash
   npm run lint
   # Exit code: 0 (0 warnings, 0 errores)
   ```
3. **Suite Completa de Pruebas Unitarias (`vitest`):**
   ```bash
   npm test
   # Test Files: 72 passed (72)
   # Tests: 373 passed (373)
   # Duration: 27.23s
   ```
