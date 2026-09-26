# [OPERATIVO] Documento Destilado: PBI - Circuit Breaker y Fallback Resiliente para Proveedores de Afiliación

**Identificador:** PBI-RESIL-CIRCUIT-001  
**Estatus:** Realizado (S+ Grade)  
**Fecha de Creación:** 2026-09-26  
**Fecha de Culminación:** 2026-09-26  
**Historia de Usuario Relacionada:** [[OPERATIVO] Historia de Usuario: Optimización Kaizen, Resiliencia Perimetral y Eficiencia Cognitiva v2.1.0](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/HistoriasDeUsuario/%5BOPERATIVO%5D%20Historia%20de%20Usuario:%20Estabilizaci%C3%B3n%20Evolutiva%20y%20Saneamiento%20Post-Anclaje%20v2.0.1.md)  
**Auditoría Vinculada:** [AUD-OPS-ANCHOR-001](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Auditorias/Auditoria%20-%20Ciclo%20Evolutivo%20v2.0.0-a-c82b741.md)  
**Fuente Base Vinculada:** [Ancla Evolutiva BarcelonaXplorer_01.md](file:///home/racso/Proyectos/BarcelonaXplorer/Documentacion/Fuentes/Ancla%20Evolutiva%20BarcelonaXplorer_01.md)  
**Módulo:** `src/features/planner/affiliate/`  
**Entorno:** TypeScript 5, Node.js HTTP/Fetch Timeout, Pure Domain State Machine  
**Prioridad:** Media (P2 - Resiliencia y Tolerancia a Fallos de Terceros)  
**Estimación Táctica:** 2 Story Points  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Envoltorio de resiliencia mediante el patrón *Circuit Breaker* (estados: *CLOSED*, *OPEN*, *HALF_OPEN*) sobre las llamadas de red a proveedores externos (TheFork, Civitatis, GetYourGuide, Cabify), con degradación elegante a catálogo estático curado localmente ante latencias excesivas o fallos reiterados.
- **Entorno:** `src/features/planner/affiliate/affiliate-enricher.service.ts` y adaptadores de red.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Rigor Técnico):* Máquina de estados determinista. Si se registran 3 fallos consecutivos o timeouts $> 1500\text{ ms}$, el interruptor se abre (`OPEN`), evitando llamadas salientes durante una ventana de enfriamiento de 30 segundos.
  - *Filtro B (Determinismo y Soberanía):* En estado `OPEN`, el sistema inyecta recomendaciones del catálogo estático offline (`static-affiliate-catalog.ts`), manteniendo la experiencia de usuario y la tasa de conversión sin bloquear el renderizado del itinerario.
  - *Filtro C (Eficiencia Operativa):* Eliminación total de timeouts colgados en el hilo principal del servidor BFF.

---

## 1. Declaración de Intención (INVEST)

**Como** Arquitecto de Resiliencia y Estabilidad Operativa (Vértice Biológico),  
**Quiero** aislar las consultas a APIs de terceros mediante un interruptor de circuito determinista,  
**Para** proteger al orquestador frente a la lentitud o caídas de TheFork o Civitatis, garantizando que el turista siempre reciba su itinerario enriquecido sin demoras.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Máquina de Estados Circuit Breaker):** Implementación de la clase de dominio puro [`src/features/planner/affiliate/circuit-breaker.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/affiliate/circuit-breaker.ts) con transiciones tipadas entre `CLOSED`, `OPEN` y `HALF_OPEN`.
- [x] **CA-2 (Timeout Defensivo en Adaptadores):** Integración de `AbortController` con timeout configurable (defecto 1500ms) protegiendo las llamadas contra colapsos por latencia.
- [x] **CA-3 (Fallback Táctico a Catálogo Estático):** En [`src/features/planner/affiliate/affiliate-enricher.service.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/affiliate/affiliate-enricher.service.ts), ante circuito `OPEN` se recurre a [`static-affiliate-catalog.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/affiliate/static-affiliate-catalog.ts), devolviendo itinerarios etiquetados con `(Catálogo Resiliente)`.
- [x] **CA-4 (Verificación de Oráculos):** Pruebas unitarias colocadas en [`src/features/planner/affiliate/circuit-breaker.test.ts`](file:///home/racso/Proyectos/BarcelonaXplorer/src/features/planner/affiliate/circuit-breaker.test.ts) (6 tests pasando al 100%) simulando fallos consecutivos, apertura del circuito, respuesta instantánea de fallback y recuperación controlada en `HALF_OPEN`.

---

## 3. Evidencia de Certificación de Oráculos (Santa Trinidad S+)

1. **Compilador TypeScript (`tsc --noEmit`):**
   ```bash
   npx tsc --noEmit
   # Exit code: 0
   ```
2. **Linter AST (`eslint`):**
   ```bash
   npm run lint
   # Exit code: 0 (0 warnings, 0 errores)
   ```
3. **Suite de Pruebas Unitarias (`vitest`):**
   ```bash
   npm test features/planner/affiliate
   # 2 suites pasadas, 9 tests pasados (100% verde)
   ```
