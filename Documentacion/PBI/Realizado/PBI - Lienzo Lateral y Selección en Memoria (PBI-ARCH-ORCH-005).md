# [OPERATIVO] PBI - Lienzo Lateral y Selección en Memoria

**Identificador:** PBI-ARCH-ORCH-005  
**Estatus:** Certificado dentro del lote [PBI-ARCH-ORCH-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Orquestaci%C3%B3n%20H%C3%ADbrida%20y%20Triaje%20Sem%C3%A1ntico%20con%20Persistencia%20MySQL.md)  
**Historia de Usuario:** [[ARQUITECTURA] Lienzo de Orquestación Híbrida y Triaje Semántico](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Lienzo%20de%20Orquestaci%C3%B3n%20H%C3%ADbrida%20y%20Triaje%20Sem%C3%A1ntico.md) · Escenarios 3 (lienzo) y 4 (memoria)  
**Módulo:** `src/components/tactical/hybrid-canvas.tsx`, `src/app/orchestrator/page.tsx`  
**Prioridad:** P1  
**Tamaño relativo:** 3 SP  

---

## 1. Declaración (INVEST)

**Como** viajero con el itinerario ya generado,  
**Quiero** ver las paradas en un panel distinto del chat y elegir la opción de una parcela con un clic,  
**Para** comparar alternativas sin perder el hilo de la conversación.

## 2. Alcance

`HybridCanvas` pinta las parcelas del itinerario activo al lado del hilo de mensajes. `handleSelectOption(nodeId, optionId)` recorre las opciones de ese waypoint y deja `isSelected: true` solo en la elegida. El cambio vive en el estado React de la página (`setActiveItinerary`).

El identificador que usa el clic es el `id` del waypoint que llegó en la ruta enriquecida.

## 3. Fuera de este corte

El recálculo de horas es `PBI-ARCH-ORCH-006`. Guardar la opción elegida en `TacticalItineraryNode` es `PBI-ARCH-ORCH-008`: hoy `handleSelectOption` no llama a `updateNodeSelection`. El streaming progresivo, la memoización del lienzo y el diccionario i18n de los botones son PBIs posteriores.

## 4. Criterios de aceptación

- [x] **CA-1:** Con un itinerario enriquecido, el panel lateral muestra las parcelas y el chat permanece en el panel principal.
- [x] **CA-2:** Un clic sobre la alternativa deja esa opción seleccionada y desmarca la anterior, en el mismo waypoint.
- [x] **CA-3:** La conmutación no dispara una nueva inferencia.
- [x] **CA-4:** Cerrar el lienzo limpia `activeItinerary` y no borra el historial de turnos.

## 5. Evidencia colocada

- `src/components/tactical/hybrid-canvas.tsx`
- `src/components/tactical/hybrid-canvas.test.tsx`
- `src/app/orchestrator/page.tsx` (`handleSelectOption`, `handleCloseItinerary`)
- `src/app/orchestrator/__tests__/page.test.tsx`

La Santa Trinidad del lote padre (2026-09-26): `tsc --noEmit` limpio, `eslint` limpio, `vitest` 318/318.
