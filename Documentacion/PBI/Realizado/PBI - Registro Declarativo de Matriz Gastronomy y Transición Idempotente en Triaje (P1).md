# [ARQUITECTURA] Documento Destilado: PBI - Registro Declarativo de Matriz Gastronomy y Transición Idempotente en Triaje

**Identificador:** PBI-CORE-TRIAGE-003  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-26  
**Fecha de Certificación:** 2026-09-26  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 6: Matriz de Densidad Polimórfica y Umbral Operativo (El Peaje Termodinámico)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%206:%20Matriz%20de%20Densidad%20Polim%C3%B3rfica%20y%20Umbral%20Operativo%20%28El%20Peaje%20Termodin%C3%A1mico%29.md)  
**Módulo:** `src/features/planner/`, `src/features/triage/`  
**Entorno:** TypeScript 5.x, Zod, Vitest  
**Prioridad:** Alta (P1 - Flexibilidad Polimórfica y Transición de Contexto Dialógico)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Extensión declarativa del catálogo de matrices con la incorporación de la matriz `"gastronomy"` y migración limpia de variables en transiciones de intención en el triaje multivuelta.
- **Entorno:** [`src/features/planner/matrix.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/matrix.ts) y [`src/features/triage/triage-input.use-case.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage-input.use-case.ts).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Rigor Técnico y Principio OCP):* La adición de la matriz `"gastronomy"` se realiza estrictamente como una nueva clave declarativa en `DENSITY_MATRIX_REGISTRY`, sin añadir bifurcaciones `if/else` condicionales en el motor de cálculo `calculateMatrixDensity`.
  - *Filtro B (Determinismo en Transición de Matrices):* Cuando el usuario cambia de matriz dentro de la misma sesión, se preservan las variables universales consolidadas (`time_window`, `group_size`, `districts`) y se depuran o revalidan las variables tácticas huérfanas frente a la nueva matriz activa.
  - *Filtro C (Eficiencia Operativa / Priorización Atómica):* Si el usuario en `"gastronomy"` solo fija la hora de la cena (25%), el cálculo de densidad prioriza `group_size` (peso 40) como `highestMissingVariable`, forzando la repregunta atómica sobre los comensales.

---

## 1. Declaración de Intención (INVEST)

**Como** Arquitecto de Triaje y Flujo Dialógico,  
**Quiero** registrar la matriz declarativa `"gastronomy"` con un umbral de supervivencia del 70% y dotar a la Aduana Universal de una transición limpia de variables entre matrices en el triaje multivuelta,  
**Para** soportar rutas gastronómicas donde el tamaño del grupo sea la variable más crítica y permitir cambios de intención sin corromper el contexto acumulado de la sesión.

---

## 2. Criterios de Aceptación Certificados (Aduana de Fricción)

- [x] **CA-1 (Matriz Declarativa Gastronomy):** `DENSITY_MATRIX_REGISTRY` expone la matriz `"gastronomy"` con `survival_threshold: 70` y pesos declarativos: `group_size: 40`, `time_window: 25`, `vibe: 20`, `constraints: 15`.
- [x] **CA-2 (Priorización y Umbral en Gastronomy):** `calculateMatrixDensity('gastronomy', payload)` calcula el puntaje con base en las reglas especializadas: un payload que solo tenga `time_window` acumula 25% ($< 70\%$) y retorna `group_size` como `highestMissingVariable`. Al añadir `group_size` (40) y `vibe` (20), acumula 85% ($\ge 70\%$) y desbloquea el umbral.
- [x] **CA-3 (Transición Limpia de Matriz en Triaje):** En `TriageInputUseCase.execute()`, si el `matrixId` recibido difiere del registrado en el estado previo pero la sesión posee variables bajo `'default'`, se efectúa una migración segura que preserva los campos universales (`time_window`, `group_size`, `districts`, `constraints`, `vibe`, `mood`) e inicia la evaluación termodinámica contra el nuevo umbral y ponderación de reglas.
- [x] **CA-4 (Verificación de Oráculos):** Pruebas unitarias colocadas en [`src/features/planner/matrix.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/matrix.test.ts) y [`src/features/triage/triage.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/triage.test.ts) validando la matriz gastronómica y el cambio de matriz multivuelta (17/17 tests pasando al 100%), certificando con `tsc --noEmit` y ESLint (0 errores, 0 warnings).

---

## 3. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

1. **Compilador TypeScript (`tsc --noEmit`):**
   ```bash
   npx tsc --noEmit
   # Exit code: 0
   ```
2. **Linter AST (`eslint`):**
   ```bash
   npx eslint features/planner/matrix.ts features/planner/matrix.test.ts features/triage/triage-input.use-case.ts features/triage/triage.test.ts
   # Exit code: 0 (0 warnings, 0 errores)
   ```
3. **Suite de Pruebas Unitarias (`vitest`):**
   ```bash
   npx vitest run features/planner/matrix.test.ts features/triage/triage.test.ts
   # 17 tests pasados (100% verde)
   ```
