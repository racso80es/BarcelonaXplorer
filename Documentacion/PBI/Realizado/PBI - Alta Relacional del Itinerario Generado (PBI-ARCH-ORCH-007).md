# [OPERATIVO] PBI - Alta Relacional del Itinerario Generado

**Identificador:** PBI-ARCH-ORCH-007  
**Estatus:** Certificado dentro del lote [PBI-ARCH-ORCH-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Orquestaci%C3%B3n%20H%C3%ADbrida%20y%20Triaje%20Sem%C3%A1ntico%20con%20Persistencia%20MySQL.md)  
**Historia de Usuario:** [[ARQUITECTURA] Lienzo de Orquestación Híbrida y Triaje Semántico](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Lienzo%20de%20Orquestaci%C3%B3n%20H%C3%ADbrida%20y%20Triaje%20Sem%C3%A1ntico.md) · Escenario 3 (alta)  
**Módulo:** `src/prisma/schema.prisma`, `src/features/planner/prisma-itinerary.repository.ts`, `src/features/triage/triage-input.use-case.ts`  
**Prioridad:** P1  
**Tamaño relativo:** 2 SP  

---

## 1. Declaración (INVEST)

**Como** viajero cuya ruta acaba de generarse,  
**Quiero** que el itinerario quede guardado junto a mi sesión,  
**Para** poder recuperarlo aunque el lienzo se haya pintado ya en pantalla.

## 2. Alcance

Tras un `EnrichedRoute` válido, `TriageInputUseCase` llama a `ItineraryPersistencePort.saveItinerary(sessionId, enriched)` si el repositorio está inyectado.

`saveItinerary` crea un `TacticalItinerary` (`status: ACTIVE`, índice por `sessionId`) y un `TacticalItineraryNode` por waypoint, con `orderIndex`, horarios, categoría, proveedor, URL y el JSON `options`. La columna `isSelected` del nodo se graba a `true` en el alta; la opción vigente dentro del par A/B vive en ese JSON.

Si Prisma lanza, el caso de uso emite telemetría `WARN` y sigue. El `DISPATCH_READY` que ve el cliente lleva el itinerario enriquecido en memoria. El `PersistedItineraryDto` que devuelve `saveItinerary` se descarta, así que el lienzo no recibe los `cuid` de Prisma.

`getItineraryBySessionId` lee el itinerario `ACTIVE` más reciente. `updateNodeSelection` y `updateNodeTime` están en el puerto y en el adaptador, con tests de repositorio, y ningún llamador de producción los usa.

## 3. Fuera de este corte

Escribir la opción elegida o el horario editado es `PBI-ARCH-ORCH-008`. Ese corte tiene que resolver que el `id` del lienzo es el del waypoint de la ruta, y el `id` que espera el repositorio es el `cuid` de `TacticalItineraryNode`. El alta actual no guarda el identificador original de la ruta.

## 4. Criterios de aceptación

- [x] **CA-1:** Un despacho con ruta enriquecida inserta cabecera y nodos ligados a `sessionId`.
- [x] **CA-2:** Cada nodo persiste categoría, `startTime`, proveedor, URL y el array `options`.
- [x] **CA-3:** Un fallo de MySQL no convierte el despacho en error de cara al cliente.
- [x] **CA-4:** `getItineraryBySessionId` devuelve el itinerario activo más reciente de esa sesión, o `null`.

## 5. Evidencia colocada

- `src/prisma/schema.prisma` (`TacticalItinerary`, `TacticalItineraryNode`)
- `src/features/planner/itinerary-persistence.port.ts`
- `src/features/planner/prisma-itinerary.repository.ts`
- `src/features/planner/prisma-itinerary.repository.test.ts`
- `src/features/triage/triage-input.use-case.ts` (bloque `saveItinerary`)
- `src/features/triage/triage.test.ts`

La Santa Trinidad del lote padre (2026-09-26): `tsc --noEmit` limpio, `eslint` limpio, `vitest` 318/318.
