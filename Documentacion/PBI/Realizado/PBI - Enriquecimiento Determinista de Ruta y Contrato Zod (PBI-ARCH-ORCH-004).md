# [OPERATIVO] PBI - Enriquecimiento Determinista de Ruta y Contrato Zod

**Identificador:** PBI-ARCH-ORCH-004  
**Estatus:** Certificado dentro del lote [PBI-ARCH-ORCH-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Orquestaci%C3%B3n%20H%C3%ADbrida%20y%20Triaje%20Sem%C3%A1ntico%20con%20Persistencia%20MySQL.md)  
**Historia de Usuario:** [[ARQUITECTURA] Lienzo de Orquestación Híbrida y Triaje Semántico](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Lienzo%20de%20Orquestaci%C3%B3n%20H%C3%ADbrida%20y%20Triaje%20Sem%C3%A1ntico.md) · Escenario 3 (servicio)  
**Módulo:** `src/features/planner/affiliate/`  
**Prioridad:** P1  
**Tamaño relativo:** 3 SP  

---

## 1. Declaración (INVEST)

**Como** viajero que ya dio el marco de su salida,  
**Quiero** que cada parada llegue con una opción principal y una alternativa local, y con un enlace de reserva coherente con el tipo de actividad,  
**Para** comparar sin depender de que un modelo invente proveedores.

## 2. Alcance

El LLM entrega una `TacticalRoute` lineal. `AffiliateEnricherService.enrichRoute` recorre los waypoints y, para cada uno:

1. Clasifica la actividad (`GASTRONOMY`, `CULTURE`, `ACTIVITY`, `TRANSIT`, `GENERAL`).
2. Construye dos `WaypointOption`: la principal (`isSelected: true`) y la alternativa local (`isSelected: false`).
3. Asigna proveedor `THEFORK` en gastronomía, `CIVITATIS` en cultura o tours, o `NONE` cuando no hay afiliado.
4. Compone la URL de afiliación desde la base local. No hay llamada HTTP a TheFork ni a Civitatis en este servicio.
5. Cierra el resultado con `EnrichedRouteSchema.parse`.

El mismo servicio cruza `TACTICAL_KNOWLEDGE_BASE` (alertas, nivel de carteristas, alternativas de barrio). El banner, los badges y los drops de saturación que esa base alimenta se especifican y certifican en la HU-10 (`PBI-PLN-TACTICAL-ENRICH-001`, `PBI-FEAT-CANVAS-SURVIVAL-002`). Este corte exige las dos opciones, el proveedor y el parseo Zod.

## 3. Fuera de este corte

El render del lienzo es `PBI-ARCH-ORCH-005`. El alta en MySQL es `PBI-ARCH-ORCH-007`. El circuit breaker y el catálogo estático de resiliencia son un PBI posterior.

## 4. Criterios de aceptación

- [x] **CA-1:** Cada waypoint enriquecido expone exactamente dos opciones, con una sola marcada `isSelected`.
- [x] **CA-2:** Gastronomía resuelve `THEFORK`. Cultura y tours resuelven `CIVITATIS`.
- [x] **CA-3:** Una ruta que no cumple `EnrichedRouteSchema` no sale del servicio.
- [x] **CA-4:** El enriquecimiento termina sin consultar la red de los proveedores.

## 5. Evidencia colocada

- `src/features/planner/affiliate/affiliate-enricher.schema.ts` (`EnrichedRouteSchema`, `WaypointOption`)
- `src/features/planner/affiliate/affiliate-enricher.service.ts`
- `src/features/planner/affiliate/affiliate-enricher.service.test.ts`
- `src/features/planner/routes.fixture.contract.test.ts`

La Santa Trinidad del lote padre (2026-09-26): `tsc --noEmit` limpio, `eslint` limpio, `vitest` 318/318.
