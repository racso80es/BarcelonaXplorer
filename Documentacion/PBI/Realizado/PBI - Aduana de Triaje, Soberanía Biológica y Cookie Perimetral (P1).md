# [OPERATIVO] Documento Destilado: PBI - Aduana de Triaje, Soberanía Biológica y Cookie Perimetral

**Identificador:** PBI-I18N-TRIAGE-SOVEREIGNTY-003  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-27  
**Fecha de Culminación:** 2026-09-27  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 12: Internacionalización Reactiva Persistida y Soberanía de Idioma (S+ Grade)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%2012:%20Internacionalizaci%C3%B3n%20Reactiva%20Persistida%20y%20Soberan%C3%ADa%20de%20Idioma.md)  
**Módulo:** `src/features/triage/` y `src/app/api/triage/`  
**Entorno:** Next.js 16 App Router / TypeScript 5.8+ / Groq SLM / Jev AI / Vitest  
**Prioridad:** Alta (P1 - Aduana Lingüística y Soberanía de Sesión)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Interceptación y detección de intención lingüística en lenguaje natural mediante SLM acorralado por enum Zod, actualización de la identidad de sesión y despacho de metadatos `_sys_lang` en la Aduana Universal.
- **Entorno:** `src/features/triage/triage-input.use-case.ts`, `src/features/triage/language-detector.ts`, `src/features/triage/triage.schema.ts`, `src/app/api/triage/route.ts`, `src/app/api/triage/ignition/route.ts` y colocated tests.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Acorralamiento del SLM sin Inferencia Libre):* Heurística declarativa de primer paso (0 tokens) y, si hay pista de switch sin código canónico, `detectLanguageIntent` en Groq con JSON `{"language":"<code>"}` restringido a la Whitelist. Defensa en profundidad con `SupportedLanguageVo` ante alias (`"English"`, `"en-US"`).
  - *Filtro B (Gobernanza del Estado Multivuelta - Laudo 2):* Persistencia del idioma en `DensityMatrixRepositoryPort` ligado a `bx_session_id`, y refresco de la cookie perimetral `bx_lang` (SameSite=Lax, Path=/) en ignición y triaje.
  - *Filtro C (Entrega de Metadato Reactivo para la PWA):* El DTO de salida de triaje e ignición incluye de forma garantizada `_sys_lang: SupportedLanguage`. Al saturar la matriz, Gemini recibe la directriz `[Idioma soberano: <code>]`.

---

## 1. Declaración de Intención (INVEST)

**Como** Desarrollador de la Aduana Universal de BarcelonaXplorer,  
**Quiero** incorporar la detección de soberanía biológica en el triaje conversacional y la emisión del metadato `_sys_lang` en la API,  
**Para** permitir que el explorador cambie el idioma del sistema y del itinerario mediante interacción conversacional natural sin intermediación manual de selectores de configuración.

---

## 2. Criterios de Aceptación Certificados (Aduana de Fricción)

- [x] **CA-1 (Esquematización Zod de Triaje con Idioma):** Extendidos `TriageOutcomeDtoSchema`, `TriageOutcome` e `IgnitionOutcomeSchema` con `_sys_lang: SupportedLanguage` (default `es`).
- [x] **CA-2 (Detección Lingüística en Triaje con SLM Acorralado):** Implementada heurística declarativa (`language-detector.ts`) y método `detectLanguageIntent` en `IConversationalSLMPort` / Groq. El caso de uso prioriza heurística y solo invoca al SLM ante pistas de switch sin código explícito.
- [x] **CA-3 (Gobernanza de Sesión y Cookie Perimetral):** El idioma se persiste en `payload.language` de la matriz de sesión. `/api/triage` e `/api/triage/ignition` leen `bx_lang` con prioridad sobre `Accept-Language` y refrescan la cookie. Cabeceras fuera de whitelist (`ru-RU`) resuelven a `es`.
- [x] **CA-4 (Propagación al Generador de Rutas Gemini):** Al saturar la matriz (≥ 60%), `TriageInputUseCase` inyecta `buildRouteLanguageDirective(lang)` en el prompt de `GenerateTacticalRouteUseCase`.
- [x] **CA-5 (Colocated Tests S+ Grade):** Suites colocadas en `src/features/triage/` y `src/app/api/triage/ignition/` verificando switch explícito, delegación SLM, persistencia, fallback de ignición y cookie soberana.

---

## 3. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

1. **Compilador TypeScript (`tsc --noEmit`):**
   ```bash
   npx tsc --noEmit
   # Exit code: 0 (Cero errores de compilación)
   ```
2. **Linter AST (`eslint`):**
   ```bash
   ./node_modules/.bin/eslint features/triage/language-detector.ts \
     features/triage/triage-input.use-case.ts \
     features/ai-engine/conversational-slm.port.ts \
     features/ai-engine/groq/groq-conversational-slm.adapter.ts \
     app/api/triage/route.ts app/api/triage/ignition/route.ts
   # Exit code: 0 (0 warnings, 0 errores)
   ```
3. **Oráculo de Pruebas Unitarias (`vitest`):**
   ```bash
   npx vitest run features/triage features/planner \
     features/ai-engine/groq-tests/groq-conversational-slm.test.ts
   # Test Files: 17 passed (17)
   # Tests: 112 passed (112)
   # Duration: 5.96s
   ```

---

## 4. Artefactos Modificados

- [`src/features/triage/language-detector.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/language-detector.ts)
- [`src/features/triage/language-detector.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/language-detector.test.ts)
- [`src/features/triage/triage-input.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage-input.use-case.ts)
- [`src/features/triage/triage.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage.schema.ts)
- [`src/features/triage/triage-outcome.vo.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage-outcome.vo.ts)
- [`src/features/triage/triage.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage.test.ts)
- [`src/features/triage/ignition.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/ignition.schema.ts)
- [`src/features/triage/contextual-ignition.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/contextual-ignition.use-case.ts)
- [`src/features/triage/contextual-ignition.use-case.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/contextual-ignition.use-case.test.ts)
- [`src/features/triage/index.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/index.ts)
- [`src/features/planner/matrix.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/matrix.ts)
- [`src/features/ai-engine/conversational-slm.port.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/ai-engine/conversational-slm.port.ts)
- [`src/features/ai-engine/groq/groq-conversational-slm.adapter.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/ai-engine/groq/groq-conversational-slm.adapter.ts)
- [`src/features/ai-engine/groq/prompts/contextual-greeting.prompt.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/ai-engine/groq/prompts/contextual-greeting.prompt.ts)
- [`src/app/api/triage/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/triage/route.ts)
- [`src/app/api/triage/ignition/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/triage/ignition/route.ts)
- [`src/app/api/triage/ignition/route.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/triage/ignition/route.test.ts)
