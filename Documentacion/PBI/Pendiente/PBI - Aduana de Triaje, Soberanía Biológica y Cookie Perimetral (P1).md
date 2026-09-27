# [OPERATIVO] Documento Destilado: PBI - Aduana de Triaje, Soberanía Biológica y Cookie Perimetral

**Identificador:** PBI-I18N-TRIAGE-SOVEREIGNTY-003  
**Estatus:** Pendiente de Implementación (S+ Grade)  
**Fecha de Creación:** 2026-09-27  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 12: Internacionalización Reactiva Persistida y Soberanía de Idioma (S+ Grade)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%2012:%20Internacionalizaci%C3%B3n%20Reactiva%20Persistida%20y%20Soberan%C3%ADa%20de%20Idioma.md)  
**Módulo:** `src/features/triage/` y `src/app/api/triage/`  
**Entorno:** Next.js 16 App Router / TypeScript 5.8+ / Groq SLM / Jev AI / Vitest  
**Prioridad:** Alta (P1 - Aduana Lingüística y Soberanía de Sesión)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Interceptación y detección de intención lingüística en lenguaje natural mediante SLM acorralado por enum Zod, actualización de la identidad de sesión y despacho de metadatos `_sys_lang` en la Aduana Universal.
- **Entorno:** `src/features/triage/triage-input.use-case.ts`, `src/features/triage/triage.schema.ts`, `src/app/api/triage/route.ts`, `src/app/api/triage/ignition/route.ts` y colocated tests.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Acorralamiento del SLM sin Inferencia Libre):* El prompt y contrato del SLM incorporan `z.enum(SUPPORTED_LANGUAGES)`. Si el usuario expresa cambio de idioma (ej. *"Háblame en inglés"* o *"Passons en français"*), el SLM extrae el código determinista o lo normaliza con `SupportedLanguageVo`.
  - *Filtro B (Gobernanza del Estado Multivuelta - Laudo 2):* Persistencia del idioma en el estado de sesión `DensityMatrixRepositoryPort` ligado a `bx_session_id`, y refresco de la cookie perimetral `bx_lang`.
  - *Filtro C (Entrega de Metadato Reactivo para la PWA):* El DTO de salida de triaje (`TriageOutcomeDto`) incluye de forma garantizada el campo `_sys_lang: SupportedLanguage`.

---

## 1. Declaración de Intención (INVEST)

**Como** Desarrollador de la Aduana Universal de BarcelonaXplorer,  
**Quiero** incorporar la detección de soberanía biológica en el triaje conversacional y la emisión del metadato `_sys_lang` en la API,  
**Para** permitir que el explorador cambie el idioma del sistema y del itinerario mediante interacción conversacional natural sin intermediación manual de selectores de configuración.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Esquematización Zod de Triaje con Idioma):** Extender `TriageOutcomeDtoSchema` y `TriageOutcome` con el campo `_sys_lang: SupportedLanguage`.
- [ ] **CA-2 (Detección Lingüística en Triaje con SLM Acorralado):** Detectar en `TriageInputUseCase` la intención de cambio o switch conversacional mediante el SLM con enum Zod cerrado, o mediante heurística determinista si el prompt es un comando explícito de idioma.
- [ ] **CA-3 (Gobernanza de Sesión y Cookie Perimetral):** Almacenar el idioma en el repositorio de matriz de sesión (`DensityMatrixRepositoryPort`) y setear la cookie `bx_lang` en `/api/triage` e `/api/triage/ignition`.
- [ ] **CA-4 (Propagación al Generador de Rutas Gemini):** Si la matriz alcanza el umbral de saturación ($\ge 60\%$), instruir a `GenerateTacticalRouteUseCase` para que redacte el itinerario directamente en el idioma activo de la sesión.
- [ ] **CA-5 (Colocated Tests S+ Grade):** Pruebas unitarias colocadas en `src/features/triage/` verificando la detección de idioma, persistencia en sesión y emisión del DTO con `_sys_lang`.

---

## 3. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

1. **Compilador TypeScript (`tsc --noEmit`):** Exit code 0.
2. **Linter AST (`eslint`):** Exit code 0 (0 warnings, 0 errores).
3. **Oráculo de Pruebas Unitarias (`vitest`):** 100% tests en verde colocated.
