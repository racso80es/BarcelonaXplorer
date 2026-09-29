# [OPERATIVO] Documento Destilado: PBI - Sensor de Salud de Proveedores y Circuit Breaker en IA Gateway

**Identificador:** PBI-GW-004
**Estatus:** Pendiente
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [Historia de Usuario 16: Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Motor](../../HistoriasDeUsuario/Historia%20de%20Usuario%2016:%20Microservicio%20IA%20Gateway%20(Aduana%20Universal)%20y%20Enrutamiento%20Multi-Modal.md)
**Módulo:** `ia-gateway/src/health/`
**Entorno:** Gateway, módulo interno
**Prioridad:** Alta (P1)
**Estimación Táctica:** 3 Story Points
**Depende de:** PBI-GW-001
**Bloqueo:** —

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Módulo de salud con dos fuentes: pasiva (ventana deslizante de latencia y errores de peticiones reales) y activa (sondas periódicas contra endpoints de descubrimiento sin coste: `GET /v1/models`). Implementación del patrón circuit breaker con umbrales configurables.
- **Entorno:** Gateway, módulo interno.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Diseño Declarativo):* El circuit breaker tiene tres estados: cerrado (sano), abierto (cortocircuito) y semi-abierto (prueba). Las transiciones son declarativas con umbrales configurables.
  - *Filtro B (Eficiencia):* Las sondas activas miden disponibilidad, no latencia de inferencia; no consumen créditos ni tokens.
  - *Filtro C (Cero Latencia Adicional):* La consulta de salud es síncrona (lectura de estado en memoria); no añade latencia a las peticiones.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,
**Quiero** que el gateway mantenga un estado de salud por proveedor con cortocircuito automático,
**Para** que las peticiones se enruten al proveedor más sano sin esperar timeouts repetidos.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Ventana Deslizante Pasiva):** Registra latencia y código de respuesta de cada petición real. Umbral configurable de tasa de error y de latencia p95 para abrir el circuito.
- [ ] **CA-2 (Circuit Breaker):** Implementación con estados `CLOSED`, `OPEN`, `HALF_OPEN`. Al abrirse, rechaza peticiones al proveedor durante un período configurable; al pasar a semi-abierto, permite una petición de prueba.
- [ ] **CA-3 (Sondas Activas):** Tarea periódica que consulta `GET /v1/models` (Jev AI), listado de modelos de Gemini y de Groq. Si falla, marca el proveedor como degradado sin abrir el circuito.
- [ ] **CA-4 (API Interna):** `getHealthiestProvider(engineType): Provider | null` devuelve el primer proveedor sano de la matriz, o `null` si todos están en cortocircuito.
- [ ] **CA-5 (Tests):** Tests que cubren: registro de error abre el circuito, transición a semi-abierto tras timeout, recuperación con petición exitosa, sonda fallida degrada sin cortocircuito.
- [ ] **CA-6 (Oráculos):** `tsc --noEmit` y tests en verde. Cero `any`.
