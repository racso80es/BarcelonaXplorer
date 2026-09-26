# [OPERATIVO] Documento Destilado: PBI - Contratos Zod, Variantes CVA y Componente Visual ThermalMeter

**Identificador:** PBI-TRIAGE-THM-001  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-26  
**Fecha de Culminación:** 2026-09-26  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 8 (Refinada): Gamificación Sensorial y Medidor Térmico Agnóstico (UI-UX)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%208%20%28Refinada%29:%20Gamificaci%C3%B3n%20Sensorial%20y%20Medidor%20T%C3%A9rmico%20Agn%C3%B3stico%20%28UI-UX%29.md)  
**Módulo:** `src/features/triage/components/`  
**Entorno:** Next.js 16 (React 19 Client Component), Tailwind CSS v4, `class-variance-authority`, Zod  
**Prioridad:** Alta (P1 - Bloqueante para la Gamificación Sensorial)  
**Estimación Táctica:** 2 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Forja del componente presentacional `ThermalMeter` desacoplado de reglas de negocio (Dumb Component), gobernado por `class-variance-authority` (CVA) bajo los 3 estados termodinámicos canónicos (`inert`, `operational`, `saturated`), con contratos de props tipados con Zod y cumplimiento estricto del sistema de diseño en tema claro de alta luminosidad.
- **Entorno:** `src/features/triage/components/thermal-meter.tsx` y colocated tests `thermal-meter.test.tsx`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Tolerancia Cero a la Inferencia):* Parseo estricto de props mediante `ThermalMeterPropsSchema` (Zod), garantizando que porcentajes y umbrales sean valores numéricos acotados (0-100).
  - *Filtro B (Agnosticismo y Principio Abierto/Cerrado):* El componente desconoce los pesos algorítmicos o las matrices temáticas de backend; consume directamente `score`, `survivalThreshold`, `isThresholdSatisfied` y `missingVariable`.
  - *Filtro C (Accesibilidad y Eficiencia):* Atributos semánticos ARIA (`role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`), micro-animaciones declarativas sin re-renders en cascada.

---

## 1. Declaración de Intención (INVEST)

**Como** Desarrollador Frontend y Diseñador de Interacción de BarcelonaXplorer,  
**Quiero** forjar el componente visual `ThermalMeter` con variantes CVA declarativas y tipado Zod en el vertical slice de triaje,  
**Para** proveer al orquestador de un indicador termodinámico sensible, elegante y accesible que exprese el nivel de densidad del itinerario sin fricción cognitiva.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Contratos Zod y Tipado Determinista):** Definición en [`src/features/triage/components/thermal-meter.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/components/thermal-meter.tsx) de `ThermalMeterPropsSchema` y tipo `ThermalMeterProps` (`score`, `survivalThreshold`, `isThresholdSatisfied`, `missingVariable`, `matrixId`, `onForceDispatch`, `isDispatching`, `className`).
- [x] **CA-2 (Variantes CVA Declarativas en Tema Claro):** Implementación de `thermalMeterVariants` con tres estados:
  - `inert`: `bg-surface-subtle border-layout-divider-strong text-content-meta shadow-2xs`.
  - `operational`: `bg-emerald-50/70 border-emerald-300 text-content-accent shadow-xs ring-1 ring-emerald-500/20`.
  - `saturated`: `bg-emerald-100/80 border-emerald-400 text-emerald-950 font-semibold shadow-sm ring-2 ring-emerald-500/30`.
- [x] **CA-3 (Micro-Indicador Visual y Acción de Despacho):**
  - Renderizado de barra de progreso con atributos accesibles `role="progressbar"`.
  - Chip contextual de variable crítica faltante en fase inerte (ej. `Falta: time_window`).
  - Mensaje de confirmación de umbral superado en fase operacional y distintivo táctico en fase saturada (`Modo Explorador S+ Grade Desbloqueado`).
  - Botón de despacho ("Forjar Ruta Inmediata") habilitado solo si `isThresholdSatisfied === true`.
- [x] **CA-4 (Colocated Tests S+ Grade):** Pruebas unitarias colocadas en [`src/features/triage/components/thermal-meter.test.tsx`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/components/thermal-meter.test.tsx) verificando los 3 estados termodinámicos, atributos ARIA y comportamiento del disparador de despacho (7 tests al 100% verde).

---

## 3. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

1. **Compilador TypeScript (`tsc --noEmit`):**
   ```bash
   npx tsc --noEmit
   # Exit code: 0 (Cero errores de compilación)
   ```
2. **Linter AST (`eslint`):**
   ```bash
   npm run lint
   # Exit code: 0 (0 warnings, 0 errores)
   ```
3. **Suite de Pruebas Unitarias Colocadas (`vitest`):**
   ```bash
   npx vitest run features/triage/components/
   # Test Files: 1 passed (1)
   # Tests: 7 passed (7)
   # Duration: 1.27s
   ```
