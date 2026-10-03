# [OPERATIVO] PBI - Bifurcación Fire-and-Forget del Triaje

**Identificador:** PBI-ARCH-JEV-005
**Estatus:** Completado / Certificado S+ Grade
**Fecha de Culminación:** 2026-10-03
**Historia de Usuario:** [[ARQUITECTURA] Triaje Paramétrico Asíncrono (Centinela Jev) y Fricción Cero](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Triaje%20Param%C3%A9trico%20As%C3%ADncrono%20%28Centinela%20Jet%29%20y%20Fricci%C3%B3n%20Cero.md) · Escenario 1
**Acta:** [PBI-ARCH-JEV-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Acta%20del%20Centinela%20Jev%20y%20Fricci%C3%B3n%20Cero%20%28PBI-ARCH-JEV-001%29.md)
**Módulo:** `src/features/triage/`, `src/app/api/triage/route.ts`
**Prioridad:** P1
**Tamaño relativo:** 3 SP
**Depende de:** `PBI-ARCH-JEV-003`, `PBI-ARCH-JEV-004`

---

## 1. Declaración (INVEST)

**Como** viajero que escribe en el orquestador,
**Quiero** recibir la respuesta del asistente en cuanto el modelo ligero termina,
**Para** que la sonda logística no alargue la espera en pantalla.

## 2. Alcance Realizado

1. **Extracción Síncrona Pura:** Eliminada la espera síncrona de `evaluateNoul` dentro de `extractMatrixVariables`. La respuesta conversacional la emite el SLM sin latencia añadida.
2. **Exclusión de Diálogo Casual:** Si el mensaje clasifica `CASUAL_DIALOGUE`, no se programa centinela ni se muta la matriz logística.
3. **Bifurcación Asíncrona:** En turnos logísticos incompletos (`INCOMPLETE_REPROMPT`), se lanza la sonda de presencia de Jev desacoplada mediante patrón fire-and-forget:
   ```ts
   this.launchSentinelProbe(...)
   ```
4. **Digestión y Fusión en Vuelo (`mergeAndPersist`):**
   - Recupera el payload previo con `matrixRepo.getMatrixPayload`.
   - Aplica `mergePresenceWithHeuristic` preservando valores confirmados por la sonda.
   - Persiste la matriz fusionada en `matrixRepo.saveMatrixPayload`.
   - Indexa la memoria en LanceDB (`sessionMemoryIndexer.index` sobre `cognitive_memories`).
5. **Mapa de Promesas en Proceso:** Registro de promesas en vuelo indexadas por `${sessionId}:${matrixId}` en `sentinel-flight-map.ts`, borradas al resolver o rechazar.
6. **Inyección en Composition Root:** Inyección de `DensityPresenceSentinel` en `src/app/api/triage/route.ts` empleando el `IaGatewayClient` existente.

## 3. Criterios de Aceptación Certificados

- [x] **CA-1:** Con un doble de Jev que no resuelve hasta que el test lo libera, `POST` del caso de uso ya devolvió el `TriageOutcome` del SLM.
- [x] **CA-2:** Un turno que el doble de intención marca como `CASUAL_DIALOGUE` no llama a `probe` y no ejecuta `saveMatrixPayload` del centinela.
- [x] **CA-3:** Al resolver la sonda, el repositorio de densidad contiene el payload fusionado y el indexador de sesión recibe una llamada.
- [x] **CA-4:** Si `probe` rechaza, el outcome HTTP del turno permanece intacto y la telemetría registra `DENSITY_PRESENCE_SENTINEL` en nivel `WARN`.

## 4. Evidencia de Certificación (La Santa Trinidad de Oráculos)

| Oráculo | Comando de Ejecución | Resultado Determinista | Estado |
| :--- | :--- | :--- | :--- |
| **Compilador TypeScript** | `npx tsc --noEmit` | **0 errores** de tipos | 🟢 Aprobado |
| **Linter AST** | `npm run lint` | **0 errores, 0 advertencias** | 🟢 Aprobado |
| **Suite de Triaje** | `npx vitest run features/triage/triage.test.ts` | **29/29 tests pasados (100%)** | 🟢 Aprobado |

## 5. Artefactos Forjados y Modificados

- [`src/features/triage/sentinel-flight-map.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/sentinel-flight-map.ts)
- [`src/features/triage/triage-input.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage-input.use-case.ts)
- [`src/features/triage/triage.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage.test.ts)
- [`src/app/api/triage/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/triage/route.ts)
