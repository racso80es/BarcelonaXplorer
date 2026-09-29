# [OPERATIVO] Documento Destilado: PBI - Jerarquía de Anclaje Base y Fallback en IA Gateway

**Identificador:** PBI-GW-005
**Estatus:** Pendiente (bloqueado por D-3)
**Fecha de Creación:** 2026-09-29
**Historia de Usuario Relacionada:** [Historia de Usuario 16: Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Motor](../../HistoriasDeUsuario/Historia%20de%20Usuario%2016:%20Microservicio%20IA%20Gateway%20(Aduana%20Universal)%20y%20Enrutamiento%20Multi-Modal.md)
**Módulo:** `ia-gateway/src/endpoints/llm/`, `ia-gateway/src/health/`
**Entorno:** Gateway, configuración por variables de entorno
**Prioridad:** Alta (P1)
**Estimación Táctica:** 2 Story Points
**Depende de:** PBI-GW-003, PBI-GW-004
**Bloqueo:** Decisión D-3 (matrices de proveedores por modalidad)

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Lógica de anclaje que utiliza `DEFAULT_FAST_LLM` y `DEFAULT_REASONING_LLM` como último recurso cuando todos los proveedores de una matriz están en cortocircuito. Incluye la restricción de proveedor distinto y la respuesta ante agotamiento total.
- **Entorno:** Gateway, configuración por variables de entorno.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Restricción de Proveedor):* El anclaje pertenece a un proveedor distinto del principal de la matriz; se valida al arranque.
  - *Filtro B (Degradación Controlada):* Si el anclaje también falla, `OperationEnvelope` con `success: false` y mensaje descriptivo. El monolito aplica su respuesta Fail-Soft existente.
  - *Filtro C (Trazabilidad):* Telemetría marca `fallbackTriggered: true` y `attemptedProviders` lista todos los intentos.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,
**Quiero** que el gateway tenga un modelo de último recurso por modalidad que se active cuando toda la matriz falla,
**Para** maximizar la disponibilidad del servicio y mantener la degradación controlada.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [ ] **CA-1 (Variables):** `DEFAULT_FAST_LLM` y `DEFAULT_REASONING_LLM` con formato `<proveedor>:<modelo>` (p. ej. `groq:qwen/qwen3.8-27b`, `google:gemini-1.5-flash`). Validadas al arranque con Zod.
- [ ] **CA-2 (Restricción de Proveedor):** Si el anclaje comparte proveedor con el principal de la matriz, el gateway arranca con warning explícito en logs (y opcionalmente rechaza el arranque — según D-3).
- [ ] **CA-3 (Cascada Completa):** Si todos los proveedores de la matriz + el anclaje fallan, responde `OperationEnvelope` con `success: false`, `exitCode: 503` y `errors` descriptivos. Sin `500` crudo.
- [ ] **CA-4 (Métricas de Fallback):** `fallbackTriggered: true` y `attemptedProviders` reflejan la cascada completa.
- [ ] **CA-5 (Tests):** Tests que cubren: anclaje exitoso tras fallo de matriz, anclaje también falla (agotamiento total), y validación de proveedor distinto al arranque.
- [ ] **CA-6 (Oráculos):** `tsc --noEmit` y tests en verde. Cero `any`.
