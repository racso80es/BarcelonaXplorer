# [OPERATIVO] Documento Destilado: PBI - Contratos de Percepción Sensorial y Puerto Meteorológico con Fail-Soft

**Identificador:** PBI-TRIAGE-IGN-001  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-26  
**Fecha de Culminación:** 2026-09-26  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 7.1 (Refinada): Ignición Contextual y Saludo Dinámico (Aduana Universal)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%207.1%20%28Refinada%29:%20Ignici%C3%B3n%20Contextual%20y%20Saludo%20Din%C3%A1mico%20%28Aduana%20Universal%29.md)  
**Módulo:** `src/features/triage/`  
**Entorno:** Next.js 16 (Node.js Runtime), Zod, Pure DI  
**Prioridad:** Alta (P1 - Bloqueante para la Ignición Contextual)  
**Estimación Táctica:** 2 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Forja de contratos de dominio tipados estrictamente con Zod para la captura sensorial del entorno del turista (hora, dispositivo, idioma, clima, memoria) y definición del puerto hexagonal meteorológico (`IWeatherPort`) con amortiguación térmica, timeout perimetral (200 ms), caché en memoria TTL y degradación elegante (Fail-Soft).
- **Entorno:** `src/features/triage/` (esquemas de ignición, Value Objects y puerto meteorológico).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Tolerancia Cero a la Inferencia):* Parseo estricto con esquemas Zod (`IgnitionSensoryContextSchema`, `TimeWindowPeriodEnum`, `DeviceTypeEnum`). Prohibido el uso de `any` o aserciones forzadas (`!`).
  - *Filtro B (Determinismo y Aislamiento):* Puerto e implementación meteorológica desacoplada de la UI y del middleware; si la fuente climática falla o agota el timeout de 200 ms, se devuelve un `WeatherReport` canónico por defecto sin romper la ejecución.
  - *Filtro C (Eficiencia Termodinámica):* Caché en memoria TTL (10 minutos) para evitar llamadas redundantes a APIs meteorológicas por cada petición.

---

## 1. Declaración de Intención (INVEST)

**Como** Arquitecto del Sistema BarcelonaXplorer,  
**Quiero** modelar los contratos de datos sensoriales y el puerto meteorológico resiliente en la Aduana Universal,  
**Para** proveer al motor de ignición una base determinista y protegida contra fallos de red al capturar las variables ambientales del usuario.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Esquemas Zod de Percepción Sensorial):** Definición en [`src/features/triage/ignition.schema.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/ignition.schema.ts) de:
  - `DeviceTypeEnum`: `'MOBILE' | 'DESKTOP' | 'TABLET'`.
  - `TimeWindowPeriodEnum`: `'DAWN' | 'MORNING' | 'AFTERNOON' | 'NIGHT'`.
  - `IgnitionSensoryContextSchema` y tipo `IgnitionSensoryContextDto` con validación estricta de `sessionId` (UUID), `detectedHour` (0-23), timestamps y variables ambientales opcionales.
  - Funciones puras `classifyTimeWindow(hour)` y `detectDeviceType(userAgent)`.
- [x] **CA-2 (Value Objects y Sobre de Retorno):** Definición de las interfaces y esquemas `IgnitionOutcomeSchema`, `IgnitionSparkSchema` y tipos inmutables `IgnitionOutcome`, `IgnitionSpark` y `WeatherReport`.
- [x] **CA-3 (Puerto y Adaptador Meteorológico con Fail-Soft):** Creación del puerto [`src/features/triage/weather.port.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/weather.port.ts) y su adaptador resiliente [`src/features/triage/open-meteo-weather.adapter.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/open-meteo-weather.adapter.ts) con:
  - Timeout por `AbortController` de 200 ms.
  - Caché en memoria con TTL de 10 minutos para coordenadas de Barcelona (41.3879, 2.1699).
  - Fallback determinista en caso de error de red o timeout (retorna reporte templado/despejado sin lanzar excepción).
- [x] **CA-4 (Colocated Tests S+ Grade):** Pruebas unitarias colocadas en [`src/features/triage/ignition.schema.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/ignition.schema.test.ts) (10 tests) y [`src/features/triage/weather.adapter.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/triage/weather.adapter.test.ts) (4 tests) pasando al 100% bajo Vitest.

---

## 3. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

1. **Compilador TypeScript (`tsc --noEmit`):**
   ```bash
   npx tsc --noEmit
   # Exit code: 0 (Verificado estrictamente sin aserciones ciegas ni any)
   ```
2. **Linter AST (`eslint`):**
   ```bash
   npm run lint
   # Exit code: 0 (0 warnings, 0 errores)
   ```
3. **Suite de Pruebas Unitarias (`vitest`):**
   ```bash
   npx vitest run features/triage/
   # Test Files: 3 passed (3)
   # Tests: 24 passed (24)
   # Duration: 1.77s
   ```
