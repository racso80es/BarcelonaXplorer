# [OPERATIVO] PBI - Consolidación de la Matriz antes del Despacho

**Identificador:** PBI-ARCH-JEV-006
**Estatus:** Completado / Certificado S+ Grade
**Fecha de Culminación:** 2026-10-03
**Historia de Usuario:** [[ARQUITECTURA] Triaje Paramétrico Asíncrono (Centinela Jev) y Fricción Cero](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Triaje%20Param%C3%A9trico%20As%C3%ADncrono%20%28Centinela%20Jet%29%20y%20Fricci%C3%B3n%20Cero.md) · Escenario 3
**Acta:** [PBI-ARCH-JEV-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Pendiente/PBI%20-%20Acta%20del%20Centinela%20Jev%20y%20Fricci%C3%B3n%20Cero%20%28PBI-ARCH-JEV-001%29.md)
**Módulo:** `src/features/triage/`, `src/features/planner/`
**Prioridad:** P1
**Tamaño relativo:** 2 SP
**Depende de:** `PBI-ARCH-JEV-005`

---

## 1. Declaración (INVEST)

**Como** viajero cuya matriz ya alcanza el umbral para generar la ruta,
**Quiero** que el itinerario use los datos logísticos que el centinela acaba de confirmar,
**Para** que Gemini reciba la ventana, el grupo, la vibra y las restricciones de la sesión y no los vuelva a adivinar.

## 2. Alcance Realizado

1. **Join Acotado:** Justo antes de proceder con el despacho en `TriageInputUseCase`, si la matriz satisface el umbral (>= 60%) y existe una promesa en vuelo para `${sessionId}:${matrixId}`, el sistema espera hasta `DENSITY_SENTINEL_JOIN_TIMEOUT_MS` (1500 ms).
2. **Relectura y Consolidación:** Al resolver dentro del plazo, se vuelve a leer `matrixRepo.getMatrixPayload` y ese payload fusionado y comprometido es el que entra a `GenerateTacticalRouteUseCase`.
3. **Resiliencia ante Timeout:** Si la sonda no resuelve en 1500 ms, continúa con el payload comprometido previo y emite telemetría `WARN` con `eventType: 'DENSITY_PRESENCE_SENTINEL_JOIN_TIMEOUT'`.
4. **Fricción Cero en Diálogo y Repregunta:** Los caminos `INCOMPLETE_REPROMPT` y `CASUAL_DIALOGUE` no ejecutan el join, preservando la inmediatez conversacional.
5. **Aislamiento de Decisión:** `GenerateTacticalRouteUseCase` consume directamente el payload consolidado y carece de dependencias hacia `ITypedDecisionEngine` (`evaluateNoul` / `evaluateChoice`).

## 3. Criterios de Aceptación Certificados

- [x] **CA-1:** Con una sonda en vuelo que resuelve `has_time_window: true` y una heurística que aporta `time_window`, el despacho ve ese `time_window` en el payload que cruza el umbral.
- [x] **CA-2:** Si la sonda no resuelve en 1500 ms, el despacho continúa con el payload previo y registra `DENSITY_PRESENCE_SENTINEL_JOIN_TIMEOUT`.
- [x] **CA-3:** Un turno `INCOMPLETE_REPROMPT` o `CASUAL_DIALOGUE` no espera esa promesa.
- [x] **CA-4:** El test del generador de ruta demuestra que `GenerateTacticalRouteUseCase` no llama a `evaluateNoul` ni a `evaluateChoice`.

## 4. Evidencia de Certificación (La Santa Trinidad de Oráculos)

| Oráculo | Comando de Ejecución | Resultado Determinista | Estado |
| :--- | :--- | :--- | :--- |
| **Compilador TypeScript** | `npx tsc --noEmit` | **0 errores** de tipos | 🟢 Aprobado |
| **Linter AST** | `npm run lint` | **0 errores, 0 advertencias** | 🟢 Aprobado |
| **Suite de Triaje y Planner** | `npx vitest run features/triage/triage.test.ts features/planner/generate-tactical-route.test.ts` | **44/44 tests pasados (100%)** | 🟢 Aprobado |

## 5. Artefactos Modificados

- [`src/features/triage/triage-input.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage-input.use-case.ts)
- [`src/features/triage/triage.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage.test.ts)
- [`src/features/planner/generate-tactical-route.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/generate-tactical-route.test.ts)
- [`src/features/triage/index.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/index.ts)
