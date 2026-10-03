# [OPERATIVO] PBI - Escritura de Vuelta de Selección y Horario del Lienzo

**Identificador:** PBI-ARCH-ORCH-008  
**Estatus:** Completado / Certificado S+ Grade  
**Fecha de Creación:** 2026-10-03  
**Fecha de Culminación:** 2026-10-03  
**Historia de Usuario:** [[ARQUITECTURA] Lienzo de Orquestación Híbrida y Triaje Semántico](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Lienzo%20de%20Orquestaci%C3%B3n%20H%C3%ADbrida%20y%20Triaje%20Sem%C3%A1ntico.md) · Escenario 4 (base de datos) y cierre del Escenario 5  
**Depende de:** [PBI-ARCH-ORCH-005](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Lienzo%20Lateral%20y%20Selecci%C3%B3n%20en%20Memoria%20%28PBI-ARCH-ORCH-005%29.md), [PBI-ARCH-ORCH-006](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Propagaci%C3%B3n%20Cronol%C3%B3gica%20Determinista%20%28PBI-ARCH-ORCH-006%29.md), [PBI-ARCH-ORCH-007](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Alta%20Relacional%20del%20Itinerario%20Generado%20%28PBI-ARCH-ORCH-007%29.md)  
**Módulo:** `src/features/planner/`, `src/features/triage/`, `src/app/orchestrator/`, `src/prisma/schema.prisma`  
**Prioridad:** P2  
**Tamaño relativo:** 3 SP  

---

## 1. Declaración (INVEST)

**Como** viajero que elige una alternativa o mueve una hora en el lienzo,  
**Quiero** que esa decisión quede en el itinerario guardado de mi sesión,  
**Para** recuperar la misma opción y las mismas horas si vuelvo a abrir la ruta.

## 2. Hecho ya disponible

- `ItineraryPersistencePort.updateNodeSelection(nodeId, optionId)` reescribe el JSON `options`, deja una sola opción con `isSelected` y copia proveedor y URL de la elegida al nodo.
- `updateNodeTime(nodeId, startTime, endTime?)` actualiza las columnas horarias de un nodo.
- Ambos métodos tienen pruebas en `prisma-itinerary.repository.test.ts`.
- El lienzo ya actualiza la selección y el horario en memoria (`PBI-ARCH-ORCH-005` y `PBI-ARCH-ORCH-006`).

## 3. Hueco que cierra este PBI

`handleSelectOption` y `handleTimeShift` no llamaban al puerto. Además, el `id` del waypoint en el lienzo era el de la ruta enriquecida. `updateNodeSelection` y `updateNodeTime` buscan el `cuid` de `TacticalItineraryNode`. `saveItinerary` no almacenaba el identificador original y su DTO de vuelta se descartaba en el despacho. Llamar al repositorio con el id del lienzo no encontraba la fila.

## 4. Alcance Realizado

1. **Correlación de IDs:** `TriageInputUseCase` ahora devuelve al cliente los CUIDs generados por Prisma tras el alta del itinerario (`saveItinerary`), mapeándolos en `enrichedItinerary.waypoints` para su uso directo en el lienzo interactivo.
2. **Persistencia de Selección:** `handleSelectOption` en `OrchestratorPage` invoca de forma asíncrona `/api/planner/itinerary/select-option`, delegando en `UpdateItineraryNodeUseCase.selectOption` y `updateNodeSelection`.
3. **Persistencia de Propagación Horaria:** `handleTimeShift` en `OrchestratorPage` invoca `/api/planner/itinerary/shift-times`, persistiendo los horarios actualizados del nodo modificado y de los nodos posteriores desplazados por `ChronologicalPropagator`.
4. **Resiliencia Fail-Soft:** Si MySQL o la red fallan, el estado en pantalla se mantiene intacto y el fallo se registra en la telemetría centralizada (`TelemetryRepositoryPort`). La interfaz de usuario no muestra errores bloqueantes ni revierte el estado visual del lienzo.

## 5. Fuera de este corte

No se vuelve a invocar al LLM. No se rediseña `ChronologicalPropagator`. No se cambia el contrato de las dos opciones A/B.

## 6. Criterios de Aceptación Certificados

- [x] **CA-1:** Elegir la alternativa de una parcela deja `isSelected` solo en esa opción dentro del JSON del nodo y actualiza `affiliateProvider` y `affiliateUrl` de la fila.
- [x] **CA-2:** Mover la hora de un nodo persiste el nuevo inicio y fin de ese nodo y de los posteriores que el propagador haya desplazado.
- [x] **CA-3:** La clave que envía el lienzo resuelve la fila correcta vía CUIDs correlacionados en el alta. Un id de ruta suelto, sin correlación, es rechazado con 404 sin afectar la BD.
- [x] **CA-4:** Un fallo de escritura no deshace la selección ni el horario ya visibles en el lienzo (fail-soft).
- [x] **CA-5:** Pruebas colocadas cubren la correlación de ids, la selección y la persistencia del tramo propagado.

## 7. Evidencia de Certificación (La Santa Trinidad de Oráculos)

| Oráculo | Comando de Ejecución | Resultado Determinista | Estado |
| :--- | :--- | :--- | :--- |
| **Compilador TypeScript** | `npx tsc --noEmit` | **0 errores** de tipos | 🟢 Aprobado |
| **Linter AST** | `npx eslint ...` | **0 errores, 0 advertencias** | 🟢 Aprobado |
| **Tests de Planner & Orquestador** | `vitest run features/planner/ ...` | **74/74 tests pasados (100%)** en 12 suites | 🟢 Aprobado |
| **Suite Completa del Workspace** | `npm test` | **640/640 tests pasados (100%)** en 114 suites | 🟢 Aprobado |

## 8. Artefactos Forjados

1. **Dominio & Casos de Uso:**
   - [`src/features/planner/update-itinerary-node.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/update-itinerary-node.use-case.ts): Caso de uso para selección de alternativa y propagación horaria.
   - [`src/features/planner/update-itinerary-node.use-case.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/update-itinerary-node.use-case.test.ts): Tests colocados para CA-1 a CA-4.
   - [`src/features/planner/index.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/index.ts): Exportación de esquemas Zod nominales y contratos seguros de cliente.
   - [`src/features/planner/server.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/server.ts): Exportación server-only de `UpdateItineraryNodeUseCase`.

2. **Route Handlers HTTP:**
   - [`src/app/api/planner/itinerary/select-option/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/planner/itinerary/select-option/route.ts): Endpoint de persistencia de selección.
   - [`src/app/api/planner/itinerary/shift-times/route.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/api/planner/itinerary/shift-times/route.ts): Endpoint de persistencia de tramos horarios propagados.

3. **Orquestación & Correlación de IDs:**
   - [`src/features/triage/triage-input.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage-input.use-case.ts): Inyección de CUIDs generados por Prisma en el itinerario del despacho.
   - [`src/features/triage/triage.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage.test.ts): Test de correlación de CUIDs (CA-3).
   - [`src/app/orchestrator/page.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/orchestrator/page.tsx): Integración de llamadas de persistencia fail-soft en `handleSelectOption` y `handleTimeShift`.
   - [`src/app/orchestrator/__tests__/page.test.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/app/orchestrator/__tests__/page.test.tsx): Pruebas de integración para persistencia y resiliencia fail-soft (CA-1, CA-2, CA-4).
