# [OPERATIVO] Documento Destilado: PBI - Endpoint de Ignición y Conexión Reactiva en el Orquestador UI

**Identificador:** PBI-TRIAGE-IGN-003  
**Estatus:** Pendiente  
**Fecha de Creación:** 2026-09-26  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 7.1 (Refinada): Ignición Contextual y Saludo Dinámico (Aduana Universal)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%207.1%20%28Refinada%29:%20Ignici%C3%B3n%20Contextual%20y%20Saludo%20Din%C3%A1mico%20%28Aduana%20Universal%29.md)  
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

- [ ] **CA-1 (Route Handler de Ignición):** Creación de `src/app/api/triage/ignition/route.ts` con:
  - `export const runtime = 'nodejs';`
  - Extracción de `bx_session_id` desde cookies o generación automática de nuevo UUID.
  - Detección de dispositivo a partir de `user-agent` y de franja horaria a partir de la hora actual en Barcelona (`Europe/Madrid`).
  - Despacho a `ContextualIgnitionUseCase` y respuesta HTTP 200 con el sobre tipado.
- [ ] **CA-2 (Despertar del Conserje en `OrchestratorPage`):** Actualización de `src/app/orchestrator/page.tsx` para:
  - Efecto de ignición automático (`useEffect`) en montaje inicial si `turns.length === 0`.
  - Inyección del saludo contextual en el estado de turnos como `role="ai"` y montaje de las chispas sensoriales (clima, hora).
  - Eliminación de la pantalla inerte `[ SISTEMA EN ESPERA DE INPUT TÁCTICO ]` una vez completada la ignición.
- [ ] **CA-3 (Soberanía y Tolerancia a Fallos Offline):** Manejo defensivo en cliente con fallback si la red del cliente experimenta cortes.
- [ ] **CA-4 (Verificación de Integración y Tests):** Tests de la ruta HTTP de ignición en `src/app/api/triage/ignition/route.test.ts` y verificación de flujo de renderizado en `src/app/orchestrator/__tests__/`.

---

## 3. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

*(Se completará tras la implementación y validación empírica)*
