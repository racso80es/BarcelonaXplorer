# [OPERATIVO] Documento Destilado: PBI - Sincronización Termodinámica e Integración Reactiva en el Orquestador UI

**Identificador:** PBI-TRIAGE-THM-002  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-26  
**Fecha de Culminación:** 2026-09-26  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 8 (Refinada): Gamificación Sensorial y Medidor Térmico Agnóstico (UI-UX)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%208%20%28Refinada%29:%20Gamificaci%C3%B3n%20Sensorial%20y%20Medidor%20T%C3%A9rmico%20Agn%C3%B3stico%20%28UI-UX%29.md)  
**Módulo:** `src/app/orchestrator/`  
**Entorno:** Next.js 16 (App Router), React 19 Client Component, Aduana Universal `/api/triage`  
**Prioridad:** Alta (P1 - Cierre de la Experiencia Visual y Gamificación)  
**Estimación Táctica:** 2 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Integración reactiva del componente `ThermalMeter` en la superficie visual del orquestador conversacional (`src/app/orchestrator/page.tsx`), sincronizando de forma idempotente el estado de densidad retornado por la Aduana Universal (`TriageOutcomeDto`) y preservando la completa operatividad del canal de entrada conversacional.
- **Entorno:** `src/app/orchestrator/page.tsx`, `src/features/triage/components/thermal-meter.tsx`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Desambiguación de la Paradoja de Bloqueo):* El canal de entrada de chat (TextArea y botón de envío) permanece **siempre desbloqueado** para permitir el ingreso de prompts de clarificación; solo se inhabilita transitoriamente durante la asimilación del orquestador (`status === 'orchestrating'`).
  - *Filtro B (Sincronización Idempotente con la Aduana):* Consumo de los campos `score`, `survivalThreshold`, `isThresholdSatisfied`, `missingVariable` y `matrixId` de la respuesta de `/api/triage` sin re-cálculos locales en el frontend.
  - *Filtro C (Flujo Ergonomico de Despacho):* Al pulsar "Forjar Ruta Inmediata" en el medidor térmico, se despacha la solicitud de itinerario si el umbral está satisfecho.

---

## 1. Declaración de Intención (INVEST)

**Como** Turista interactuando con el orquestador de BarcelonaXplorer,  
**Quiero** que el medidor térmico reaccione en tiempo real conforme respondo a las preguntas y aporto detalles en el chat,  
**Para** saber cuándo el sistema ya tiene suficiente contexto para darme mi ruta personalizada o cuándo he desbloqueado el modo de máxima fidelidad.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Estado Reactivo del Medidor Térmico):** Inicialización de `thermalState` en `OrchestratorPage` (`score: 0`, `survivalThreshold: 60`, `isThresholdSatisfied: false`, `matrixId: 'default'`) y actualización fluida con cada respuesta de `/api/triage`.
- [x] **CA-2 (Emplazamiento Ergonómico en UI):** Montaje de [`ThermalMeter`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/components/thermal-meter.tsx) en [`src/app/orchestrator/page.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/orchestrator/page.tsx) dentro de la barra flotante de entrada (sticky bottom), con alta visibilidad y sin desplazar los turnos del chat.
- [x] **CA-3 (Preservación del Canal de Entrada y Despacho):**
  - El input conversacional permite enviar mensajes en cualquier estado termodinámico (`inert`, `operational`, `saturated`).
  - El disparador de despacho `handleForceDispatch` en el `ThermalMeter` forja la ruta inmediata cuando el usuario decide cerrar la planificación.
- [x] **CA-4 (Verificación de Integración y Tests):** Tests de integración colocated en [`src/app/orchestrator/__tests__/page.test.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/orchestrator/__tests__/page.test.tsx) verificando la transición reactiva del medidor térmico al recibir la respuesta de triaje (5 tests al 100% verde).

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
3. **Suite de Pruebas Unitarias e Integración (`vitest`):**
   ```bash
   npx vitest run app/orchestrator/__tests__/
   # Test Files: 2 passed (2)
   # Tests: 11 passed (11)
   # Duration: 4.14s
   ```
