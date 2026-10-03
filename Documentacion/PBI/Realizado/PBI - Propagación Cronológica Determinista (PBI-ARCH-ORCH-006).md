# [OPERATIVO] PBI - Propagación Cronológica Determinista

**Identificador:** PBI-ARCH-ORCH-006  
**Estatus:** Certificado dentro del lote [PBI-ARCH-ORCH-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Orquestaci%C3%B3n%20H%C3%ADbrida%20y%20Triaje%20Sem%C3%A1ntico%20con%20Persistencia%20MySQL.md)  
**Historia de Usuario:** [[ARQUITECTURA] Lienzo de Orquestación Híbrida y Triaje Semántico](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Lienzo%20de%20Orquestaci%C3%B3n%20H%C3%ADbrida%20y%20Triaje%20Sem%C3%A1ntico.md) · Escenario 5  
**Módulo:** `src/features/planner/chronological-propagator.ts`, `src/app/orchestrator/page.tsx`  
**Prioridad:** P1  
**Tamaño relativo:** 2 SP  

---

## 1. Declaración (INVEST)

**Como** viajero que adelanta o retrasa una parada en el lienzo,  
**Quiero** que las paradas siguientes se muevan solas respetando un margen entre ellas,  
**Para** corregir el día sin volver a pedir una ruta al modelo.

## 2. Alcance

`ChronologicalPropagator.propagate(waypoints, targetId, newStartTime, newEndTime?)` devuelve una lista nueva:

- El nodo editado adopta la hora nueva. Si no llega hora de fin, conserva la duración previa, con un suelo de 15 minutos (o 60 minutos si el nodo no tenía fin).
- Cada nodo posterior arranca al menos 15 minutos después del fin del anterior (`MINIMUM_TRANSITION_GAP_MINUTES`).
- Ninguna hora supera las 23:59 (`MAX_DAY_MINUTES`).
- Una hora mal formada, un `targetId` ausente o un fin anterior o igual al inicio lanzan error y el estado previo del lienzo se conserva.

`handleTimeShift` aplica el resultado con `flushSync` y muestra el aviso de éxito del diccionario de UI. El cálculo corre en el cliente.

## 3. Fuera de este corte

Persistir `startTime` y `endTime` en MySQL después del recálculo es `PBI-ARCH-ORCH-008`. `updateNodeTime` existe en el repositorio y no lo invoca la página.

## 4. Criterios de aceptación

- [x] **CA-1:** Retrasar el inicio de un nodo desplaza el inicio de los nodos posteriores y mantiene al menos 15 minutos entre el fin de uno y el inicio del siguiente.
- [x] **CA-2:** El recálculo no llama al SLM ni al LLM.
- [x] **CA-3:** Un identificador desconocido o un intervalo inválido no reemplaza el itinerario en pantalla.
- [x] **CA-4:** El tope del día queda en 23:59.

## 5. Evidencia colocada

- `src/features/planner/chronological-propagator.ts`
- `src/features/planner/chronological-propagator.test.ts`
- `src/app/orchestrator/page.tsx` (`handleTimeShift`)
- `src/app/orchestrator/__tests__/render-governance.test.tsx`

La Santa Trinidad del lote padre (2026-09-26): `tsc --noEmit` limpio, `eslint` limpio, `vitest` 318/318.
