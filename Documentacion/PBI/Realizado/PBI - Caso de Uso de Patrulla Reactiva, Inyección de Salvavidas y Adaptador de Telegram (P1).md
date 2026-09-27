# [OPERATIVO] Documento Destilado: PBI - Caso de Uso de Patrulla Reactiva, Inyección de Salvavidas y Adaptador de Telegram

**Identificador:** PBI-EDA-REACTIVE-PATROL-002  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-27  
**Fecha de Culminación:** 2026-09-27  
**Historia de Usuario Relacionada:** [[ARQUITECTURA] Historia de Usuario 11: Ecosistema Reactivo y Drops de Alivio (Fase de Ejecución en Tiempo Real - Visión Futura)](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BARQUITECTURA%5D%20Historia%20de%20Usuario%2011:%20Ecosistema%20Reactivo%20y%20Drops%20de%20Alivio%20%28Fase%20de%20Ejecuci%C3%B3n%20en%20Tiempo%20Real%20-%20Visi%C3%B3n%20Futura%29.md)  
**Módulo:** `src/features/telegram/reactive/`  
**Entorno:** TypeScript 5.8+, Pure DI, Vitest  
**Prioridad:** Alta (P1 - Lógica Reactiva y Orquestación EDA)  
**Estimación Táctica:** 5 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Implementación del caso de uso de patrulla reactiva (`ReactivePatrolUseCase`) orquestando detección de fatiga por distancia y entropía meteorológica en tiempo real, integrando el envío de mensajes y botones interactivos a través de `TelegramBotGatewayPort`.
- **Entorno:** `src/features/telegram/reactive/reactive-patrol.use-case.ts`, `src/features/telegram/reactive/reactive-patrol.use-case.port.ts` y pruebas colocadas `reactive-patrol.use-case.test.ts`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Tolerancia Cero a la Inferencia):* Tipado estricto mediante sobre canónico `OperationEnvelope<ReactivePatrolResult>`.
  - *Filtro B (Táctica del Refugio y Salvavidas Asíncrono):* Detección proactiva de condiciones adversas meteorológicas mediante `IWeatherPort` e inyección de salvavidas CPA de movilidad (Escenario 1) o refugio cultural (Escenario 2).
  - *Filtro C (Resiliencia Fail-Soft):* La indisponibilidad puntual de la API meteorológica o de Telegram se absorbe sin lanzar excepciones no controladas ni interrumpir el servicio.

---

## 1. Declaración de Intención (INVEST)

**Como** Motor Reactivo y Centinela Proactivo de BarcelonaXplorer,  
**Quiero** evaluar periódica o reactivamente el estado de fatiga y el clima de los usuarios en ruta activa con Telegram anclado,  
**Para** enviar drops de auxilio en tiempo real (descuentos de Cabify ante fatiga > 5km o refugio inmediato ante lluvia inminente) directamente a sus teléfonos móviles.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Evaluación de Fatiga Geométrica - Escenario 1):** Si el usuario acumula > 5 km a pie y se aproxima a un nodo distante, emitir mensaje por Telegram con botón CPA de movilidad ("Llevas mucha tralla en las piernas...").
- [x] **CA-2 (Refugio Táctico por Clima Adverso - Escenario 2):** Si el sensor de clima detecta lluvia o adversidad inminente, reevaluar el itinerario y despachar sugerencia del refugio cubierto más cercano (`findNearestIndoorShelter`) con botón CPA directo.
- [x] **CA-3 (Inyección Pura de Dependencias y Fail-Soft):** `ReactivePatrolUseCase` recibe `TelegramBotGatewayPort` y `IWeatherPort` por constructor sin acoplamiento a singletons. Manejo tolerante a fallos retornando `OperationEnvelope`.
- [x] **CA-4 (Colocated Tests S+ Grade):** Pruebas unitarias completas simulando escenarios de fatiga, lluvia y contingencia de red con 100% de aserciones deterministas (6 tests colocados adicionales, 17 en total para el módulo).

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
   # Test Files: 3 passed (3)
   # Tests: 17 passed (17)
   # Duration: 744ms
   ```
