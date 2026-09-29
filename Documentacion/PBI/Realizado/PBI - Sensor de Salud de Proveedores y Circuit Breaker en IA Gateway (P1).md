# [OPERATIVO] Documento Destilado: PBI - Sensor de Salud de Proveedores y Circuit Breaker en IA Gateway

**Identificador:** PBI-GW-004  
**Estatus:** Completado  
**Fecha de Creación:** 2026-09-29  
**Fecha de Culminación:** 2026-09-29  
**Historia de Usuario Relacionada:** [Historia de Usuario 16: Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Motor](../../HistoriasDeUsuario/Historia%20de%20Usuario%2016:%20Microservicio%20IA%20Gateway%20(Aduana%20Universal)%20y%20Enrutamiento%20Multi-Modal.md)  
**Módulo:** `ia-gateway/src/health/`  
**Entorno:** Gateway, módulo interno de resiliencia  
**Prioridad:** Alta (P1)  
**Estimación Táctica:** 3 Story Points  
**Depende de:** PBI-GW-001  
**Bloqueo:** Ninguno  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Módulo de salud con dos fuentes: pasiva (ventana deslizante de latencia y errores de peticiones reales) y activa (sondas periódicas contra endpoints de descubrimiento sin coste: `GET /v1/models`). Implementación del patrón circuit breaker con umbrales configurables.
- **Entorno:** `ia-gateway/src/health/`, orquestación con matrices declarativas (`FAST_LLM`, `REASONING_LLM`, `TYPED_DECISION`).
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Diseño Declarativo):* Circuit breaker con máquina de estados finita (`CLOSED`, `OPEN`, `HALF_OPEN`) y transiciones deterministas.
  - *Filtro B (Eficiencia):* Sondas activas gratuitas sobre modelos upstream que detectan disponibilidad sin consumir tokens ni alterar saldo.
  - *Filtro C (Cero Latencia Adicional):* Evaluación de salud síncrona en memoria para selección de proveedor en tiempo O(1).

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,  
**Quiero** que el gateway mantenga un estado de salud por proveedor con cortocircuito automático,  
**Para** que las peticiones se enruten al proveedor más sano sin esperar timeouts repetidos.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Ventana Deslizante Pasiva):** Registra latencia y código de respuesta de cada petición real. Umbral configurable de fallos consecutivos y de latencia p95 para abrir el circuito.
- [x] **CA-2 (Circuit Breaker):** Implementación con estados `CLOSED`, `OPEN`, `HALF_OPEN`. Al abrirse, rechaza peticiones al proveedor durante el período de recuperación; al pasar a semi-abierto, permite una única petición de prueba antes de recuperarse o volver a abrir.
- [x] **CA-3 (Sondas Activas):** Tarea periódica y bajo demanda que consulta endpoints de modelos (`/v1/models`). Si falla, marca el proveedor como degradado sin abrir el circuito.
- [x] **CA-4 (API Interna):** `getHealthiestProvider(engineType): Provider | null` devuelve el primer proveedor sano de la matriz (según decisión D-3), o `null` si todos están en cortocircuito.
- [x] **CA-5 (Tests):** Tests que cubren: registro de fallos abre el circuito, transición a semi-abierto tras timeout, recuperación con petición exitosa, sonda fallida degrada sin cortocircuito y enrutamiento en cascada por matriz.
- [x] **CA-6 (Oráculos):** `tsc --noEmit`, `eslint` y tests en verde. Cero `any`.

---

## 3. Evidencia de Certificación de Oráculos

1. **Vitest en IA Gateway:**
   - 6 archivos de test (`health.test.ts`, `decision.test.ts`, `envelope.test.ts`, `auth.test.ts`, `schemas.test.ts`, `server.test.ts`).
   - 25 tests superados al 100%.
2. **TypeScript (`tsc --noEmit`):**
   - 0 errores con tipado estricto.
3. **Linter AST en Monolito (`eslint`):**
   - 0 advertencias, 0 errores.
