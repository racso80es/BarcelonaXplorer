# [OPERATIVO] Documento Destilado: PBI - Sincronización End-to-End de la Bifurcación Táctica y Persistencia Relacional en MySQL con Fail-Soft

**Identificador:** PBI-ORCH-TACTICAL-SYNC-003  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-27  
**Fecha de Culminación:** 2026-09-27  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario 10: Gamificación Logística y Escudo de Supervivencia (Fase de Generación)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario%2010:%20Gamificaci%C3%B3n%20Log%C3%ADstica%20y%20Escudo%20de%20Supervivencia%20%28Fase%20de%20Generaci%C3%B3n%29.md)  
**Módulo:** `src/features/triage/`, `src/features/planner/`, `src/app/api/orchestrator/stream/`  
**Entorno:** Next.js Route Handlers, Prisma ORM (MySQL), Server-Sent Events (SSE), Vitest  
**Prioridad:** Alta (P1 - Integración End-to-End y Persistencia)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Coreografía de orquestación end-to-end, inyección del flag de saturación térmica en el despacho de rutas, persistencia relacional en MySQL de nodos enriquecidos y blindaje Fail-Soft ante fallos de infraestructura.
- **Entorno:** `src/features/triage/triage-input.use-case.ts`, `src/app/api/orchestrator/stream/route.ts`, `src/features/planner/prisma-itinerary.repository.ts`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Tolerancia Cero a la Inferencia):* Propagación tipada del estado de saturación (`isSaturated: density.score >= 100`) desde la Aduana Universal hacia el enriquecedor de afiliados y Route Handlers.
  - *Filtro B (Persistencia Idempotente Relacional):* Almacenamiento estructurado en MySQL (`TacticalItinerary` y `TacticalItineraryNode`) con conservación de metadatos tácticos y opciones de afiliación.
  - *Filtro C (Resiliencia Fail-Soft sin Falsas Certezas):* Manejo defensivo ante timeouts o fallos de conexión sin arrojar error 500 y emitiendo telemetría `WARN` bajo contexto `SECURITY_PERIMETER`.

---

## 1. Declaración de Intención (INVEST)

**Como** Arquitecto de Sistemas e Ingeniero de Orquestación de BarcelonaXplorer,  
**Quiero** sincronizar el nivel de saturación térmica en el despacho de itinerarios dentro de `TriageInputUseCase` y el Route Handler de streaming, persistiendo el itinerario enriquecido en MySQL con degradación elegante,  
**Para** asegurar que la bifurcación táctica Base vs S+ Grade se preserve en todo el ciclo de vida del dato sin colapsar ante fallos de servicios externos.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Propagación del Estado Térmico en TriageInputUseCase):** El caso de uso [`TriageInputUseCase`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage-input.use-case.ts) evalúa si `density.score >= 100` y pasa el argumento `thermalState` (`'saturated'` vs `'operational'`) a `this.affiliateEnricher.enrichRoute(forgedRoute, thermalState)`.
- [x] **CA-2 (Sincronización en Streaming Route Handler):** En [`src/app/api/orchestrator/stream/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/orchestrator/stream/route.ts), se recibe `thermalState` en POST/GET y se propaga a `createStreamResponse` y a `affiliateEnricher.enrichRoute(generated, thermalState)` durante la emisión SSE hacia el cliente.
- [x] **CA-3 (Persistencia Relacional en MySQL):** Almacenamiento íntegro en `PrismaItineraryRepository` preservando opciones, metadatos y enlaces de afiliación sin colisiones de tipos.
- [x] **CA-4 (Colocated Tests S+ Grade):** Pruebas de integración y unitarias en [`src/features/triage/triage.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage.test.ts) verificando que un score >= 100 genera ruta S+ Grade (`thermalState: 'saturated'`) y un score de 60-99% genera ruta Base Segura (`thermalState: 'operational'`).

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
   npx vitest run features/triage/triage.test.ts
   # Test Files: 1 passed (1)
   # Tests: 11 passed (11)
   # Duration: 552ms
   ```
