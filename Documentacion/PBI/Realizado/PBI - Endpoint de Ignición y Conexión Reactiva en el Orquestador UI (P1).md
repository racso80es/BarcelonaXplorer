# [OPERATIVO] Documento Destilado: PBI - Endpoint de Ignición y Conexión Reactiva en el Orquestador UI

**Identificador:** PBI-TRIAGE-IGN-003  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-26  
**Fecha de Culminación:** 2026-09-26  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 7.1 (Refinada): Ignición Contextual y Saludo Dinámico (Aduana Universal)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%207.1%20%28Refinada%29:%20Ignici%C3%B3n%20Contextual%20y%20Saludo%20Din%C3%A1mico%20%28Aduana%20Universal%29.md)  
**Módulo:** `src/app/api/triage/ignition/`, `src/app/orchestrator/`  
**Entorno:** Next.js 16 (App Router / Node.js Runtime), React 19 Client Component  
**Prioridad:** Alta (P1 - Cierre de la Experiencia de Usuario)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Creación del Route Handler seguro `GET /api/triage/ignition` operando bajo `runtime = 'nodejs'` para extraer metadatos HTTP (cabecera `user-agent`, `accept-language`, cookie `bx_session_id`, hora local) e integración reactiva en `src/app/orchestrator/page.tsx` para erradicar el estado inerte de espera y mostrar el saludo contextual del conserje desde el primer instante.
- **Entorno:** `src/app/api/triage/ignition/route.ts`, `src/app/orchestrator/page.tsx`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Aislamiento de Runtimes):* Confirmación estricta de que la ruta corre en Node.js Runtime, aislada de `middleware.ts`. Extracción higiénica de la identidad sombra (`bx_session_id`).
  - *Filtro B (Resiliencia UI):* Si la llamada a `/api/triage/ignition` fallara en cliente (ej. modo offline), la UI no colapsa: renderiza un saludo táctico local de emergencia y desbloquea el cuadro de entrada.
  - *Filtro C (Erradicación de Fricción):* Sustitución del texto inerte `[ SISTEMA EN ESPERA DE INPUT TÁCTICO ]` por el primer turno del orquestador (`OrchestratorBlock role="ai"`) y sus correspondientes chispas tácticas de bienvenida.

---

## 1. Declaración de Intención (INVEST)

**Como** Usuario que entra al lienzo del Orquestador de BarcelonaXplorer,  
**Quiero** ver aparecer inmediatamente el mensaje de bienvenida contextual y las chispas informativas del día,  
**Para** no encontrarme con una interfaz silenciosa o confusa, sabiendo de inmediato cómo comenzar mi exploración.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Route Handler de Ignición):** Creación de [`src/app/api/triage/ignition/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/triage/ignition/route.ts) con:
  - `export const runtime = 'nodejs';`
  - Extracción de `bx_session_id` desde cookies o generación automática de nuevo UUID con fijación de cookie perimetral en la respuesta.
  - Detección de dispositivo a partir de `user-agent` y de franja horaria a partir de la hora actual en Barcelona (`Europe/Madrid`).
  - Despacho a `ContextualIgnitionUseCase` y respuesta HTTP 200 con el sobre tipado canónico `OperationEnvelope<IgnitionOutcome>`.
- [x] **CA-2 (Despertar del Conserje en `OrchestratorPage`):** Actualización de [`src/app/orchestrator/page.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/orchestrator/page.tsx) para:
  - Efecto de ignición automático (`useEffect`) en montaje inicial al detectar `turns.length === 0`.
  - Inyección del saludo contextual en el estado de `ignitionState` y montaje visual del bloque del conserje con sus chispas tácticas climáticas y de continuidad.
  - Erradicación del "síndrome de la caja vacía" (`[ SISTEMA EN ESPERA DE INPUT TÁCTICO ]`) en cuanto el conserje despierta.
- [x] **CA-3 (Soberanía y Tolerancia a Fallos Offline):** Manejo fail-soft defensivo en cliente ante problemas de red o latencia.
- [x] **CA-4 (Verificación de Integración y Tests):** Tests del endpoint en [`src/app/api/triage/ignition/route.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/triage/ignition/route.test.ts) (2 tests) y verificación del flujo reactivo en [`src/app/orchestrator/__tests__/page.test.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/orchestrator/__tests__/page.test.tsx) pasando al 100%.

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
   npx vitest run --exclude "**/e2e/**"
   # Test Files: 73 passed (73)
   # Tests: 376 passed (376)
   # Duration: 19.53s
   ```
