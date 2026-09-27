# [OPERATIVO] Documento Destilado: PBI - Esquemas Deterministas, Value Objects y Contratos de Drops de Alivio y Refugio

**Identificador:** PBI-EDA-DROPS-CONTRACTS-001  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-27  
**Fecha de Culminación:** 2026-09-27  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 11: Ecosistema Reactivo y Drops de Alivio (Fase de Ejecución en Tiempo Real - Visión Futura)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%2011:%20Ecosistema%20Reactivo%20y%20Drops%20de%20Alivio%20%28Fase%20de%20Ejecuci%C3%B3n%20en%20Tiempo%20Real%20-%20Visi%C3%B3n%20Futura%29.md)  
**Módulo:** `src/features/telegram/reactive/`  
**Entorno:** TypeScript 5.8+, Zod 4+, Vitest  
**Prioridad:** Alta (P1 - Núcleo de Dominio y Contratos EDA)  
**Estimación Táctica:** 3 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Modelado de Value Objects inmutables de fatiga geométrica con cálculo Haversine determinista, esquemas Zod canónicos para eventos reactivos de socorro ("Drops") y catálogo estático de refugios tácticos interiores en Barcelona.
- **Entorno:** `src/features/telegram/reactive/geometric-fatigue.vo.ts`, `src/features/telegram/reactive/reactive-drops.schema.ts`, `src/features/telegram/reactive/indoor-tactical-shelters.ts`, colocated tests y exportación en `src/features/telegram/index.ts`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Tolerancia Cero a la Inferencia - Axioma II):* Erradicación de tipos `any` y primitivos no validados. Esquematización Zod de peticiones y respuestas para drops de movilidad (`FatigueReliefDropPayload`) y drops de refugio ambiental (`WeatherShelterDropPayload`).
  - *Filtro B (Localidad de Comportamiento - Axioma I):* Cálculo geodésico y evaluación de fatiga en un Value Object inmutable colocated (`GeometricFatigueVo`), desacoplado de dependencias externas.
  - *Filtro C (Táctica del Refugio y Salvavidas CPA):* Catálogo inmutable de refugios ante lluvia con identificación de aforo interior y enlaces CPA verificados.

---

## 1. Declaración de Intención (INVEST)

**Como** Arquitecto de Dominio y Desarrollador Backend de BarcelonaXplorer,  
**Quiero** forjar los contratos deterministas Zod, el Value Object inmutable de fatiga geométrica y el catálogo táctico de refugios interiores,  
**Para** proveer al motor reactivo de estructuras de datos estrictas, matemáticas geodésicas deterministas y opciones de auxilio físico sin alucinaciones.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Value Object Geodésico Inmutable):** Crear `GeometricFatigueVo` con cálculo de distancia Haversine entre coordenadas consecutivas y evaluación de superación de umbral de fatiga (5.0 km / 5000 m).
- [x] **CA-2 (Esquemas Deterministas Zod):** Crear esquemas Zod canónicos para drops de fatiga (`FatigueReliefDropPayloadSchema`) y refugio ambiental (`WeatherShelterDropPayloadSchema`), con validación de URLs CPA y botones de acción rápida.
- [x] **CA-3 (Catálogo Inmutable de Refugios de Barcelona):** Diseñar catálogo declarativo de refugios interiores de contingencia ante lluvia (`INDOOR_TACTICAL_SHELTERS`) con coordenadas, horario interior y enlace CPA verificado, junto con la función geodésica determinista `findNearestIndoorShelter`.
- [x] **CA-4 (Colocated Tests S+ Grade):** Pruebas unitarias colocadas verificando el cálculo de distancias, validación de esquemas y retornos sin desbordamientos de precisión matemática (11 tests en verde).

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
3. **Oráculo de Pruebas Unitarias (`vitest`):**
   ```bash
   npx vitest run features/telegram/reactive/
   # Test Files: 2 passed (2)
   # Tests: 11 passed (11)
   # Duration: 598ms
   ```
