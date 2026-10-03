# [OPERATIVO] PBI - Peaje Termodinámico de la Matriz de Densidad

**Identificador:** PBI-ARCH-ORCH-003  
**Estatus:** Certificado dentro del lote [PBI-ARCH-ORCH-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/PBI/Realizado/PBI%20-%20Orquestaci%C3%B3n%20H%C3%ADbrida%20y%20Triaje%20Sem%C3%A1ntico%20con%20Persistencia%20MySQL.md)  
**Historia de Usuario:** [[ARQUITECTURA] Lienzo de Orquestación Híbrida y Triaje Semántico](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario:%20Lienzo%20de%20Orquestaci%C3%B3n%20H%C3%ADbrida%20y%20Triaje%20Sem%C3%A1ntico.md) · Escenario 2  
**Módulo:** `src/features/planner/matrix.ts`, `src/features/triage/triage-input.use-case.ts`  
**Prioridad:** P1  
**Tamaño relativo:** 2 SP  

---

## 1. Declaración (INVEST)

**Como** viajero que está concretando una salida por Barcelona,  
**Quiero** que el asistente solo genere el itinerario cuando ya tiene el marco temporal, y que pregunte por lo que más pesa si aún falta,  
**Para** recibir una ruta útil sin un interrogatorio de campos irrelevantes.

## 2. Alcance

La matriz `default` («Exploración Urbana Base») autoriza al LLM pesado cuando `calculateMatrixDensity` alcanza `survival_threshold` 60.

| Variable | Puntos | Cuenta como presente |
| :--- | ---: | :--- |
| `time_window` | 60 | cadena no vacía |
| `group_size` | 15 | entero positivo |
| `vibe` | 15 | cadena no vacía |
| `constraints` | 10 | array con al menos un elemento |

`time_window` por sí solo abre el peaje. La combinación de las otras tres variables también suma 40 y no basta. Si el score queda por debajo, el caso de uso emite `INCOMPLETE_REPROMPT` sobre `highestMissingVariable` (la ausente de mayor peso).

`DefaultDensityPayloadSchema` transporta además `mood`, `districts` y `language`. Esas claves no están en `rules.weights` y no suman puntos. El esquema no tiene campo de presupuesto.

## 3. Fuera de este corte

La matriz `gastronomy` (umbral 70, pesos distintos) pertenece al PBI de registro declarativo de esa matriz. El diálogo casual pertenece a `PBI-ARCH-ORCH-002`. La síntesis de la ruta, una vez abierto el peaje, pertenece a `PBI-ARCH-ORCH-004`.

## 4. Criterios de aceptación

- [x] **CA-1:** Con `time_window` presente, `isThresholdSatisfied` es verdadero en la matriz `default` aunque falten grupo, vibra y restricciones.
- [x] **CA-2:** Sin `time_window` y con el resto vacío, el score es 0 y `highestMissingVariable` es `time_window`.
- [x] **CA-3:** Por debajo del umbral, el triaje responde `INCOMPLETE_REPROMPT` y no invoca al generador de ruta.
- [x] **CA-4:** Al alcanzar el umbral, el caso de uso continúa hacia la síntesis de `TacticalRoute`.

## 5. Evidencia colocada

- `src/features/planner/matrix.ts` (`DENSITY_MATRIX_REGISTRY.default`, `calculateMatrixDensity`)
- `src/features/planner/matrix.test.ts`
- `src/features/triage/triage-input.use-case.ts`
- `src/features/triage/triage-input.live.test.ts` (repregunta cuando falta `time_window`)

La Santa Trinidad del lote padre (2026-09-26): `tsc --noEmit` limpio, `eslint` limpio, `vitest` 318/318.
