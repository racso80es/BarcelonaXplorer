# [OPERATIVO] Documento Destilado: PBI - Servicio de Localización Reactiva, SingleFlight y Persistencia Satélite Prisma

**Identificador:** PBI-I18N-TEMPLATE-SERVICE-002  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-27  
**Fecha de Culminación:** 2026-09-27  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 12: Internacionalización Reactiva Persistida y Soberanía de Idioma (S+ Grade)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%2012:%20Internacionalizaci%C3%B3n%20Reactiva%20Persistida%20y%20Soberan%C3%ADa%20de%20Idioma.md)  
**Módulo:** `src/features/guide-templates/` y `src/prisma/`  
**Entorno:** Next.js 16 / TypeScript 5.8+ / Prisma ORM 5.22 / Gemini AI / Vitest  
**Prioridad:** Alta (P1 - Motor de Traducción Reactiva y Persistencia Satélite)  
**Estimación Táctica:** 5 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Implementación del patrón Paciente Cero para templates de guías, orquestación estructurada con Gemini AI, deduplicación de llamadas con SingleFlight en memoria y persistencia relacional en tablas satélite MySQL (`GuideTemplateTranslation`, `TemplateItemTranslation`).
- **Entorno:** `src/features/guide-templates/domain/`, `src/features/guide-templates/ports/`, `src/features/guide-templates/adapters/`, `src/features/guide-templates/use-cases/` y colocated tests.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Desactivación de la Trampa del Timeout y SingleFlight):* Ventana de 8000ms para Gemini estructurado, deduplicación en memoria de peticiones concurrentes a la misma tupla `(templateId, language)`, y persistencia asíncrona desacoplada de fondo (Fire-and-Persist) si se agota el timeout para no colapsar la UI.
  - *Filtro B (Tolerancia Cero a la Inferencia y Fail-Soft - Axioma V):* Uso de esquemas deterministas Zod para forzar a Gemini a devolver exactamente la estructura de traducción. Si la IA falla, degradación Fail-Soft al idioma maestro (`es`) encapsulado en `OperationEnvelope`.
  - *Filtro C (Economía Termodinámica - 0 Tokens en Cache Hit):* Si las tablas satélite ya contienen la traducción para ese idioma, se sirve en $<40\text{ms}$ directamente desde MySQL con 0 consumo LLM.

---

## 1. Declaración de Intención (INVEST)

**Como** Desarrollador Backend del Catálogo de BarcelonaXplorer,  
**Quiero** implementar el servicio de localización reactiva con Gemini y deduplicación SingleFlight integrado con Prisma,  
**Para** traducir bajo demanda guías completas del catálogo editorial al idioma del explorador, almacenando permanentemente el resultado en MySQL con fail-soft absoluto.

---

## 2. Criterios de Aceptación Certificados (Aduana de Fricción)

- [x] **CA-1 (Puerto y Adaptador de Traducción Estructurada):** Definido `ITemplateTranslationServicePort` y adaptador `GeminiTemplateTranslationAdapter` con cliente Gemini AI utilizando JSON Schema determinista y timeout configurable (8000ms por defecto).
- [x] **CA-2 (Deduplicación de Peticiones en Vuelo - SingleFlight):** Implementado registro estático de promesas activas en memoria para evitar que múltiples solicitudes concurrentes sobre el mismo template disparen múltiples llamadas al LLM.
- [x] **CA-3 (Persistencia Satélite Relacional en Prisma):** Implementado `saveTemplateTranslation` en `PrismaGuideTemplateRepository` utilizando `$transaction` con upserts en `GuideTemplateTranslation` y `TemplateItemTranslation`.
- [x] **CA-4 (Caso de Uso Localizado con Cache Hit / Miss):** Actualizado `GetPublishedTemplateBySlugUseCase` para admitir `language`. Si existe traducción o si el idioma es `es`, se despacha en Cache Hit (0 tokens). Si es Cache Miss, se ejecuta el flujo Paciente Cero.
- [x] **CA-5 (Fail-Soft Resiliente y Asincronía):** Si Gemini falla o supera el timeout, se captura el error, emitiendo log de telemetría y devolviendo el template en castellano (`es`) con sobre `OperationEnvelope`.
- [x] **CA-6 (Colocated Tests S+ Grade):** 41 tests pasados en `src/features/guide-templates/` validando Cache Hit, Cache Miss, deduplicación SingleFlight y tolerancia a fallos.

---

## 3. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

1. **Compilador TypeScript (`tsc --noEmit`):**
   ```bash
   npx tsc --noEmit
   # Exit code: 0 (Cero errores de compilación)
   ```
2. **Linter AST (`eslint`):**
   ```bash
   npm run lint
   # Exit code: 0 (0 warnings, 0 errores)
   ```
3. **Oráculo de Pruebas Unitarias (`vitest`):**
   ```bash
   npx vitest run features/guide-templates
   # Test Files: 7 passed (7)
   # Tests: 41 passed (41)
   # Duration: 690ms
   ```

---

## 4. Artefactos Modificados

- [`src/features/guide-templates/ports/template-translation-service.port.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/ports/template-translation-service.port.ts)
- [`src/features/guide-templates/adapters/gemini-template-translation.adapter.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/adapters/gemini-template-translation.adapter.ts)
- [`src/features/guide-templates/adapters/gemini-template-translation.adapter.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/adapters/gemini-template-translation.adapter.test.ts)
- [`src/features/guide-templates/domain/guide-template.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/domain/guide-template.schema.ts)
- [`src/features/guide-templates/ports/guide-template-repository.port.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/ports/guide-template-repository.port.ts)
- [`src/features/guide-templates/adapters/prisma-guide-template.repository.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/adapters/prisma-guide-template.repository.ts)
- [`src/features/guide-templates/use-cases/get-published-template-by-slug.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/use-cases/get-published-template-by-slug.use-case.ts)
- [`src/features/guide-templates/use-cases/get-published-template-by-slug.use-case.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/use-cases/get-published-template-by-slug.use-case.test.ts)
- [`src/features/guide-templates/index.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/guide-templates/index.ts)
