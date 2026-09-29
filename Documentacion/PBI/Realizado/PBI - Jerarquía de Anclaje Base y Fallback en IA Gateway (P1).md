# [OPERATIVO] Documento Destilado: PBI - Jerarquía de Anclaje Base y Fallback en IA Gateway

**Identificador:** PBI-GW-005  
**Estatus:** Completado  
**Fecha de Creación:** 2026-09-29  
**Fecha de Culminación:** 2026-09-29  
**Historia de Usuario Relacionada:** [Historia de Usuario 16: Microservicio IA Gateway (Aduana Universal) y Enrutamiento Multi-Motor](../../HistoriasDeUsuario/Historia%20de%20Usuario%2016:%20Microservicio%20IA%20Gateway%20(Aduana%20Universal)%20y%20Enrutamiento%20Multi-Modal.md)  
**Módulo:** `ia-gateway/src/endpoints/llm/`, `ia-gateway/src/health/`  
**Entorno:** Gateway, configuración por variables de entorno  
**Prioridad:** Alta (P1)  
**Estimación Táctica:** 2 Story Points  
**Depende de:** PBI-GW-003, PBI-GW-004  
**Bloqueo:** Ninguno (Decisión D-3 resuelta)  

---

### Matriz de Indexación Tridimensional (Protocolo de Acero)

- **Naturaleza:** Lógica de anclaje que utiliza `DEFAULT_FAST_LLM` y `DEFAULT_REASONING_LLM` como último recurso cuando todos los proveedores sanos de una matriz fallan o están en cortocircuito. Incluye la restricción de proveedor distinto y la respuesta ante agotamiento total.
- **Entorno:** `ia-gateway/src/endpoints/llm/fallback.config.ts`, `llm.handler.ts`.
- **Entropía Asimilada (Filtros A, B y C):**
  - *Filtro A (Restricción de Proveedor):* El anclaje base pertenece a un proveedor distinto del principal de la matriz (`FAST_LLM` principal Groq → anclaje Google; `REASONING_LLM` principal Google → anclaje Groq); se valida y advierte al arranque.
  - *Filtro B (Degradación Controlada):* Si el anclaje también falla, `OperationEnvelope` con `success: false`, `exitCode: 503` y mensaje descriptivo. Sin error 500 crudo.
  - *Filtro C (Trazabilidad):* Telemetría marca `fallbackTriggered: true` y `attemptedProviders` lista toda la cascada incluyendo la etiqueta `(anchor)`.

---

## 1. Declaración de Intención (INVEST)

**Como** Operador Técnico,  
**Quiero** que el gateway tenga un modelo de último recurso por modalidad que se active cuando toda la matriz falla,  
**Para** maximizar la disponibilidad del servicio y mantener la degradación controlada.

---

## 2. Criterios de Aceptación (Aduana de Fricción)

- [x] **CA-1 (Variables):** `DEFAULT_FAST_LLM` y `DEFAULT_REASONING_LLM` con formato `<proveedor>:<modelo>` (p. ej. `google:gemini-2.5-flash`, `groq:llama-3.3-70b-versatile`). Validadas al arranque con Zod.
- [x] **CA-2 (Restricción de Proveedor):** Si el anclaje comparte proveedor con el principal de la matriz, el gateway emite warning explícito en logs advirtiendo del riesgo de caída acoplada.
- [x] **CA-3 (Cascada Completa):** Si todos los proveedores de la matriz + el anclaje fallan, responde `OperationEnvelope` con `success: false`, `exitCode: 503` y `errors` descriptivos. Sin `500` crudo.
- [x] **CA-4 (Métricas de Fallback):** `fallbackTriggered: true` y `attemptedProviders` reflejan la cascada completa y el anclaje utilizado.
- [x] **CA-5 (Tests):** Tests que cubren: anclaje exitoso tras fallo de matriz, anclaje también falla (agotamiento total 503), y validación de sintaxis de formato de anclaje.
- [x] **CA-6 (Oráculos):** `tsc --noEmit`, `eslint` y vitest en verde. Cero `any`.

---

## 3. Evidencia de Certificación de Oráculos

1. **Vitest en IA Gateway:**
   - 8 archivos de test (`fallback.test.ts`, `llm.test.ts`, `health.test.ts`, `decision.test.ts`, `envelope.test.ts`, `auth.test.ts`, `schemas.test.ts`, `server.test.ts`).
   - 34 tests ejecutados y superados al 100%.
2. **TypeScript (`tsc --noEmit`):**
   - 0 errores con compilador estricto.
3. **Linter AST en Monolito (`eslint`):**
   - 0 advertencias, 0 errores.
