# [OPERATIVO] PBI - Acta del Centinela Jev y Fricción Cero

**Identificador:** PBI-ARCH-JEV-001
**Estatus:** Completado / Certificado S+ Grade
**Fecha de Culminación:** 2026-10-03
**Historia de Usuario:** [[ARQUITECTURA] Triaje Paramétrico Asíncrono (Centinela Jev) y Fricción Cero](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario_Historico/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Triaje%20Param%C3%A9trico%20As%C3%ADncrono%20%28Centinela%20Jet%29%20y%20Fricci%C3%B3n%20Cero.md)
**Módulo:** `src/features/triage/`, `src/features/planner/`, `src/features/ai-engine/`, `src/features/cognitive-memory/`, `src/app/api/triage/`
**Prioridad:** P1
**Tamaño relativo:** Acta. El trabajo vive en los cortes `002`–`006` (10 SP).

---

## 1. Declaración (INVEST)

**Como** operador que mantiene el triaje de BarcelonaXplorer,
**Quiero** un lote que separe la respuesta conversacional del SLM y la sonda logística de Jev,
**Para** que la latencia del chat la marque Groq y el despacho de ruta consuma una matriz ya consolidada.

## 2. Alcance del Lote Realizado

El lote ha desacoplado la **sonda de presencia** fuera del camino crítico del chat web, manteniendo la heurística determinista síncrona en el hilo principal y resolviendo la digestión paramétrica en segundo plano con consolidación previa al despacho.

| Corte | Entrega | Estado |
| :--- | :--- | :--- |
| `PBI-ARCH-JEV-002` | Esquema Zod de las cuatro banderas `has_*` (`DensityPresenceProbeSchema`). | 🟢 Certificado |
| `PBI-ARCH-JEV-003` | Caso de uso `DensityPresenceSentinel` con 4 `evaluateNoul` concurrentes y retorno en `OperationEnvelope`. | 🟢 Certificado |
| `PBI-ARCH-JEV-004` | Función pura `mergePresenceWithHeuristic` que fusiona la sonda con la heurística y valida `DefaultDensityPayloadSchema`. | 🟢 Certificado |
| `PBI-ARCH-JEV-005` | Bifurcación fire-and-forget en `TriageInputUseCase` y composition root en `POST /api/triage`. | 🟢 Certificado |
| `PBI-ARCH-JEV-006` | Join acotado a 1500ms (`DENSITY_SENTINEL_JOIN_TIMEOUT_MS`) antes del despacho al Orquestador Pesado (Gemini). | 🟢 Certificado |

## 3. Fronteras y Jurisdicción Respetadas

- Jev, vía `ITypedDecisionEngine`, responde exclusivamente `evaluateNoul` para las 4 variables canónicas (`time_window`, `group_size`, `vibe`, `constraints`).
- Los valores logísticos crudos nacen en `extractMatrixVariables` por heurística determinista.
- La verdad operativa del peaje del 60 % reside en `DensityMatrixRepositoryPort`.
- La copia durable de la sesión se indexa en LanceDB (`cognitive_memories`) mediante `IndexSessionMemoryService`.
- `context_memory` permanece aislado para el corpus hiperlocal de fuentes de contexto.
- Un turno `CASUAL_DIALOGUE` no programa el centinela.

## 4. Criterios de Aceptación Certificados

- [x] **CA-1:** Los cortes `002`–`006` están implementados y cada uno cruza `tsc --noEmit`, `eslint` y `vitest run` sobre los tests del corte.
- [x] **CA-2:** Un turno de chat no espera a las cuatro sondas `evaluateNoul` (fricción cero).
- [x] **CA-3:** El despacho que cruza el 60 % lee un `DefaultDensityPayload` posterior al centinela de ese turno, o el último payload comprometido si el join agota su tiempo (1500 ms).
- [x] **CA-4:** Ningún corte introduce `any`, un bus de eventos ni escritura en `context_memory`.

## 5. Evidencia de Certificación (La Santa Trinidad de Oráculos)

| Oráculo | Comando de Ejecución | Resultado Determinista | Estado |
| :--- | :--- | :--- | :--- |
| **Compilador TypeScript** | `npx tsc --noEmit` | **0 errores** de tipos | 🟢 Aprobado |
| **Linter AST** | `npm run lint` | **0 errores, 0 advertencias** | 🟢 Aprobado |
| **Suite Completa del Workspace** | `npm test` | **654/654 tests pasados (100%)** | 🟢 Aprobado |

## 6. Artefactos del Lote Forjado

- [`src/features/triage/density-presence-probe.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/density-presence-probe.schema.ts)
- [`src/features/triage/density-presence-probe.schema.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/density-presence-probe.schema.test.ts)
- [`src/features/triage/density-presence-sentinel.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/density-presence-sentinel.use-case.ts)
- [`src/features/triage/density-presence-sentinel.use-case.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/density-presence-sentinel.use-case.test.ts)
- [`src/features/triage/merge-presence-with-heuristic.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/merge-presence-with-heuristic.ts)
- [`src/features/triage/merge-presence-with-heuristic.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/merge-presence-with-heuristic.test.ts)
- [`src/features/triage/sentinel-flight-map.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/sentinel-flight-map.ts)
- [`src/features/triage/triage-input.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage-input.use-case.ts)
- [`src/features/triage/triage.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage.test.ts)
- [`src/features/planner/generate-tactical-route.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/generate-tactical-route.test.ts)
- [`src/app/api/triage/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/triage/route.ts)
