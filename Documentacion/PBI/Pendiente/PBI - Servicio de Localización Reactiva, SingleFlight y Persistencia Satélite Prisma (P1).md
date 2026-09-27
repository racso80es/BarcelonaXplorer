# [OPERATIVO] Documento Destilado: PBI - Servicio de Localización Reactiva, SingleFlight y Persistencia Satélite Prisma

**Identificador:** PBI-I18N-TEMPLATE-SERVICE-002  
**Estatus:** Pendiente de Implementación (S+ Grade)  
**Fecha de Creación:** 2026-09-27  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 12: Internacionalización Reactiva Persistida y Soberanía de Idioma (S+ Grade)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%2012:%20Internacionalizaci%C3%B3n%20Reactiva%20Persistida%20y%20Soberan%C3%ADa%20de%20Idioma.md)  
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

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Puerto y Adaptador de Traducción Estructurada):** Definir `ITemplateTranslationServicePort` y adaptador con cliente Gemini AI utilizando JSON Schema determinista y timeout de 8000ms.
- [ ] **CA-2 (Deduplicación de Peticiones en Vuelo - SingleFlight):** Implementar registro de promesas activas en memoria para evitar que múltiples solicitudes concurrentes sobre el mismo template disparen múltiples llamadas al LLM.
- [ ] **CA-3 (Persistencia Satélite Relacional en Prisma):** Almacenar las traducciones atómicas resultantes en `GuideTemplateTranslation` y `TemplateItemTranslation` dentro de una transacción Prisma (`$transaction`).
- [ ] **CA-4 (Caso de Uso Localizado con Cache Hit / Miss):** Implementar o extender `GetPublishedTemplateBySlugUseCase` para admitir `lang: SupportedLanguage`. Si existe traducción o si el idioma es `es`, despachar en Cache Hit (0 tokens). Si es Cache Miss, ejecutar flujo Paciente Cero.
- [ ] **CA-5 (Fail-Soft Resiliente y Asincronía):** Si Gemini falla, capturar el error, emitir log de telemetría y devolver el template en castellano (`es`) con sobre `OperationEnvelope`.
- [ ] **CA-6 (Colocated Tests S+ Grade):** Pruebas unitarias e integración colocated validando Cache Hit, Cache Miss simulado, deduplicación SingleFlight y tolerancia a fallos.

---

## 3. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

1. **Compilador TypeScript (`tsc --noEmit`):** Exit code 0.
2. **Linter AST (`eslint`):** Exit code 0 (0 warnings, 0 errores).
3. **Oráculo de Pruebas Unitarias (`vitest`):** 100% tests en verde colocated.
